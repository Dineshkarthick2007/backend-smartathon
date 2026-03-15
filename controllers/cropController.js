const CropTemplate = require('../models/CropTemplate');
const UserCrop = require('../models/UserCrop');
const moment = require('moment');

exports.recommendCrops = async (req, res) => {
    try {
        const { soilType, waterAvailability, latitude, longitude, currentDate } = req.body;
        
        const date = moment(currentDate);
        const currentMonth = date.format('MMMM'); // e.g., "June"

        // 1. Fetching logic with multi-level fallbacks
        let templates = [];
        let source = "database_secondary";
        
        try {
            // Priority 1: CropStages DB
            templates = await CropTemplate().find();
            
            // Priority 2: Try Primary DB if Secondary is empty
            if (templates.length === 0) {
                source = "database_primary";
                const PrimaryModel = mongoose.connection.model('CropTemplate', CropTemplate().schema);
                templates = await PrimaryModel.find();
            }
        } catch (err) {
            console.error(`[CropRecommendation] DB Error: ${err.message}`);
        }

        // Priority 3: Internal Fallback Engine (User should NEVER see an empty screen)
        if (!templates || templates.length === 0) {
             source = "internal_fallback";
             templates = [
                { name: "Rice", planting_months: ["June", "July", "August", "September", "October", "November", "December"], soil_types: ["Alluvial Soil", "Clay", "Black Soil"], water_requirement: "High", duration_days: 120 },
                { name: "Maize", planting_months: ["June", "July", "November", "December", "January"], soil_types: ["Alluvial Soil", "Red Soil", "Black Soil"], water_requirement: "Medium", duration_days: 100 },
                { name: "Groundnut", planting_months: ["June", "July", "November", "December"], soil_types: ["Red Soil", "Sandy Loam", "Laterite Soil"], water_requirement: "Medium", duration_days: 110 },
                { name: "Turmeric", planting_months: ["June", "July", "August"], soil_types: ["Alluvial Soil", "Red Soil", "Loam"], water_requirement: "High", duration_days: 270 },
                { name: "Cotton", planting_months: ["May", "June", "July", "August"], soil_types: ["Black Soil", "Alluvial Soil"], water_requirement: "Medium", duration_days: 160 },
                { name: "Coconut", planting_months: ["January", "February", "March", "April", "May", "June"], soil_types: ["Alluvial Soil", "Sandy Loam", "Laterite Soil"], water_requirement: "High", duration_days: 365 }
            ];
        }

        console.log(`[CropRecommendation] Logic complete. Source: ${source}. Template count: ${templates.length}`);

        // 2. Matching and Scoring
        const results = templates.map(crop => {
            const pMonths = crop.planting_months || crop.plantingMonths || [];
            const sTypes = crop.soil_types || crop.soilTypes || [];
            const wReq = (crop.water_requirement || crop.waterRequirement || 'Medium').toLowerCase();
            const userW = waterAvailability.toLowerCase();

            // Month Match (30%)
            const monthMatch = pMonths.some(m => 
                m.toLowerCase().includes(currentMonth.toLowerCase().substring(0, 3)) ||
                currentMonth.toLowerCase().includes(m.toLowerCase().substring(0, 3))
            );
            
            // Soil Match (50%) - Enhanced matching
            const soilMatch = sTypes.some(s => {
                const sLower = s.toLowerCase();
                const uLower = soilType.toLowerCase();
                // Avoid matching just the word "soil"
                if (sLower === 'soil') return false;
                return uLower.includes(sLower) || sLower.includes(uLower);
            });

            // Water Match (20%)
            const waterMap = { 'low': 1, 'medium': 2, 'high': 3 };
            const cropWLevel = waterMap[wReq] || 2;
            const userWLevel = waterMap[userW] || 2;
            
            // Logic: High water crop in Low water area = CRITICAL MISMATCH
            let waterScore = 0;
            let criticalWaterMismatch = false;
            
            if (cropWLevel <= userWLevel) {
                waterScore = 20; // Perfect or safer
            } else if (cropWLevel === userWLevel + 1) {
                waterScore = 10; // Slightly risky
            } else {
                waterScore = -30; // Critical mismatch (e.g. High crop in Low water)
                criticalWaterMismatch = true;
            }

            // Calculation
            let finalAccuracy = 0;
            if (soilMatch) finalAccuracy += 50;
            if (monthMatch) finalAccuracy += 30;
            finalAccuracy += waterScore;

            // Penalty for no soil match
            if (!soilMatch) finalAccuracy -= 20;

            // Cap and ensure non-negative
            finalAccuracy = Math.max(5, Math.min(finalAccuracy, 98));

            // Veto: If it's a critical water mismatch and soil mismatch, it should be very low
            if (criticalWaterMismatch && !soilMatch) finalAccuracy = Math.min(finalAccuracy, 15);

            return {
                name: crop.name,
                accuracy: Math.round(finalAccuracy),
                durationDays: crop.duration_days || 120
            };
        });

        // 3. Sort and Respond
        results.sort((a, b) => b.accuracy - a.accuracy);

        // Limit results - don't show garbage
        const filteredResults = results.filter(r => r.accuracy > 30);
        const finalSelection = filteredResults.length > 0 ? filteredResults.slice(0, 6) : results.slice(0, 3);
        
        res.status(200).json({ 
            success: true,
            source: source,
            recommendedCrops: finalSelection 
        });

    } catch (error) {
        console.error('🔥 Fatal Recommendation Error:', error);
        res.status(200).json({ 
            success: false,
            recommendedCrops: [
                { name: "Rice", accuracy: 85, durationDays: 120 },
                { name: "Maize", accuracy: 78, durationDays: 100 }
            ] 
        });
    }
};

