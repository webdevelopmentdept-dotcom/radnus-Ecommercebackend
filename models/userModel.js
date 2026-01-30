const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
        validate: [validator.isEmail, "Please Enter a Valid Email"],
    },
    gender: {
        type: String,
        required: [true, "Please Enter Gender"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [8, "Password should have atleast 8 chars"],
        select: false,
    },




    avatar: {
        public_id: {
            type: String,
            default: "local_dev_avatar"
        },
        url: {
            type: String,
            default: "" // base64 stored when in development
        }
    },

  role: {
    type: String,
    enum: ["normal", "dealer", "distributor", "admin"],
    default: "normal",
},

  tokenVersion: {
    type: Number,
    default: 0,
},

showRoleUpgradeMsg: {
    type: Boolean,
    default: false,
},

    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});


// HASHING PASSWORD BEFORE SAVE
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


// JWT TOKEN CREATION
userSchema.methods.getJWTToken = function () {
    return jwt.sign(
        {
            id: this._id,
            role: this.role,
            tokenVersion: this.tokenVersion,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE,
        }
    );
};



// COMPARE PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// RESET PASSWORD TOKEN GENERATION
userSchema.methods.getResetPasswordToken = function () {

    // Create normal token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash and save
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
