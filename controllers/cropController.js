const CropTemplate = require('../models/CropTemplate');
const UserCrop = require('../models/UserCrop');
const moment = require('moment');

exports.recommendCrops = async (req, res) => {
    try {
        const { soilType, waterAvailability, latitude, longitude, currentDate } = req.body;
        
        const date = moment(currentDate);
        const currentMonth = date.format('MMMM'); // e.g., "June"

        // Fetch all templates
        const templates = await CropTemplate().find();

        const recommendedCrops = templates.map(crop => {
            // Support both snake_case and camelCase from the DB
            const plantingMonths = crop.planting_months || crop.plantingMonths || [];
            const soilTypes = crop.soil_types || crop.soilTypes || [];
            const waterReq = crop.water_requirement || crop.waterRequirement || 'Medium';
            const duration = crop.duration_days || crop.durationDays || 100;

            // 1. Month Match (case-insensitive)
            const monthMatch = Array.isArray(plantingMonths) && plantingMonths.some(m => m.toLowerCase() === currentMonth.toLowerCase());
            
            // 2. Soil Match (flexible/partial)
            const soilMatch = Array.isArray(soilTypes) && soilTypes.some(s => 
                s.toLowerCase().includes(soilType.toLowerCase()) || 
                soilType.toLowerCase().includes(s.toLowerCase())
            );

            // Calculation Scores
            let soilScore = soilMatch ? 40 : 10;
            let monthScore = monthMatch ? 30 : 5;
            
            // Water Score
            let waterScore = 0;
            const waterMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
            const userWater = waterMap[waterAvailability] || 0;
            const cropWater = waterMap[waterReq] || 0;

            if (cropWater === userWater) {
                waterScore = 20;
            } else if (cropWater < userWater) {
                waterScore = 15;
            } else {
                waterScore = 5; 
            }

            // Duration Score
            let durationScore = 0;
            if (duration < 100) {
                durationScore = 10;
            } else if (duration >= 100 && duration <= 150) {
                durationScore = 7;
            } else if (duration > 150 && duration <= 200) {
                durationScore = 5;
            } else {
                durationScore = 2;
            }

            const finalScore = soilScore + monthScore + waterScore + durationScore;

            // Threshold – keep at least decent matches
            if (finalScore < 30 && !soilMatch && !monthMatch) return null;

            return {
                name: crop.name,
                accuracy: finalScore,
                durationDays: duration
            };
        }).filter(item => item !== null);

        // Sort by accuracy descending
        recommendedCrops.sort((a, b) => b.accuracy - a.accuracy);

        res.status(200).json({ recommendedCrops });

    } catch (error) {
        console.error('Error recommending crops:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addCrop = async (req, res) => {
    try {
        const { userId, cropName, plantingDate } = req.body;

        const template = await CropTemplate().findOne({ name: cropName });
        if (!template) {
            return res.status(404).json({ success: false, message: 'Crop template not found' });
        }

        const harvestDate = moment(plantingDate).add(template.duration_days, 'days').format('YYYY-MM-DD');

        const newUserCrop = new UserCrop({
            userId,
            crop: cropName,
            plantingDate,
            durationDays: template.duration_days,
            harvestDate,
            stages: template.stages
        });

        await newUserCrop.save();

        res.status(201).json(newUserCrop);

    } catch (error) {
        console.error('Error adding crop:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCropProgress = async (req, res) => {
    try {
        const { cropId } = req.params;
        const userCrop = await UserCrop.findById(cropId);

        if (!userCrop) {
            return res.status(404).json({ success: false, message: 'Crop instance not found' });
        }

        const today = moment();
        const start = moment(userCrop.plantingDate);
        const daysPassed = today.diff(start, 'days');
        const totalDays = userCrop.durationDays;
        
        let progressPercent = (daysPassed / totalDays) * 100;
        if (progressPercent > 100) progressPercent = 100;
        if (progressPercent < 0) progressPercent = 0;

        // Find current stage
        let currentStageName = "Unknown";
        // Sort stages by day just in case
        const sortedStages = [...userCrop.stages].sort((a, b) => a.day - b.day);
        
        for (const stage of sortedStages) {
            if (daysPassed >= stage.day) {
                currentStageName = stage.name;
            }
        }

        const response = {
            cropId: userCrop._id,
            crop: userCrop.crop,
            daysPassed: daysPassed,
            totalDays: totalDays,
            remainingDays: Math.max(0, totalDays - daysPassed),
            progressPercent: parseFloat(progressPercent.toFixed(1)),
            currentStage: currentStageName,
            stages: userCrop.stages
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching crop progress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
