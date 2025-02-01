const fs = require("fs"); // For file cleanup
const MovieModel = require("../models/movieModel"); // Import your Mongoose model
const SeatModel=require('../models/seatModel')
const cloudinary = require("cloudinary").v2;
const movieController = {
  addMovie: async (req, res) => {
    try {
      const { name, ticketPrice, description, users,releaseDate } = req.body;

      // Validate the request
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }
      if (!name || !ticketPrice) {
        return res
          .status(400)
          .json({ error: "Name and ticket price are required" });
      }
      const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "movies", // Optional: Store in a "movies" folder in Cloudinary
      });

      // Construct the movie object
      const movie = new MovieModel({
        name,
        ticketPrice,
        description,
        releaseDate,
        image: {
          url: cloudinaryResult.secure_url, // Path to the uploaded image (Cloudinary or local storage)
          public_id: cloudinaryResult.public_id, // Public ID (only meaningful for Cloudinary)
        },
        users: users ? JSON.parse(users) : [], // Parse the users field if provided as JSON string
      });

      // Save the movie to the database
      const savedMovie = await movie.save();

      // Optional: Remove file from local storage after saving to Cloudinary
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting local file:", err);
        } else {
          console.log("Local file deleted successfully");
        }
      });

      // Respond to the client
      return res.status(201).json({
        message: "Movie created successfully",
        data: savedMovie,
      });
    } catch (error) {
      if (error?.errors) {
        return res.status(400).json(error?.errors);
      }

      // Return an error response
      return res.status(500).json({
        error: "An error occurred while adding the movie",
      });
    }
  },
  deleteMovie: async (req, res) => {
    try {
      const id = req.params.id;
      const data = await MovieModel.findByIdAndDelete(id);
       await SeatModel.findOneAndDelete({movieId:id})
      
      return res.status(202).json({ data, message: "Deleted Sucessfully" });
    } catch (error) {
      return res.status(404).json({ error: "No movies exist" });
    }
  },
  getMovies:async(req,res)=>{
    try{
      const movieList=await MovieModel.find()
      return res.status(200).json(movieList)
    }
    catch(err){
      return res.status(404).json({error:"No movie added",err})
    }
  },
  bookMovie: async (req, res) => {
    try {
      const { id } = req.params;
      const { users } = req.body;
  
      if (!users || !Array.isArray(users)) {
        return res
          .status(400)
          .json({ message: "Users field must be an array" });
      }
  
      // Remove duplicates using filter
      const uniqueUsers = users.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
  
     // Log unique users to check
  
      // Check if the movie exists
      const movie = await MovieModel.findById(id);
     // Log movie to check
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
  
      // Update movie
      const updatedMovie = await MovieModel.findByIdAndUpdate(
        id,
        { $set: { users: uniqueUsers } },
        { new: true, runValidators: true }
      );
  
     // Log updated movie to check
  
      if (!updatedMovie) {
        return res.status(404).json({ message: "Movie not updated" });
      }
  
      res.status(200).json({
        message: "Movie updated successfully",
        movie: updatedMovie,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },
  
};

module.exports = movieController;
