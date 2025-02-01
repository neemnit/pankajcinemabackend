require('dotenv').config();
const MovieModel = require("../models/movieModel");
const SeatModel = require("../models/seatModel");
const UserModel = require("../models/UserSignup");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
let tempStore = {};

// Function to generate a unique session ID
const generateSessionId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now();
};

const seatController = {

  bookSeat: async (req, res) => {
    try {
      // Validate if seat already exists for the same row and seat number
      const existingSeat = await SeatModel.findOne({
        "seats.row": req.body.row,
        "seats.seatNumber": req.body.seatNumber,
      });
      if (existingSeat) {
        return res.status(400).json({ message: "Seat is already booked or exists." });
      }
  
      const data = new SeatModel(req.body);
      const error = data.validateSync();
      if (error) return res.status(400).json(error?.errors);
  
      const bookedSeat = await data.save();
      return res.status(201).json({ bookedSeat, message: "Seat is reserved" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
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
      

      const { showDate, showTime, totalSeats,  movieId,  numSeatsBooked } = req.body;

      // Validate the input data
      if (!showDate || !showTime || !totalSeats || !movieId) {
        return res.status(400).json({
          error: "Invalid request data. Please provide movieName, seatNumber, price, and imageUrl.",
        });
      }

      // Storing user data in the temporary store using a unique session ID
      const sessionId = generateSessionId();
      tempStore[sessionId] = seatData;
      const movieName = await MovieModel.findById(movieId);

      const userName = await UserModel.findById(numSeatsBooked[0]?.userId);
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
              unit_amount: seatData?.seats[0]?.price * 100, // Corrected: Only per ticket price
            },
            quantity: seatData?.seats.length, // Stripe will multiply by this quantity
          },
        ],
        mode: 'payment',
        success_url: `https://pankajcinemabackend.onrender.com/success?session_id={CHECKOUT_SESSION_ID}&user_data=${sessionId}`, // Correcting the success URL
        cancel_url: `https://pankajcinemafrontend.vercel.app/cancel`, // Redirect to cancel page
        billing_address_collection: 'required',
      });
      

      // Send session URL to the frontend
      res.status(200).json({ url: session.url });
    } catch (error) {
      
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  getBooking:async(req,res)=>{
    const { session_id,user_data } = req.query;
    const seatData = tempStore[user_data];
    res.json(seatData)
  },

  success: async (req, res) => {
    try {
      const { session_id, user_data } = req.query;
  
      if (!session_id || !user_data) {
        return res.status(400).json({ error: 'Session ID or user data is missing' });
      }
  
      // Retrieve user data from the temporary store
      const userData = tempStore[user_data];
  
      if (!userData) {
        return res.status(404).json({ error: 'User data not found' });
      }
  
      // Retrieve the Stripe session details
      const session = await stripe.checkout.sessions.retrieve(session_id);
  
      let { showDate, showTime, totalSeats, movieId, seats, numSeatsBooked } = userData;
      
  let frontResponse={}
  frontResponse.userData=userData
      // Adjust totalSeats
      const seatsBooked = seats.length;
      totalSeats -= seatsBooked; // Update locally
  
      
  
      // Mark seats as booked
      seats.forEach((seat) => {
        seat.isBooked = true;
      });
  
      // Find existing seat data
      let existingSeatData = await SeatModel.findOne({ showDate, showTime, movieId });
      
      if (existingSeatData) {
        // Update totalSeats and add new seats
        await SeatModel.updateOne(
          { _id: existingSeatData._id },
          {
            $inc: { totalSeats: -seatsBooked }, // Decrease totalSeats dynamically
            $set: { isFull: existingSeatData.totalSeats - seatsBooked === 0 }, // Update isFull if seats are exhausted
            $push: {
              seats: { $each: seats },
              numSeatsBooked: { $each: numSeatsBooked },
            },
          }
        );
  
        // Fetch the updated document
        existingSeatData = await SeatModel.findById(existingSeatData._id);
      } else {
        // Create new seat data if it doesn’t exist
        const newSeatData = new SeatModel({
          ...userData,
          totalSeats: 100 - seatsBooked, // Ensure correct totalSeats
          isFull: 100 - seatsBooked === 0,
        });
  
        existingSeatData = await newSeatData.save();
      }
  
      // Update user booking details
      const movie = await MovieModel.findById(movieId);
      if (movie) {
        const movieName = movie.name;
        await UserModel.findByIdAndUpdate(
          numSeatsBooked[0]?.userId,
          {
            $push: {
              bookingDetails: {
                date: showDate,
                showTime,
                tickets: seatsBooked,
                movieName,
                seatNumber: seats.map(seat => ({
                  row: seat.row,
                  number: seat.seatNumber,
                })),
              },
            },
          },
          { new: true }
        );
      }
  
      
      frontResponse.movieId=movie
      tempStore[user_data] = frontResponse;
  
      return res.redirect(`https://pankajcinemafrontend.vercel.app/success?session_id=${session_id}&user_data=${user_data}`);
    } catch (error) {
      
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
};

module.exports = seatController;
