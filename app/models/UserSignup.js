const mongoose = require("mongoose");

const UserSignupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [3, "Name should be more than 2 characters"],
      maxlength: [20, "Name should not be more than 20 characters"],
      required: [true, "Please fill your name correctly"],
      trim: true,
      match: [
        /^(?!.*([a-zA-Z])\1{2})[a-zA-Z]+$/,
        "Please enter your valid name",
      ],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
      unique: [true, "email address already exists"],
    },
    password: {
      type: String,
      required:[true,"Please Fill Password"]
    },
    adharNo: {
      type: String,
      required: [true, "Please enter your Aadhaar number"],
      unique: [true, "Aadhaar card already exists"],
      match: [/^\d{16}$/, "Aadhaar number must be exactly 16 digits"],
      trim: true,
    },
    // Booking details now as an array of objects
    bookingDetails: [
      {
        date: { type: Date },
        showTime: { type: String },
        tickets: { type: Number, default: 0 },
        movieName: { type: String },
        seatNumber: [
          {
            row: { type: String }, // Property for row identifier
            number: { type: String }, // Property for seat number
          },
        ],
      },
    ],

    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const UserSignup = mongoose.model("User", UserSignupSchema);

module.exports = UserSignup;
