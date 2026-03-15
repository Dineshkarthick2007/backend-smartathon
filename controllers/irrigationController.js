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

        // Try to find crop parameters, fallback to a standard profile if not found
        let crop = await Crop.findOne({ name: { $regex: new RegExp(`^${state.cropName}$`, 'i') } });
        
        if (!crop) {
            console.warn(`[Irrigation] Crop parameters for ${state.cropName} not found. Using standard fallback profile.`);
            crop = {
                name: state.cropName,
                rootDepth: 1.0,
                kcInitial: 0.4,
                kcDevelopment: 0.8,
                kcMid: 1.15,
                kcLate: 0.6,
                growthDaysInitial: 25,
                growthDaysDevelopment: 35,
                growthDaysMid: 45,
                growthDaysLate: 25
            };
        }

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

const UserCrop = require('../models/UserCrop');

/**
 * Controller to handle DELETE /api/irrigation/field/:fieldId
 */
const deleteField = async (req, res) => {
    try {
        const { fieldId } = req.params;
        console.log(`[FullDelete] Deleting data for fieldId (UserCropId): ${fieldId}`);
        
        // Delete from BOTH collections to stay clean
        const resultIrrigation = await IrrigationState.findOneAndDelete({ fieldId });
        const resultUserCrop = await UserCrop.findByIdAndDelete(fieldId);

        if (!resultIrrigation && !resultUserCrop) {
            return res.status(404).json({ error: `No field or crop record found with ID ${fieldId}` });
        }
        
        return res.status(200).json({ 
            message: 'All crop and irrigation data deleted successfully',
            irrigationDeleted: !!resultIrrigation,
            trackingDeleted: !!resultUserCrop
        });
    } catch (error) {
        console.error('Error deleting field:', error.message);
        return res.status(500).json({ error: 'Error deleting field' });
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

        return res.status(200).json({ message: "Seed successful", count: crops.length });
    } catch (error) {
        return res.status(500).json({ error: 'Error seeding crops' });
    }
};

module.exports = { getRecommendation, getAllFields, addField, deleteField, seedCrops };
