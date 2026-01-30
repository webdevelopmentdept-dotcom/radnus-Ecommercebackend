const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserDetails,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
    clearRoleUpgradeMsg,
} = require("../controllers/userController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const upload = require("../utils/multer");

const router = express.Router();

// ✅ FIXED REGISTER
router.post("/register", upload.single("avatar"), registerUser);

router.post("/login", loginUser);
router.get("/logout", logoutUser);

router.get("/me", isAuthenticatedUser, getUserDetails);

router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticatedUser, updatePassword);

router.put(
  "/me/update",
  isAuthenticatedUser,
  upload.single("avatar"),
  updateProfile
);

router.get(
  "/admin/users",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllUsers
);

// 🔥 CLEAR ROLE UPGRADE MESSAGE
router.put(
  "/user/clear-upgrade-msg",
  isAuthenticatedUser,
  clearRoleUpgradeMsg
);


router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;