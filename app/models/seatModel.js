const mongoose = require("mongoose");

// Define the schema for a cinema hall's seating
const seatModelSchema = new mongoose.Schema(
  {
    showDate: {
      type: Date,
      required: true, // Date of the show
    },
    showTime: {
      type: String,
      required: true, // Time of the show, e.g., '18:30'
    },
    totalSeats: {
      type: String,
      required: true, // Total number of seats available in the hall
    },
    isFull: {
      type: Boolean,
      default: false, // Whether all seats are booked
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // Reference to the Movie schema
      required: true,
    },
    seats: [
      {
        row: {
          type: String,
          required: true, // Row identifier, e.g., 'A', 'B', 'C'
        },
        seatNumber: {
          type: Number,
          required: true, // Seat number within the row
        },
        isBooked: {
          type: Boolean,
          default: false, // Whether the seat is booked or not
        },
        price: {
          type: Number,
          required: true, // Price of the seat
        },
        bookedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User schema
          default: null, // Null if the seat is not booked
        },
      },
    ],
    numSeatsBooked: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User schema
          required: true, // User who booked seats
        },
        seatsBooked: {
          type: Number,
          required: true, // Number of seats the user booked
        },
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create a model from the schema
const SeatModel = mongoose.model("Seat", seatModelSchema);

// Export the model
module.exports = SeatModel;
