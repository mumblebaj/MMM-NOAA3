const moment = require('moment');

const provider = {
    config: {},

    imageArray: {
        "01n": "clear", "01d": "clear", "02d": "mostlycloudy",
        "03d": "mostlycloudy", "04d": "mostlycloudy", "09d": "rain",
        "10d": "rain", "11d": "tstorms", "13d": "snow", "50d": "chancerain",
        "03n": "mostlycloudy", "800": "overcast", "04n": "overcast"
    },

    addModuleConfiguration: function (moduleConfig) {
        if (!moduleConfig.apiKey) {
            throw new Error('Invalid config, No key for OpenWeather');
        }
        this.config = { ...moduleConfig };
    },

    fetchWeatherData: async function () {
        
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${this.config.userlat}&lon=${this.config.userlon}&exclude=minutely&appid=${this.config.apiKey}&units=${this.config.units}&lang=en`;
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

    fetchAirQuality: async function () {
        
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

    fetchSunriseSunset: async function () {
        
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

    parseWeatherData: function (data) {
        
        const current = {
            weather: data.current.weather[0].main,
            weather_f: data.current.weather[0].description,
            temp_c: Math.round(data.current.temp),
            temp_f: Math.round(data.current.temp),
            icon: this.imageArray[data.current.weather[0].icon] || "unknown",
            humidity: data.current.humidity,
            pressure_mb: data.current.pressure,
            pressure_in: Math.round(data.current.pressure * 0.02953),
            UV: data.current.uvi,
            wind_mph: data.current.wind_speed,
            wind_kph: data.current.wind_speed,
            visibility_mi: Math.round(data.current.visibility * 0.00062137),
            visibility_km: data.current.visibility,
        };

        const forecast = data.daily.slice(0, 4).map(day => {
            return {
                date: { weekday_short: moment.unix(day.dt).utc().format('ddd') },
                high: {
                    fahrenheit: Math.round(day.temp.day),
                    celsius: Math.round(day.temp.day)
                },
                low: {
                    fahrenheit: Math.round(day.temp.night),
                    celsius: Math.round(day.temp.night)
                },
                desc: day.weather[0].description,
                icon: this.imageArray[day.weather[0].icon] || "unknown"
            };
        });

        return { current, forecast };
    }
};

if (typeof module !== "undefined") {
    module.exports = provider;
}
