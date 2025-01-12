const mongoose = require("mongoose");

const movieModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please fill movie name"],
      trim: true,
      unique: true,
    },
    ticketPrice: {
      type: String,
      required: [true, "Ticket Please"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    releaseDate:{
      type: Date,
      required: [true, "Release Date Please"],
      trim: true,

    },
    image: {
      // Image field as an embedded sub-document
      type: {
        url: {
          type: String, // URL or file path of the image
          required: true, // Ensure every image has a URL
          trim: true,
        },
        public_id: {
          type: String, // Cloudinary public ID
          required: true,
        },
      },
      _id: false,
      required: false, // Make the image field optional
    },
    users: [
      {
        // Define users as an array
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MovieModel = mongoose.model("Movie", movieModelSchema);

module.exports = MovieModel;
