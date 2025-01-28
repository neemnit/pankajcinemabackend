const mongoose = require('mongoose');
require("dotenv").config();

const uri = process.env.MONGO_DB_URL;

const configureDB = () => {
  mongoose.connect(uri)
    .then(response => {
      console.log('MongoDB Connection Succeeded.');
    })
    .catch(error => {
      console.log('Error in DB connection: ' + error);
    });
}

module.exports = configureDB;
