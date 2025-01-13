require('dotenv').config()
const MovieModel = require("../models/movieModel");
const SeatModel = require("../models/seatModel");
const UserModel = require("../models/UserSignup")

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
let tempStore = {}

// Function to generate a unique session ID
const generateSessionId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}
const seatController = {

  bookSeat: async (req, res) => {
    try {
      const data = new SeatModel(req.body);
      const error = data.validateSync();
      if (error) return res.status(404).json(error?.errors);
      const bookedSeat = await data.save();
      return res.status(201).json({ bookedSeat, message: "Seat is reserved" });
    } catch (error) {
      res.json(error);
    }
  },
  getSeats: async (req, res) => {
    try {
      const seats = await SeatModel.find();
      res.status(200).json(seats);
    } catch (error) {
      res.json(error);
    }
  },



  // Route for payment processing
  payment: async (req, res) => {

    try {
      const seatData = req.body;

      const { showDate, showTime, totalSeats, isFull, movieId, seats, numSeatsBooked } = req.body;

      // Validate the input data
      if (!showDate || !showTime || !totalSeats || !movieId) {
        return res.status(400).json({
          error: "Invalid request data. Please provide movieName, seatNumber, price, and imageUrl.",
        });
      }


      // Storing user data in the temporary store using a unique session ID
      const sessionId = generateSessionId();
      tempStore[sessionId] = seatData;
      const movieName = await MovieModel.findById(movieId)

      const userName = await UserModel.findById(numSeatsBooked[0]?.userId)
      // Create a Stripe product

      const product = await stripe.products.create({
        name: userName?.name,

      });

      // Create a Stripe price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 100 * 100, // 100 INR
        currency: 'inr',
      });
      const formattedDate = new Date(showDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Movie: ${movieName?.name}`,
                description: `Seat Numbers: ${seatData?.seats
                  ?.map((seat) => seat?.row + " " + seat?.seatNumber)
                  .join(', ')} | Tickets: ${seatData?.seats.length} | 
                            Date: ${formattedDate} | Time: ${showTime}`,
                images: [`${movieName?.image?.url}`],


              },

              unit_amount: (seatData?.seats[0]?.price * seatData?.seats.length) * 100, // Price in smallest currency unit
            },
            // quantity: seatData?.seats.length,

          },

        ],
        mode: 'payment',
        success_url: `https://pankajcinemafrontend.vercel.app/success?session_id={CHECKOUT_SESSION_ID}&user_data=${sessionId}`, // Correcting the success URL
        cancel_url: `https://pankajcinemafrontend.vercel.app/cancel`, // Redirect to cancel page
        billing_address_collection: 'required',

      });

      // Send session URL to the frontend
      res.status(200).json({ url: session.url });
    } catch (error) {

      res.status(500).json({ error: 'Internal Server Error' });
    }

  },
  success: async (req, res) => {
    try {
      const { session_id, user_data } = req.query; // Extract session_id and user_data from query parameters

      if (!session_id || !user_data) {
        return res.status(400).json({ error: 'Session ID or user data is missing' });
      }

      // Retrieve user data from the temporary store using sessionId
      const userData = tempStore[user_data];

      if (!userData) {
        return res.status(404).json({ error: 'User data not found' });
      }

      // Retrieve the Stripe session details
      const session = await stripe.checkout.sessions.retrieve(session_id);

      // Perform backend updates, e.g., update seat availability and user details


      // Save user data in the database
      let { showDate, showTime, totalSeats, isFull, movieId, seats, numSeatsBooked } = userData;
      totalSeats = Number(totalSeats);

      // Adjust totalSeats
      totalSeats = totalSeats - seats.length;

      seats.forEach((seat) => {
        seat.isBooked = true;
      });

      const existingSeatData = await SeatModel.findOne({ showDate, showTime, movieId });
      let updatedSeatData;

      if (existingSeatData) {
        // Push the new seats into the existing seat array (adding to the existing seats)
        await SeatModel.updateOne(
          { _id: existingSeatData._id }, // Find the specific document by its _id
          {
            $set: {
              totalSeats: totalSeats,
              isFull: isFull,
            },
            $push: {
              seats: { $each: seats },
              numSeatsBooked: { $each: numSeatsBooked }, // Add new seats to the existing seats array
            },
          }
        );



        // Fetch the updated data
        updatedSeatData = await SeatModel.findById(existingSeatData._id);
      } else {
        // Create new seat data
        const newSeatData = new SeatModel(userData);
        updatedSeatData = await newSeatData.save();
      }

      // Update user bookingDetails field
      const movie = await MovieModel.findById(movieId);
      if (movie) {
        const movieName = movie.name;
        await UserModel.findByIdAndUpdate(
          numSeatsBooked[0]?.userId, // Ensure this is a valid user ID
          {
            $push: {
              bookingDetails: {
                date: showDate,
                showTime: showTime,
                tickets: seats.length, // Number of seats booked
                movieName: movieName, // Movie name
                seatNumber: seats.map(seat => ({
                  row: seat.row,
                  number: seat.seatNumber,
                })), // Mapping the seat details into an array of objects
              },
            },
          },
          { new: true } // Returns the updated document
        );
      }
      updatedSeatData.movieId = movie

      return res.status(200).json({
        message: 'Payment successful',
        seatData: updatedSeatData, // Send the updated or new seat data
        sessionDetails: session, // Optionally, send the session details
      });
    } catch (error) {

      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

}
module.exports = seatController;



































