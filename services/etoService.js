/**
 * Calculate reference evapotranspiration (ETo) using a simplified formula.
 * Formula approximation:
 * ETo = (0.408 * solarRadiation + 900 / (temp + 273) * windSpeed * (es - ea)) / (delta + gamma * (1 + 0.34 * windSpeed))
 * 
 * Where:
 * temp = mean temperature (°C)
 * windSpeed = wind speed at 2m height (m/s)
 * solarRadiation = solar radiation (MJ/m2/day)
 * 
 * To make this fully functional according to the prompt, we need approximations for es, ea, delta, and gamma.
 */
const calculateETo = (temp, windSpeed, solarRadiation, relativeHumidity = 50) => {
    // Basic approximations for the constants to complete the formula

    // Saturation vapor pressure
    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    // Actual vapor pressure (approximated from relative humidity)
    const ea = es * (relativeHumidity / 100);

    // Slope of vapor pressure curve
    const delta = (4098 * es) / Math.pow((temp + 237.3), 2);
    // Psychrometric constant approximation
    const gamma = 0.0665;

    // Numerator parts
    const radiationTerm = 0.408 * solarRadiation;
    const windTerm = (900 / (temp + 273)) * windSpeed * (es - ea);

    // Denominator
    const denominator = delta + gamma * (1 + 0.34 * windSpeed);

    let eto = (radiationTerm + windTerm) / denominator; // mm/day

    // Handle edge cases where ETo becomes negative
    return Math.max(0, eto);
};

module.exports = { calculateETo };
