const mongoose = require('mongoose');

const userCropSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Using String to match prompt example "123"
    crop: { type: String, required: true },
    plantingDate: { type: String, required: true }, // Store as string as per prompt
    durationDays: { type: Number, required: true },
    harvestDate: { type: String, required: true },
    stages: [
        {
            name: String,
            icon: String,
            day: Number
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('UserCrop', userCropSchema);
