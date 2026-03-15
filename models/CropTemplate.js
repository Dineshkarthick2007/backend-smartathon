const mongoose = require('mongoose');
const { getCropStagesConn } = require('../config/db');

const cropTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    planting_months: [String],
    harvest_months: [String],
    duration_days: { type: Number, required: true },
    soil_types: [String],
    water_requirement: { type: String, enum: ['Low', 'Medium', 'High'] },
    stages: [
        {
            name: String,
            icon: String,
            day: Number
        }
    ]
}, { collection: 'crop_data' });

// We need to use the specific connection for this model
module.exports = () => {
    const conn = getCropStagesConn();
    if (!conn) return mongoose.model('CropTemplate', cropTemplateSchema); // Fallback
    return conn.model('CropTemplate', cropTemplateSchema);
};
