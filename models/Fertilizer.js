const mongoose = require('mongoose');
const { getCropStagesConn } = require('../config/db');

const FertilizerSchema = new mongoose.Schema({
    crop: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    recommendations: [
        {
            stage: {
                type: String,
                required: true,
                lowercase: true
            },
            day: {
                type: Number,
                required: true
            },
            fertilizers: [
                {
                    name: {
                        type: String,
                        required: true
                    },
                    npk: {
                        type: String
                    },
                    doseKgPerAcre: {
                        type: Number
                    },
                    applicationMethod: {
                        type: String
                    },
                    notes: {
                        type: String
                    }
                }
            ]
        }
    ]
}, { timestamps: true });

const FertilizerModel = () => {
    const conn = getCropStagesConn();
    return conn.model('Fertilizer', FertilizerSchema, 'fertilizer_recommendation_data');
};

module.exports = FertilizerModel;
