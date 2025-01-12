const mongoose = require("mongoose");

const UserLoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter your email"],
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserLogin = mongoose.model("UserLogin", UserLoginSchema);

module.exports = UserLogin;
