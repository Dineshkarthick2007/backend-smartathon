const { getWeatherData } = require('./weatherService');
const { calculateETo } = require('./etoService');
const { getKcForStage } = require('./cropStageService');
const { calculateSoilWater } = require('./soilWaterBalanceService');

/**
 * Irrigation execution engine logic which simulates current and future conditions.
 * @param {Object} state - IrrigationState document
 * @param {Object} crop - Crop document
 * @returns {Object} Report containing recommendations and schedule array
 */
const generateIrrigationReport = async (state, crop) => {

    // 1 & 2. We already passed irrigation_state and crop models

    // 3. Fetch weather forecast (returns an array of daily objects for ~5 days starting today)
    const forecast = await getWeatherData(state.latitude, state.longitude);

    // 4 to 10. Process each day in forecast to generate schedule
    const schedule = [];

    // Initial conditions from the document state

    // The "currentSoilMoisture" is a fraction like 0.22, we should multiply by root zone depth
    // Wait, let's treat it as mm if the context means it's fractional volume? 
    // "AvailableWater = (FieldCapacity - WiltingPoint) * RootDepth" implies FC and WP are fractional.
    // Let's multiply fractions by root zone depth (converted to mm) to get absolute mm levels.
    const rootDepthMM = state.rootZoneDepth * 1000;
    const FC_mm = state.fieldCapacity * rootDepthMM;
    const WP_mm = state.wiltingPoint * rootDepthMM;
    const AW_mm = FC_mm - WP_mm; // Total available water

    let currentSoilWaterMM = state.currentSoilMoisture * rootDepthMM;

    let nextIrrigationDays = -1; // -1 means no irrigation needed in the upcoming 5 days
    let recommendedWaterMM = 0;

    for (let i = 0; i < forecast.length; i++) {
        const dayWeather = forecast[i];
        const isToday = (i === 0);

        // Target date
        const targetDate = new Date(dayWeather.date);

        // 4. Calculate ETo
        const eto = calculateETo(dayWeather.temperature, dayWeather.windSpeed, dayWeather.solarRadiation, 50);

        // Get Kc (Dynamic based on plant growth season)
        const kc = getKcForStage(state.plantingDate, crop, targetDate);

        // 5. Calculate ETc
        const etc = eto * kc;
        const rainfall = dayWeather.precipitation || 0;

        // Predictive future rain lookahead (next 48 hrs)
        let futureRain = 0;
        if (i + 1 < forecast.length) futureRain += (forecast[i + 1].precipitation || 0);
        if (i + 2 < forecast.length) futureRain += (forecast[i + 2].precipitation || 0);

        // Preliminary soil water drop (ETc) before we decide to irrigate
        let tempSoilWater = currentSoilWaterMM + rainfall - etc;
        let depletion = FC_mm - tempSoilWater;
        if (depletion < 0) depletion = 0;

        let action = "Monitor";
        let waterToApply = 0;

        // 9. Dynamic Irrigation Trigger (50% management allowed depletion)
        const managementAllowedDepletion = 0.50 * AW_mm;

        if (depletion > managementAllowedDepletion) {
            // Deficit trigger hit! But what about incoming storms?
            if (futureRain > depletion * 0.75) {
                action = "Skip Irrigation"; // The incoming rain will naturally fill the root zone
                waterToApply = 0;
            } else if (futureRain > 5.0) {
                action = "Irrigate"; // Rain is coming, but not enough. Use Deficit Irrigation!
                waterToApply = Math.max(0, depletion - futureRain);
            } else {
                action = "Irrigate"; // No rain coming, fill to field capacity
                waterToApply = depletion;
            }

            if (action === "Irrigate") {
                if (nextIrrigationDays === -1) {
                    nextIrrigationDays = i;
                    recommendedWaterMM = waterToApply;
                }
            }
        } else if (rainfall > 3.0) {
            action = "Skip Irrigation";
        }

        // Apply our intelligent decision into the actual soil water balance model
        const irrigationAppliedOnDay = waterToApply;
        currentSoilWaterMM = calculateSoilWater(currentSoilWaterMM, rainfall, irrigationAppliedOnDay, etc, FC_mm);

        schedule.push({
            day: isToday ? "Today" : `Day ${i + 1}`,
            date: dayWeather.date,
            water: Math.round(waterToApply),
            action: action,
            depletion: Math.round(FC_mm - currentSoilWaterMM),
            etc: Math.round(etc * 10) / 10
        });
    }

    // Determine current soil status label for Today's conditions
    const currentDepletionPercentage = ((FC_mm - (state.currentSoilMoisture * rootDepthMM)) / AW_mm) * 100;
    let soilStatus = "Optimal"; // less than 25% depleted
    if (currentDepletionPercentage > 50) soilStatus = "Dry";
    else if (currentDepletionPercentage > 25) soilStatus = "Medium";
    else if (currentDepletionPercentage < 0) soilStatus = "Wet"; // above field capacity

    // Create an intelligent, dynamic reason string
    let reason = "Soil moisture is currently optimal. No irrigation is needed today.";
    const todaySchedule = schedule[0];

    // Compute future rain for dynamic reason
    let upcomingRain = 0;
    if (forecast.length > 1) upcomingRain += forecast[1].precipitation || 0;
    if (forecast.length > 2) upcomingRain += forecast[2].precipitation || 0;

    if (todaySchedule.action === "Irrigate") {
        const fullDepletion = FC_mm - (state.currentSoilMoisture * rootDepthMM);
        if (todaySchedule.water < fullDepletion * 0.9 && upcomingRain > 0) {
            reason = `Deficit irrigation recommended. Your ${crop.name} requires ${todaySchedule.etc.toFixed(1)}mm/day of water right now, but since ${upcomingRain.toFixed(1)}mm of rain is forecasted soon, applying only ${todaySchedule.water}mm to avoid root waterlogging.`;
        } else {
            reason = `High depletion detected! Moisture level has dropped below the 50% safe threshold. Recommend applying ${todaySchedule.water}mm of water to reach field capacity for your ${crop.name} immediately.`;
        }
    } else if (todaySchedule.action === "Skip Irrigation") {
        if (forecast[0].precipitation > 3.0) {
            reason = `We detected a heavy rainfall of ${forecast[0].precipitation}mm today. Irrigation should be completely paused to prevent over-saturation.`;
        } else if (upcomingRain > 5.0) {
            reason = `Significant rainfall of ${upcomingRain}mm is forecasted over the next 48 hours for your location. Holding off irrigation allows natural rainfall to replenish the ${crop.name}'s root zone safely.`;
        } else {
            reason = `Soil moisture is at a healthy ${100 - Math.round(currentDepletionPercentage)}% capacity for your ${crop.name}. It does not demand any irrigation today based on current evapotranspiration rates.`;
        }
    } else {
        reason = `Soil moisture is at a healthy ${100 - Math.round(currentDepletionPercentage)}%. Evapotranspiration (ETc) for today is just ${todaySchedule.etc.toFixed(1)}mm. Continue monitoring.`;
    }

    return {
        next_irrigation_days: nextIrrigationDays === -1 ? null : nextIrrigationDays,
        water_amount_mm: Math.round(recommendedWaterMM),
        soil_status: soilStatus,
        crop_water_need: Math.round(schedule[0].etc), // Today's ETc
        recommendation_reason: reason,
        schedule: schedule
    };
};

module.exports = { generateIrrigationReport };
