const axios = require('axios');

/**
 * Fetch weather data from Open-Meteo API.
 * Endpoint: https://api.open-meteo.com/v1/forecast
 * Required parameters: latitude, longitude
 * 
 * Returns daily forecast for temperature, relative humidity, wind speed, 
 * solar radiation, and precipitation. we assume 5 days.
 */
const getWeatherData = async (latitude, longitude) => {
    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude,
                longitude,
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,shortwave_radiation_sum', // adding approximate necessary params
                timezone: 'auto',
                forecast_days: 5 // Get today + 4 days forecast
            }
        });

        // Structure the response to an array of daily objects
        const dailyData = response.data.daily;
        const forecast = [];

        for (let i = 0; i < dailyData.time.length; i++) {
            // Rough approximation: avg temperature
            const tempMax = dailyData.temperature_2m_max[i];
            const tempMin = dailyData.temperature_2m_min[i];
            const temp = (tempMax + tempMin) / 2;

            forecast.push({
                date: dailyData.time[i],
                temperature: temp,
                windSpeed: dailyData.wind_speed_10m_max[i] * (1000 / 3600), // convert km/h to m/s
                solarRadiation: dailyData.shortwave_radiation_sum[i], // MJ/m2
                precipitation: dailyData.precipitation_sum[i] // mm
            });
        }

        return forecast;
    } catch (error) {
        console.error('Error fetching weather data from Open-Meteo:', error.message);
        throw error;
    }
};

module.exports = { getWeatherData };
