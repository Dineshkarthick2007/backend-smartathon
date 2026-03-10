const cron = require('node-cron');
const IrrigationState = require('../models/IrrigationState');
const Crop = require('../models/Crop');
const { getWeatherData } = require('../services/weatherService');
const { calculateETo } = require('../services/etoService');
const { getKcForStage } = require('../services/cropStageService');
const { calculateSoilWater } = require('../services/soilWaterBalanceService');
const logger = require('../utils/logger');

// Run every day at 6 AM
const startDailyScheduler = () => {
    logger.info('Starting cron scheduler...');

    cron.schedule('0 6 * * *', async () => {
        logger.info('Running daily irrigation automation...');

        try {
            // Fetch all fields in the state
            const states = await IrrigationState.find();

            for (const state of states) {
                // Fetch crop parameters
                const crop = await Crop.findOne({ name: state.cropName });
                if (!crop) {
                    logger.warn(`Crop ${state.cropName} not found for field ${state.fieldId}`);
                    continue;
                }

                // 1. Fetch weather forecast for today (we just need the first day for daily state update)
                const forecast = await getWeatherData(state.latitude, state.longitude);
                if (!forecast || forecast.length === 0) {
                    logger.warn(`No weather data available for field ${state.fieldId}`);
                    continue;
                }

                const todayWeather = forecast[0];
                const now = new Date();

                // 2. Run partial irrigation engine (ETc & Soil Moisture)
                const eto = calculateETo(todayWeather.temperature, todayWeather.windSpeed, todayWeather.solarRadiation, 50);
                const kc = getKcForStage(state.plantingDate, crop, now);
                const etc = eto * kc;

                const rootDepthMM = state.rootZoneDepth * 1000;
                const fieldCapacityMM = state.fieldCapacity * rootDepthMM;
                const previousSoilWaterMM = state.currentSoilMoisture * rootDepthMM;

                const rainfall = todayWeather.precipitation || 0;
                const irrigationMM = state.lastIrrigationDate && state.lastIrrigationDate.toDateString() === now.toDateString() ? state.lastIrrigationMM : 0;

                // 4. Compute new soil moisture
                const currentSoilWaterMM = calculateSoilWater(previousSoilWaterMM, rainfall, irrigationMM, etc, fieldCapacityMM);

                // Convert back to fractional volume to store
                const newMoistureFraction = currentSoilWaterMM / rootDepthMM;

                // 3. Update irrigation_state
                state.currentSoilMoisture = newMoistureFraction;
                await state.save();

                logger.info(`Field ${state.fieldId} updated. New Moisture: ${newMoistureFraction}`);
            }
            logger.info('Daily automation completed successfully.');
        } catch (error) {
            logger.error(`Error during daily automation: ${error.message}`);
        }
    });
};

module.exports = { startDailyScheduler };
