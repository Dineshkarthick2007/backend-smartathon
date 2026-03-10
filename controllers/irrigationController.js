const IrrigationState = require('../models/IrrigationState');
const Crop = require('../models/Crop');
const { generateIrrigationReport } = require('../services/irrigationEngine');

/**
 * Controller to handle GET /api/irrigation/state/:fieldId
 */
const getRecommendation = async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        const state = await IrrigationState.findOne({ fieldId });
        if (!state) return res.status(404).json({ error: `No field found with ID ${fieldId}` });

        const crop = await Crop.findOne({ name: state.cropName });
        if (!crop) return res.status(404).json({ error: `No crop found with name ${state.cropName}` });

        const report = await generateIrrigationReport(state, crop);
        return res.status(200).json({ crop: state.cropName, ...report });
    } catch (error) {
        console.error('Error in getRecommendation:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Controller to handle GET /api/irrigation/fields
 */
const getAllFields = async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }
        const fields = await IrrigationState.find({ userEmail });
        return res.status(200).json(fields);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Controller to handle POST /api/irrigation/field
 */
const addField = async (req, res) => {
    try {
        const { fieldId, userEmail, cropName, plantingDate, soilType, latitude, longitude } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }

        let fieldCapacity, wiltingPoint;
        if (soilType.toLowerCase().includes('clay')) {
            fieldCapacity = 0.40; wiltingPoint = 0.20;
        } else if (soilType.toLowerCase().includes('sand')) {
            fieldCapacity = 0.15; wiltingPoint = 0.05;
        } else {
            fieldCapacity = 0.30; wiltingPoint = 0.12; // Loam default
        }

        const newState = new IrrigationState({
            fieldId: fieldId || `field_${Date.now()}`,
            userEmail,
            cropName,
            plantingDate: plantingDate || new Date(),
            soilType,
            fieldCapacity,
            wiltingPoint,
            rootZoneDepth: 0.6, // Defaulting to 0.6m
            currentSoilMoisture: fieldCapacity, // Start at full capacity
            lastIrrigationMM: 0,
            lastIrrigationDate: new Date(),
            latitude: latitude || 11.1271,
            longitude: longitude || 78.6569
        });

        await newState.save();
        return res.status(201).json(newState);
    } catch (error) {
        console.error('Error adding field:', error.message);
        return res.status(500).json({ error: 'Error adding field' });
    }
};

/**
 * Controller to handle POST /api/irrigation/seed
 * (creates required crop documents if they don't exist)
 */
const seedCrops = async (req, res) => {
    try {
        const crops = [
            { name: "Rice", rootDepth: 1.2, kcInitial: 1.05, kcDevelopment: 1.1, kcMid: 1.2, kcLate: 0.9, growthDaysInitial: 30, growthDaysDevelopment: 40, growthDaysMid: 50, growthDaysLate: 30 },
            { name: "Maize", rootDepth: 1.5, kcInitial: 0.3, kcDevelopment: 0.8, kcMid: 1.2, kcLate: 0.5, growthDaysInitial: 20, growthDaysDevelopment: 35, growthDaysMid: 40, growthDaysLate: 30 },
            { name: "Cotton", rootDepth: 1.7, kcInitial: 0.35, kcDevelopment: 0.75, kcMid: 1.15, kcLate: 0.6, growthDaysInitial: 30, growthDaysDevelopment: 50, growthDaysMid: 60, growthDaysLate: 45 }
        ];

        for (const c of crops) {
            await Crop.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
        }

        return res.status(200).json({ message: "Seed successful" });
    } catch (error) {
        return res.status(500).json({ error: 'Error seeding crops' });
    }
};

module.exports = { getRecommendation, getAllFields, addField, seedCrops };
