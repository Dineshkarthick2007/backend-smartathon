const mongoose = require('mongoose');

const irrigationStateSchema = new mongoose.Schema({
    fieldId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    cropName: { type: String, required: true },
    plantingDate: { type: Date, required: true },

    soilType: { type: String, required: true },
    fieldCapacity: { type: Number, required: true },
    wiltingPoint: { type: Number, required: true },
    rootZoneDepth: { type: Number, required: true },

    currentSoilMoisture: { type: Number, required: true },

    lastIrrigationMM: { type: Number, default: 0 },
    lastIrrigationDate: { type: Date, default: null },

    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
}, {
    collection: 'irrigation_state' // explicitly tell Mongoose to use 'irrigation_state'
});

module.exports = mongoose.model('IrrigationState', irrigationStateSchema);
