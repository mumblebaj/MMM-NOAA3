const request = require('request');
const moment = require('moment');

const provider = {
    config: {},

    imageArray: {
        "clear-day": "clear",
        "clear-night": "clear",
        "partly-cloudy-day": "mostlycloudy",
        "partly-cloudy-night": "mostlycloudy",
        "cloudy": "cloudy",
        "rain": "rain",
        "sleet": "sleet",
        "snow": "chancesnow",
        "wind": "na",
        "fog": "fog",
        "overcast": "overcast",
        "Breezy and Overcast": "overcast"
    },

    addModuleConfiguration(moduleConfig) {
        if (!moduleConfig.apiKey) {
            throw new Error('Invalid config, No API key provided');
        }
        this.config = { ...moduleConfig };
    },

    async fetchData(url) {
        return new Promise((resolve, reject) => {
            request(url, (error, response, body) => {
                if (error) {
                    console.error("Request Error:", error.message);
                    reject(null);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
    },

    async fetchSunriseSunset() {
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

    async fetchWeatherData() {
        const url = `https://api.pirateweather.net/forecast/${this.config.apiKey}/${this.config.userlat},${this.config.userlon}?units=${this.config.units}&lang=${this.config.language}`;
        try {
            const data = await this.fetchData(url);
            return this.parseWeatherData(data);
        } catch {
            return(null);
        }
    },

    parseWeatherData(data) {
        if (!data) return null;

        const forecast = data.daily.data.slice(0, 4).map(day => {
            return {
                date: { weekday_short: moment.unix(day.time).format('ddd') },
                high: {
                    fahrenheit: Math.round(day.temperatureHigh),
                    celsius: Math.round((5 / 9) * (day.temperatureHigh - 32))
                },
                low: {
                    fahrenheit: Math.round(day.temperatureLow),
                    celsius: Math.round((5 / 9) * (day.temperatureLow - 32))
                },
                icon: this.imageArray[day.icon] || "na",
				desc: day.summary
            };
        });

        const current = {
            ss: moment(data.daily.data[0].sunsetTime).format('HH'),
            weather: data.currently.summary,
			weather_f: data.currently.summary,
            temp_f: Math.round(data.currently.temperature),
            temp_c: Math.round((data.currently.temperature - 32) * 5 / 9),
            icon: this.imageArray[data.currently.icon] || "na",
			UV: data.currently.uvIndex,
            humidity: `${Math.round(data.currently.humidity * 100)}%`,
            pressure_mb: Math.round(data.currently.pressure),
            wind_mph: data.currently.windSpeed,
            wind_kph: data.currently.windSpeed * 1.60934,
			visibility_mi: Math.round(data.currently.visibility * 0.00062137),
            visibility_km: data.currently.visibility,
        };

        return { current, forecast };
    }
};

if (typeof module !== "undefined") {
    module.exports = provider;
}
