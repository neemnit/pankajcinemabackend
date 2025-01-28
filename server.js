const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');


const configureDB = require('./config/database');

const router=require('./config/router')
app.use(cors())
app.use(
    cors({
      origin: 'https://pankajcinemafrontend.vercel.app', // Allow requests from this origin
      methods: 'GET,POST,PUT,DELETE',  // Allow specific HTTP methods
      credentials: true,               // Allow cookies and credentials
    })
  );
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