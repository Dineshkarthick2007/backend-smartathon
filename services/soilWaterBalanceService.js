/**
 * Calculate the soil water content based on a daily balance.
 * Formula: SoilWater = PreviousSoilWater + Rainfall + Irrigation - ETc
 * 
 * Ensure soil water does not exceed field capacity.
 * 
 * @param {Number} previousSoilWater - Previous day soil water content (mm)
 * @param {Number} rainfall - Rainfall depth (mm)
 * @param {Number} irrigation - Irrigation depth applied (mm)
 * @param {Number} etc - Crop evapotranspiration (mm)
 * @param {Number} fieldCapacity - The field capacity indicating the maximum amount of water soil can hold (mm)
 */
const calculateSoilWater = (
    previousSoilWater,
    rainfall,
    irrigation,
    etc,
    fieldCapacity
) => {
    // Water balance
    let currentSoilWater = previousSoilWater + rainfall + irrigation - etc;

    return validateSoilWaterBounds(currentSoilWater, fieldCapacity, 0);
};

const validateSoilWaterBounds = (soilWater, ceilingLimit, floorLimit) => {
    let result = Math.min(soilWater, ceilingLimit); // Cannot exceed field capacity
    result = Math.max(result, floorLimit); // Cannot be less than 0
    return result;
};

module.exports = { calculateSoilWater };
