const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const Review = require("../models/reviewModel");
const filterProductForUser = require("../utils/filterProductForUser");
const path = require('path');
const fs = require('fs');



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


  product = filterProductForUser(product, req.user?.role);

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

// ================= CREATE PRODUCT (MULTER FIXED) =================
exports.createProduct = asyncErrorHandler(async (req, res, next) => {

    console.log("FILES 👉", req.files); // 🔥 DEBUG (temporary)

    if (!req.files?.images || !req.files?.logo) {
        return next(new ErrorHandler("Images or Logo missing", 400));
    }

    // ---------- PRODUCT IMAGES ----------
 const images = req.files.images.map((file) => ({
  public_id: file.filename,
url: `/uploads/products/${file.filename}`,
}));


    // ---------- BRAND LOGO ----------
    const logoFile = req.files.logo[0];
    req.body.brand = {
  name: req.body.brand,
  logo: {
    public_id: logoFile.filename,
    url: `/uploads/brands/${logoFile.filename}`,

  },
};


    // ---------- HIGHLIGHTS ----------
    if (req.body.highlights) {
        req.body.highlights = Array.isArray(req.body.highlights)
            ? req.body.highlights
            : [req.body.highlights];
    }

    // ---------- SPECIFICATIONS ----------
    let specs = [];
    if (req.body.specifications) {
        if (Array.isArray(req.body.specifications)) {
            req.body.specifications.forEach((s) =>
                specs.push(JSON.parse(s))
            );
        } else {
            specs.push(JSON.parse(req.body.specifications));
        }
    }
    req.body.specifications = specs;

    // ---------- FINAL ----------
    req.body.images = images;
    req.body.user = req.user.id;
   req.body.prices = {
  distributor: Number(req.body.distributorPrice),
  dealer: Number(req.body.dealerPrice),
  customer: Number(req.body.customerPrice),
};

    req.body.stock = Number(req.body.stock);
    req.body.warranty = Number(req.body.warranty);
  

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product,
    });
});


// ================= UPDATE PRODUCT =================
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  // ===== DELETE SELECTED OLD IMAGES =====
  if (req.body.deletedImages) {
    const deletedImages = []
      .concat(req.body.deletedImages)
      .map((url) => url.trim());

    for (let imgUrl of deletedImages) {
      const imgPath = path.join(__dirname, "..", imgUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    product.images = product.images.filter(
      (img) => !deletedImages.includes(img.url)
    );
  }

if (req.files && req.files.images) {

  // old images delete
  if (Array.isArray(product.images)) {
    for (let img of product.images) {
      const imgPath = path.join(__dirname, "..", img.url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
  }

  // new images save
  product.images = req.files.images.map((file) => ({
    public_id: file.filename,
    url: `/uploads/products/${file.filename}`,
  }));
}



  // ===== UPDATE LOGO =====
  if (req.files && req.files.logo) {
    const logoFile = req.files.logo[0];

    if (
      product.brand &&
      product.brand.logo &&
      typeof product.brand.logo.url === "string"
    ) {
      const oldLogoPath = path.join(__dirname, "..", product.brand.logo.url);
      if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
    }

    product.brand.logo = {
      public_id: logoFile.filename,
      url: `/uploads/brands/${logoFile.filename}`,
    };
  }

  // ===== UPDATE FIELDS =====
  product.name = req.body.name;
  product.description = req.body.description;
  product.prices = {
    distributor: Number(req.body.distributorPrice),
    dealer: Number(req.body.dealerPrice),
    customer: Number(req.body.customerPrice),
  };
  product.stock = Number(req.body.stock);
  product.warranty = Number(req.body.warranty);
  product.category = req.body.category;
  product.highlights = req.body.highlights; 
  product.brand.name = req.body.brandname;

  // specs
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


// ================= DELETE PRODUCT =================
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (Array.isArray(product.images)) {
    for (let img of product.images) {
      if (img && typeof img.url === "string") {
        const imgPath = path.join(__dirname, "..", img.url);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    }
  }

  if (
    product.brand &&
    product.brand.logo &&
    typeof product.brand.logo.url === "string"
  ) {
    const logoPath = path.join(__dirname, "..", product.brand.logo.url);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
  }

  await product.deleteOne();

  res.status(200).json({ success: true });
});