exports.addCrop = async (req, res) => {
    try {
        const { userId, cropName, plantingDate } = req.body;
        console.log(`[AddCrop] Attempting to add ${cropName} for user ${userId}`);

        // 1. Try to find template in DB
        let template = await CropTemplate().findOne({ name: { $regex: new RegExp(`^${cropName}$`, 'i') } });
        
        // 2. Fallback Template (matching our recommendation fallback)
        if (!template) {
            console.warn(`[AddCrop] Template for ${cropName} not found in DB. Using internal fallback.`);
            const fallbacks = {
                "Rice": { duration_days: 120, stages: [
                    { name: "Initial", day: 0, icon: "🌱" },
                    { name: "Development", day: 30, icon: "🌿" },
                    { name: "Mid-Season", day: 70, icon: "🌾" },
                    { name: "Late-Season", day: 100, icon: "🍂" },
                    { name: "Harvest", day: 120, icon: "🧺" }
                ]},
                "Maize": { duration_days: 100, stages: [
                    { name: "Initial", day: 0, icon: "🌱" },
                    { name: "Growth", day: 20, icon: "🌿" },
                    { name: "Flowering", day: 55, icon: "🌽" },
                    { name: "Maturity", day: 85, icon: "🍂" },
                    { name: "Harvest", day: 100, icon: "🧺" }
                ]},
                "Cotton": { duration_days: 160, stages: [
                    { name: "Sowing", day: 0, icon: "🌱" },
                    { name: "Vegetative", day: 30, icon: "🌿" },
                    { name: "Flowering", day: 80, icon: "🌸" },
                    { name: "Boll Opening", day: 130, icon: "☁️" },
                    { name: "Harvest", day: 160, icon: "🧺" }
                ]}
            };
            template = fallbacks[cropName] || { 
                duration_days: 110, 
                stages: [
                    { name: "Initial", day: 0, icon: "🌱" },
                    { name: "Growth", day: 30, icon: "🌿" },
                    { name: "Mid", day: 60, icon: "🌾" },
                    { name: "Maturity", day: 90, icon: "🍂" },
                    { name: "Harvest", day: 110, icon: "🧺" }
                ] 
            };
        }

        const harvestDate = moment(plantingDate || new Date()).add(template.duration_days, 'days').format('YYYY-MM-DD');

        const newUserCrop = new UserCrop({
            userId,
            crop: cropName,
            plantingDate: plantingDate || new Date(),
            durationDays: template.duration_days,
            harvestDate,
            stages: template.stages
        });

        await newUserCrop.save();
        console.log(`[AddCrop] Success! Created UserCrop with ID: ${newUserCrop._id}`);
        res.status(201).json(newUserCrop);

    } catch (error) {
        console.error('Error adding crop:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCropInstance = async (req, res) => {
    try {
        const { cropId } = req.params;
        console.log(`[DeleteCrop] Deleting crop instance: ${cropId}`);
        await UserCrop.findByIdAndDelete(cropId);
        res.status(200).json({ success: true, message: "Crop deleted from tracking" });
    } catch (error) {
        console.error('Error deleting crop instance:', error);
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
        const stages = userCrop.stages || [];
        
        if (stages.length > 0) {
            // Sort stages by day
            const sortedStages = [...stages].sort((a, b) => a.day - b.day);
            
            for (const stage of sortedStages) {
                if (daysPassed >= stage.day) {
                    currentStageName = stage.name;
                }
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
            stages: stages
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching crop progress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
