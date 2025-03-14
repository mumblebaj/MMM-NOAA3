const moment = require('moment');

const provider = {
    config: {},

    imageArray: {
        "200": "tstorms", "201": "tstorms", "202": "tstorms", "230": "tstorms", "231": "tstorms", "232": "tstorms", "233": "tstorms",
        "300": "chancerain", "301": "chancerain", "302": "chancetstorms", "500": "rain", "501": "rain", "502": "rain",
        "511": "sleet", "520": "rain", "521": "rain", "522": "rain", "600": "chancesnow", "601": "snow", "602": "snow",
        "610": "chancesleet", "611": "sleet", "612": "sleet", "621": "snow", "622": "snow", "623": "chancesnow",
        "700": "fog", "711": "hazy", "721": "hazy", "731": "hazy", "741": "fog", "751": "fog", "800": "clear",
        "801": "partlycloudy", "802": "partlycloudy", "803": "partlycloudy", "804": "overcast", "900": "na"
    },

    addModuleConfiguration(moduleConfig) {
        if (!moduleConfig.apiKey) throw new Error('Invalid config, No key for Weatherbit');
        this.config = { ...moduleConfig };
    },

    fetchWeatherData: async function() {
        const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${this.config.userlat}&lon=${this.config.userlon}&days=4&units=I&key=${this.config.apiKey}&lang=${this.config.language}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API response was not ok');
            const data = await response.json();
            return this.parseWeatherData(data);
        } catch (error) {
            console.log("Weather Data Error:", error.message);
            return null;
        }
    },

    parseWeatherData: function(data) {
        const current = data.data[0];
        const forecast = data.data.map(day => ({
            date: { weekday_short: moment(day.datetime, "YYYY-MM-DD").format('ddd') },
            high: { fahrenheit: Math.round(day.app_max_temp), celsius: Math.round((day.app_max_temp - 32) * 5 / 9) },
            low: { fahrenheit: Math.round(day.app_min_temp), celsius: Math.round((day.app_min_temp - 32) * 5 / 9) },
            icon: this.imageArray[day.weather.code],
            desc: day.weather.description
        }));
        return {
            current: {
                weather: current.weather.description,
				weather_f: current.weather.description,
                temp_f: Math.round(current.temp),
                temp_c: Math.round((current.temp - 32) * 5 / 9),
                icon: this.imageArray[current.weather.code],
                humidity: `${current.rh}%`,
                pressure_in: Math.round(current.pres * 0.02953),
                pressure_mb: Math.round(current.pres),
                UV: Math.round(current.uv),
                visibility_mi: current.vis,
                wind_mph: Math.round(current.wind_spd),
                wind_kph: Math.round(current.wind_spd),
            },
            forecast
        };
    },

    fetchSunriseSunset: async function () {
        console.log('MMM-NOAA3 fetching sunrise/sunset data');
        const url = `https://api.sunrise-sunset.org/json?lat=${this.config.userlat}&lng=${this.config.userlon}&formatted=0`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Sunrise-Sunset API response was not ok');
            const data = await response.json();
            return {
                sunrise: data.results.sunrise,
                sunset: data.results.sunset,
                day_length: data.results.day_length
            };
        } catch (error) {
            console.log("Sunrise-Sunset Data Error:", error.message);
            return null;
        }
    },

    fetchAirQuality: async function () {
        console.log('MMM-NOAA3 fetching air quality data');
        const url = `http://api.airvisual.com/v2/nearest_city?lat=${this.config.userlat}&lon=${this.config.userlon}&key=${this.config.airKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Air Quality API response was not ok');
            const data = await response.json();
            return { air: data.data.current.pollution };
        } catch (error) {
            console.log("Air Quality Data Error:", error.message);
            return null;
        }
    },

    async getWeatherAlert(callback) {
        const url = `http://api.wunderground.com/api/a4d00a39e75848da/alerts/q/pws:KPALANCA9.json`;
        const data = await this.fetchData(url);
        callback(data ? { alert: data } : null);
    }
};

if (typeof module !== "undefined") {
    module.exports = provider;
}
