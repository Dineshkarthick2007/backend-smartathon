const mongoose = require('mongoose');
const IrrigationState = require('./models/IrrigationState');
const MONGO_URI = "mongodb+srv://admin2005:wG22K6A7UvWdijtb@cluster1.qndf8.mongodb.net/login?retryWrites=true&w=majority&appName=Cluster1";

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const fields = await IrrigationState.find({});
        console.log("Found fields:", fields.map(f => f.cropName + " (" + f.fieldId + ")").join(", "));
        
        // Deleting all fields to clear out user's stuck state
        const del = await IrrigationState.deleteMany({});
        console.log("Deleted", del.deletedCount, "fields");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
