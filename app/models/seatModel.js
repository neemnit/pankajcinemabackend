const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
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
  { _id: false } // Prevent Mongoose from auto-generating _id for subdocuments
);

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
      type: Number,
      required: true,
      default:100
       // Total number of seats available in the hall
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
    seats: [seatSchema],
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
      { _id: false } // Prevent Mongoose from auto-generating _id for numSeatsBooked subdocuments
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add a compound index to enforce uniqueness on the combination of `row` and `seatNumber` in the `seats` array
seatModelSchema.index({ "seats.row": 1, "seats.seatNumber": 1 }, { unique: true });

// Create a model from the schema
const SeatModel = mongoose.model("Seat", seatModelSchema);

// Export the model
module.exports = SeatModel;