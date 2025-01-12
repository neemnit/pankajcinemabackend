const UserSignup = require("../models/UserSignup");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSignupSchema = require("../middleware/userSignupSchema");
const yup = require("yup");
const mongoose = require("mongoose");

require("dotenv").config();

const userRegisterController = {
  create: async (req, res) => {
    try {
      // Validate the incoming request body against the userSignupSchema
      await userSignupSchema.validate(req.body, { abortEarly: false });

      const body = req.body;
      const user = new UserSignup(body);

      // If the user's adharNo is specific, assign role as admin
      if (user.adharNo === "9494949494949494") {
        user.role = "admin";
      }

      const saltRounds = 10; // Higher values increase security but slow down hashing
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      // Replace the plain password with the hashed one
      user.password = hashedPassword;

      // Save the user to the database
      await user.save();

      // Respond with success message
      return res
        .status(201)
        .json({ message: "User registered successfully.", user });
    } catch (error) {
      if (error?.errors) {
      
        return res.status(400).json(error?.errors);
      }

      // Handle Yup validation errors
      // if (error instanceof yup.ValidationError) {
      //     const errorMessages = error.inner.map(err => err.message); // Get all error messages
      //     return res.status(400).json({ errors: errorMessages });
      // }

      // Handle any other unexpected errors
      return res
        .status(500)
        .json({ message: "An error occurred. Please try again." });
    }
  },
  getUsers:async(req,res)=>{
    try {
      const data=await UserSignup.find()
      res.json(data)
      
    } catch (error) {
    return res.json(error)
      
    }
  },
  profile:async (req,res)=>{
    try {
         return res.json(req.user)
    } catch (error) {
      res.json(error)
    }
  }
,
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if the user exists in the database
      const existingUser = await UserSignup.findOne({ email });
      if (!existingUser) {
        return res.status(401).json({ error: "Invalid email " });
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid  password" });
      }

      // Generate a JWT token
      const token = jwt.sign(
        { id: existingUser._id, user: existingUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "5d" } // Token expiration time
      );

      // Successful login
      return res.status(200).json({
        message: "Login successful",
        token,
        role: existingUser.role === "admin" ? "admin" : "user",
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = userRegisterController;
