const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    rootDepth: { type: Number, required: true },
    kcInitial: { type: Number, required: true },
    kcDevelopment: { type: Number, required: true },
    kcMid: { type: Number, required: true },
    kcLate: { type: Number, required: true },
    growthDaysInitial: { type: Number, required: true },
    growthDaysDevelopment: { type: Number, required: true },
    growthDaysMid: { type: Number, required: true },
    growthDaysLate: { type: Number, required: true }
}, {
    collection: 'crops' // explicitly tell Mongoose to use 'crops'
});

module.exports = mongoose.model('Crop', cropSchema);
