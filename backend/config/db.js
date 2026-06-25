const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pathpilot';
    console.log(`Connecting to MongoDB at: ${mongoURI.split('@').pop()}`); // Don't print password in logs if using Atlas URI
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
