const mongoose = require('mongoose');
const IrrigationState = require('./models/IrrigationState');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const fields = await IrrigationState.find({});
        console.log("Fields in remote MongoDB:", fields.map(f => f.cropName + " (" + f.fieldId + ")").join(", "));
        
        await IrrigationState.deleteMany({});
        console.log("Deleted all fields to unblock user");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
