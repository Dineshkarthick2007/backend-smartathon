/**
 * Determine the correct Crop Coefficient (Kc) based on the days since planting.
 * 
 * @param {Date} plantingDate - The date the crop was planted
 * @param {Object} crop - Crop document containing growth days and kc values
 * @param {Date} targetDate - The date for which Kc is being calculated (default is today)
 */
const getKcForStage = (plantingDate, crop, targetDate = new Date()) => {
    const plantingTime = new Date(plantingDate).getTime();
    const targetTime = targetDate.getTime();

    // Calculate days since planting (milliseconds to days)
    const daysSincePlanting = Math.floor((targetTime - plantingTime) / (1000 * 60 * 60 * 24));

    if (daysSincePlanting <= 0) {
        return crop.kcInitial;
    }

    const endInitial = crop.growthDaysInitial;
    const endDev = endInitial + crop.growthDaysDevelopment;
    const endMid = endDev + crop.growthDaysMid;
    const endLate = endMid + crop.growthDaysLate;

    if (daysSincePlanting <= endInitial) {
        return crop.kcInitial;
    } else if (daysSincePlanting <= endDev) {
        // Interpolate between initial and mid for development stage
        const devDaysIn = daysSincePlanting - endInitial;
        const progress = devDaysIn / crop.growthDaysDevelopment;
        return crop.kcInitial + (crop.kcMid - crop.kcInitial) * progress;
    } else if (daysSincePlanting <= endMid) {
        return crop.kcMid;
    } else if (daysSincePlanting <= endLate) {
        // Interpolate between mid and late for late stage
        const lateDaysIn = daysSincePlanting - endMid;
        const progress = lateDaysIn / crop.growthDaysLate;
        return crop.kcMid + (crop.kcLate - crop.kcMid) * progress;
    } else {
        // Post harvest / end of growth
        return crop.kcLate;
    }
};

module.exports = { getKcForStage };
