const mongoose = require('mongoose');

let defaultConn;
let cropStagesConn;

const connectDB = async () => {
  try {
    defaultConn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${defaultConn.connection.host}`);
    console.log(`📦 Database: ${defaultConn.connection.name}`);
    
    // Create connection to CropStages DB
    const cropStagesUri = process.env.MONGO_URI.replace('/login', '/CropStages');
    cropStagesConn = mongoose.createConnection(cropStagesUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    cropStagesConn.on('connected', () => {
        console.log('✅ Connected to CropStages Database');
    });

    return { 
        default: defaultConn, 
        cropStages: cropStagesConn 
    };
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getCropStagesConn = () => cropStagesConn;

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

module.exports = { connectDB, getCropStagesConn };
