const Fertilizer = require('../models/Fertilizer');
const UserCrop = require('../models/UserCrop');
const moment = require('moment');

exports.getFertilizerRecommendation = async (req, res) => {
    try {
        const { cropId } = req.params;
        const userCrop = await UserCrop.findById(cropId);

        if (!userCrop) {
            return res.status(404).json({ success: false, message: 'Crop instance not found' });
        }

        const today = moment();
        const start = moment(userCrop.plantingDate);
        const daysPassed = Math.max(0, today.diff(start, 'days'));

        // Fetch recommendations for this crop type
        let fertilizerData = await Fertilizer().findOne({ 
            crop: { $regex: new RegExp(`^${userCrop.crop}$`, 'i') } 
        });

        if (!fertilizerData) {
            console.log(`[FertilizerRec] No specific data for ${userCrop.crop}. Using general fallback.`);
            // Fallback for missing crops - better UX than "No data found"
            fertilizerData = {
                crop: userCrop.crop,
                recommendations: [
                    {
                        stage: "Growth",
                        day: 0,
                        fertilizers: [
                            { name: "Organic Compost", npk: "organic", doseKgPerAcre: 500 },
                            { name: "General NPK 19-19-19", npk: "19-19-19", doseKgPerAcre: 5 }
                        ]
                    }
                ]
            };
        }

        // Logic to find current and upcoming recommendations
        // We want to show recommendations relevant to the current day
        const recommendations = fertilizerData.recommendations.sort((a, b) => a.day - b.day);
        
        let currentRec = null;
        let upcomingRec = null;

        for (let i = 0; i < recommendations.length; i++) {
            if (daysPassed >= recommendations[i].day) {
                currentRec = recommendations[i];
            } else {
                upcomingRec = recommendations[i];
                break; // Found the first upcoming one
            }
        }

        // Add a "logic" field to explain why this is recommended
        const response = {
            success: true,
            crop: userCrop.crop,
            daysPassed,
            currentStage: currentRec ? currentRec.stage : 'Initial',
            recommendations: {
                current: currentRec,
                upcoming: upcomingRec
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('🔥 Fertilizer Recommendation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllFertilizerData = async (req, res) => {
    try {
        const data = await Fertilizer().find();
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
