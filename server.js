const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');
 const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)
const mongoose = require('mongoose');
const configureDB = require('./config/database');

const router=require('./config/router')
app.use(cors({
    origin:'https://pankajcinemabackend-2.onrender.com/payment','*'
    methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Mongo DB Connections
configureDB()


// Middleware Connections
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(router)


// Routes


// Connection
const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log('App running in port: '+PORT)
})