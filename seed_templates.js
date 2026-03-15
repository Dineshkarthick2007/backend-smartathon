const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB, getCropStagesConn } = require('./config/db');
const CropTemplateModel = require('./models/CropTemplate');

const seedTemplates = async () => {
    try {
        await connectDB();
        const CropTemplate = CropTemplateModel();

        const templates = [
            {
                name: "Rice",
                planting_months: ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March"],
                harvest_months: ["October", "November", "December", "January", "February", "March", "April", "May", "June"],
                duration_days: 120,
                soil_types: ["Clay", "Loam", "Sandy Loam", "Silt", "Alluvial Soil", "Black Soil"],
                water_requirement: "High",
                stages: [
                    { name: "Initial", icon: "sprout", day: 0 },
                    { name: "Vegetative", icon: "leaf", day: 30 },
                    { name: "Reproductive", icon: "flower", day: 70 },
                    { name: "Ripening", icon: "grain", day: 100 }
                ]
            },
            {
                name: "Maize",
                planting_months: ["June", "July", "November", "December", "January", "February", "March"],
                harvest_months: ["September", "October", "February", "March", "April", "May"],
                duration_days: 100,
                soil_types: ["Loam", "Sandy Loam", "Red Soil", "Black Soil"],
                water_requirement: "Medium",
                stages: [
                    { name: "Seeding", icon: "sprout", day: 0 },
                    { name: "Knee High", icon: "leaf", day: 20 },
                    { name: "Tasseling", icon: "flower", day: 55 },
                    { name: "Maturity", icon: "corn", day: 85 }
                ]
            },
            {
                name: "Groundnut",
                planting_months: ["June", "July", "November", "December", "January", "February"],
                harvest_months: ["September", "October", "March", "April"],
                duration_days: 110,
                soil_types: ["Sandy", "Sandy Loam", "Red Soil"],
                water_requirement: "Medium",
                stages: [
                    { name: "Germination", icon: "sprout", day: 0 },
                    { name: "Flowering", icon: "flower", day: 30 },
                    { name: "Pegging", icon: "anchor", day: 50 },
                    { name: "Pod Formation", icon: "dot", day: 70 }
                ]
            },
            {
                name: "Cotton",
                planting_months: ["May", "June", "July", "August"],
                harvest_months: ["October", "November", "December", "January", "February"],
                duration_days: 165,
                soil_types: ["Black Soil", "Alluvial Soil", "Clay"],
                water_requirement: "Medium",
                stages: [
                    { name: "Seedling", icon: "sprout", day: 0 },
                    { name: "Squaring", icon: "square", day: 45 },
                    { name: "Flowering", icon: "flower", day: 70 },
                    { name: "Boll Opening", icon: "cloud", day: 120 }
                ]
            },
            {
                name: "Turmeric",
                planting_months: ["June", "July", "August"],
                harvest_months: ["January", "February", "March", "April"],
                duration_days: 270,
                soil_types: ["Loam", "Sandy Loam", "Red Soil", "Laterite Soil"],
                water_requirement: "High",
                stages: [
                    { name: "Sprouting", icon: "sprout", day: 0 },
                    { name: "Vegetative", icon: "leaf", day: 60 },
                    { name: "Rhizome Dev", icon: "circle", day: 150 },
                    { name: "Maturity", icon: "done", day: 240 }
                ]
            }
        ];

        console.log("Cleaning existing templates...");
        await CropTemplate.deleteMany({});

        console.log("Seeding templates...");
        await CropTemplate.insertMany(templates);

        console.log("Successfully seeded", templates.length, "crop templates into CropStages database.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedTemplates();
