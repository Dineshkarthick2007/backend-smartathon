const mongoose = require('mongoose');
const Crop = require('./models/Crop');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin2005:wG22K6A7UvWdijtb@cluster1.qndf8.mongodb.net/login?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const crops = [
            { name: "Rice", rootDepth: 1.2, kcInitial: 1.05, kcDevelopment: 1.1, kcMid: 1.2, kcLate: 0.9, growthDaysInitial: 30, growthDaysDevelopment: 40, growthDaysMid: 50, growthDaysLate: 30 },
            { name: "Maize", rootDepth: 1.5, kcInitial: 0.3, kcDevelopment: 0.8, kcMid: 1.2, kcLate: 0.5, growthDaysInitial: 20, growthDaysDevelopment: 35, growthDaysMid: 40, growthDaysLate: 30 },
            { name: "Cotton", rootDepth: 1.7, kcInitial: 0.35, kcDevelopment: 0.75, kcMid: 1.15, kcLate: 0.6, growthDaysInitial: 30, growthDaysDevelopment: 50, growthDaysMid: 60, growthDaysLate: 45 },
            { name: "Wheat", rootDepth: 1.5, kcInitial: 0.3, kcDevelopment: 0.75, kcMid: 1.15, kcLate: 0.4, growthDaysInitial: 30, growthDaysDevelopment: 40, growthDaysMid: 40, growthDaysLate: 30 },
            { name: "Sugarcane", rootDepth: 2.0, kcInitial: 0.4, kcDevelopment: 0.8, kcMid: 1.25, kcLate: 0.7, growthDaysInitial: 40, growthDaysDevelopment: 60, growthDaysMid: 120, growthDaysLate: 60 },
            { name: "Soybean", rootDepth: 1.3, kcInitial: 0.4, kcDevelopment: 0.8, kcMid: 1.15, kcLate: 0.5, growthDaysInitial: 20, growthDaysDevelopment: 30, growthDaysMid: 60, growthDaysLate: 30 },
            { name: "Groundnut", rootDepth: 1.0, kcInitial: 0.4, kcDevelopment: 0.8, kcMid: 1.15, kcLate: 0.6, growthDaysInitial: 25, growthDaysDevelopment: 35, growthDaysMid: 45, growthDaysLate: 25 },
            { name: "Mustard", rootDepth: 1.2, kcInitial: 0.35, kcDevelopment: 0.75, kcMid: 1.15, kcLate: 0.35, growthDaysInitial: 20, growthDaysDevelopment: 40, growthDaysMid: 60, growthDaysLate: 30 },
            { name: "Pulses", rootDepth: 1.0, kcInitial: 0.4, kcDevelopment: 0.8, kcMid: 1.15, kcLate: 0.35, growthDaysInitial: 15, growthDaysDevelopment: 25, growthDaysMid: 35, growthDaysLate: 15 },
            { name: "Potato", rootDepth: 0.6, kcInitial: 0.5, kcDevelopment: 0.8, kcMid: 1.15, kcLate: 0.75, growthDaysInitial: 25, growthDaysDevelopment: 30, growthDaysMid: 45, growthDaysLate: 30 },
            { name: "Tomato", rootDepth: 1.5, kcInitial: 0.6, kcDevelopment: 0.85, kcMid: 1.15, kcLate: 0.8, growthDaysInitial: 30, growthDaysDevelopment: 40, growthDaysMid: 45, growthDaysLate: 30 },
            { name: "Onion", rootDepth: 0.6, kcInitial: 0.7, kcDevelopment: 0.9, kcMid: 1.05, kcLate: 0.75, growthDaysInitial: 15, growthDaysDevelopment: 25, growthDaysMid: 70, growthDaysLate: 40 },
            { name: "Cabbage", rootDepth: 0.5, kcInitial: 0.7, kcDevelopment: 0.9, kcMid: 1.05, kcLate: 0.95, growthDaysInitial: 40, growthDaysDevelopment: 60, growthDaysMid: 50, growthDaysLate: 15 },
            { name: "Cauliflower", rootDepth: 0.5, kcInitial: 0.7, kcDevelopment: 0.9, kcMid: 1.05, kcLate: 0.95, growthDaysInitial: 35, growthDaysDevelopment: 50, growthDaysMid: 40, growthDaysLate: 15 },
            { name: "Banana", rootDepth: 1.2, kcInitial: 0.5, kcDevelopment: 0.85, kcMid: 1.1, kcLate: 1.0, growthDaysInitial: 120, growthDaysDevelopment: 90, growthDaysMid: 120, growthDaysLate: 60 },
            { name: "Mango", rootDepth: 3.0, kcInitial: 0.85, kcDevelopment: 0.9, kcMid: 0.95, kcLate: 0.85, growthDaysInitial: 60, growthDaysDevelopment: 90, growthDaysMid: 120, growthDaysLate: 90 },
            { name: "Grapes", rootDepth: 2.0, kcInitial: 0.3, kcDevelopment: 0.6, kcMid: 0.85, kcLate: 0.45, growthDaysInitial: 20, growthDaysDevelopment: 40, growthDaysMid: 120, growthDaysLate: 60 },
            { name: "Apple", rootDepth: 2.0, kcInitial: 0.6, kcDevelopment: 0.8, kcMid: 0.95, kcLate: 0.75, growthDaysInitial: 30, growthDaysDevelopment: 50, growthDaysMid: 130, growthDaysLate: 40 },
            { name: "Citrus", rootDepth: 1.5, kcInitial: 0.7, kcDevelopment: 0.7, kcMid: 0.7, kcLate: 0.7, growthDaysInitial: 60, growthDaysDevelopment: 90, growthDaysMid: 120, growthDaysLate: 90 },
            { name: "Tea", rootDepth: 1.5, kcInitial: 0.95, kcDevelopment: 0.95, kcMid: 0.95, kcLate: 0.95, growthDaysInitial: 30, growthDaysDevelopment: 60, growthDaysMid: 180, growthDaysLate: 90 }
        ];
        for (const c of crops) {
            await Crop.findOneAndUpdate({ name: { $regex: new RegExp(`^${c.name}$`, 'i') } }, c, { upsert: true, new: true });
        }
        console.log("Seeded " + crops.length + " crops");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
