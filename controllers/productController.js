const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const Review = require("../models/reviewModel");
const filterProductForUser = require("../utils/filterProductForUser");
const cloudinary = require("cloudinary").v2;


const uploadToCloudinary = (file, folder) => {
  return cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
  folder,
  quality: "auto",
  fetch_format: "auto",
}

  );
};




// ================= GET ALL PRODUCTS =================
exports.getAllProducts = asyncErrorHandler(async (req, res) => {
  const resultPerPage = 12;
  const productsCount = await Product.countDocuments();

  const searchFeature = new SearchFeatures(
    Product.find(),
    req.query
  ).search(); // 🔥 ONLY search

  searchFeature.pagination(resultPerPage);

  const products = await searchFeature.query;

  for (let product of products) {
  const reviews = await Review.find({ product: product._id });

  const numOfReviews = reviews.length;

  const ratings =
    numOfReviews === 0
      ? 0
      : reviews.reduce((acc, r) => acc + r.rating, 0) / numOfReviews;

  product._doc.numOfReviews = numOfReviews;
  product._doc.ratings = Number(ratings.toFixed(1));
}


  res.status(200).json({
    success: true,
    products,   // FULL prices object
    productsCount,
    resultPerPage,
    filteredProductsCount: products.length,
  });
});

// ================= GET PRODUCTS (SLIDER) =================
exports.getProducts = asyncErrorHandler(async (req, res) => {
  const products = await Product.find();

  for (let product of products) {
    const reviews = await Review.find({ product: product._id });

    const numOfReviews = reviews.length;

    const ratings =
      numOfReviews === 0
        ? 0
        : reviews.reduce((acc, r) => acc + r.rating, 0) / numOfReviews;

    product._doc.numOfReviews = numOfReviews;
    product._doc.ratings = Number(ratings.toFixed(1));
  }

  res.status(200).json({
    success: true,
    products,
  });
});


// ================= PRODUCT DETAILS =================
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id)
 

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  product = product.toObject();

  if (req.user?.role !== "admin") {
  product = filterProductForUser(product, req.user?.role);
}


  res.status(200).json({
    success: true,
    product,
  });
});


// ================= ADMIN PRODUCTS =================
exports.getAdminProducts = asyncErrorHandler(async (req, res) => {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
});

// ================= CREATE PRODUCT (CLOUDINARY) =================
// ================= CREATE PRODUCT (CLOUDINARY) =================
exports.createProduct = asyncErrorHandler(async (req, res, next) => {

  // 🔴 Validation
  if (!req.files || !req.files.images || !req.files.logo) {
    return next(new ErrorHandler("Product images or brand logo missing", 400));
  }

  // ================= PRODUCT IMAGES =================
  let images = [];

  for (let file of req.files.images) {
    const result = await uploadToCloudinary(file, "ecommerce/products");

    images.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  // ================= BRAND LOGO =================
  const logoFile = req.files.logo[0];
  const logoResult = await uploadToCloudinary(logoFile, "ecommerce/brands");


  // ================= HIGHLIGHTS =================
  if (req.body.highlights) {
    req.body.highlights = Array.isArray(req.body.highlights)
      ? req.body.highlights
      : [req.body.highlights];
  }

  // ================= SPECIFICATIONS =================
  let specifications = [];
  if (req.body.specifications) {
    if (Array.isArray(req.body.specifications)) {
      req.body.specifications.forEach((s) =>
        specifications.push(JSON.parse(s))
      );
    } else {
      specifications.push(JSON.parse(req.body.specifications));
    }
  }

  // ================= FINAL PRODUCT DATA =================
 const brandName = req.body.brand;

if (!brandName) {
  return next(new ErrorHandler("Brand name is required", 400));
}

const productData = {
  name: req.body.name,
  description: req.body.description,
  category: req.body.category,

  brand: {
    name: brandName,
    logo: {
      public_id: logoResult.public_id,
      url: logoResult.secure_url,
    },
  },

  images,
  highlights: req.body.highlights || [],
  specifications,

  prices: {
    distributor: Number(req.body.distributorPrice),
    dealer: Number(req.body.dealerPrice),
    customer: Number(req.body.customerPrice),
  },

  stock: Number(req.body.stock),
  warranty: Number(req.body.warranty),
  user: req.user.id,
};


  // ================= SAVE PRODUCT =================
  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    product,
  });
});


// ================= UPDATE PRODUCT (CLOUDINARY) =================
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {

  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  /* ================= DELETE SELECTED OLD IMAGES ================= */
if (req.files?.images && Array.isArray(product.images)) {
  for (let img of product.images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }
}




if (req.files?.logo) {
  if (product.brand?.logo?.public_id) {
    await cloudinary.uploader.destroy(
      product.brand.logo.public_id
    );
  }

  const logoFile = req.files.logo[0];
  const logoResult = await uploadToCloudinary(logoFile, "ecommerce/brands");

  product.brand.logo = {
    public_id: logoResult.public_id,
    url: logoResult.secure_url,
  };
}



  

  /* ================= UPDATE FIELDS ================= */
  product.name = req.body.name;
  product.description = req.body.description;
  product.category = req.body.category;
  if (req.body.brand) {
  product.brand = product.brand || {};
  product.brand.name = req.body.brand;
}

  product.prices = {
    distributor: Number(req.body.distributorPrice),
    dealer: Number(req.body.dealerPrice),
    customer: Number(req.body.customerPrice),
  };

  product.stock = Number(req.body.stock);
  product.warranty = Number(req.body.warranty);

  if (req.body.highlights) {
    product.highlights = Array.isArray(req.body.highlights)
      ? req.body.highlights
      : [req.body.highlights];
  }

  if (req.body.specifications) {
    const specs = []
      .concat(req.body.specifications)
      .map((s) => JSON.parse(s));
    product.specifications = specs;
  }

  await product.save();

  res.status(200).json({
    success: true,
    product,
  });
});


// ================= DELETE PRODUCT (CLOUDINARY) =================
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  /* ================= DELETE PRODUCT IMAGES ================= */
  if (Array.isArray(product.images)) {
  for (let img of product.images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id); // ✅ here
    }
  }
}


  /* ================= DELETE BRAND LOGO ================= */
  if (product.brand?.logo?.public_id) {
  await cloudinary.uploader.destroy(   // ✅ here
    product.brand.logo.public_id
  );
}


  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});



