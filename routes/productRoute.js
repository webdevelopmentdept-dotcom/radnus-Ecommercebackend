const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProducts,
  getProductDetails,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const upload = require("../utils/multer");

// PUBLIC
router.get("/products", getAllProducts);
router.get("/products/all", getProducts);
router.get("/product/:id", optionalAuth, getProductDetails);

// ADMIN
router.get(
  "/admin/products",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAdminProducts
);

router.post(
  "/admin/product/new",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "logo", maxCount: 1 },
  ]),
  createProduct
);

router.put(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "logo", maxCount: 1 },
  ]),
  updateProduct
);

router.delete(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  deleteProduct
);

module.exports = router;
