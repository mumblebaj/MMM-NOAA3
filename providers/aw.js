const moment = require('moment');

var provider = {
    config: {},

    imageArray: {
        "1": "sunny", "2": "mostlysunny", "3": "mostlysunny", "4": "mostlycloudy",
        "5": "hazy", "6": "mostlycloudy", "7": "cloudy", "8": "overcast",
        "11": "fog", "12": "rain", "13": "chancerain", "14": "chancerain",
        "15": "tstorms", "16": "tstorms", "17": "tstorms", "18": "rain",
        "19": "flurries", "20": "chanceflurries", "21": "chanceflurries", "22": "snow",
        "23": "chancesnow", "24": "sleet", "25": "sleet", "26": "sleet",
        "29": "chancesleet", "30": "clear", "31": "clear", "32": "wind",
        "33": "clear", "34": "mostlyclear", "35": "partlycloudy", "36": "partlycloudy",
        "37": "hazy", "38": "chancerain", "39": "chancerain", "40": "chancerain",
        "41": "chancetstorms", "42": "chancetstorms", "43": "chanceflurries", "44": "chancesnow"
    },

    langarray: {
        "en": "en-us", "de": "de-de", "it": "it-it", "da": "da-dk", "es": "es-es",
        "sv": "sv-se", "nl": "nl-be", "zh_cn": "zh-cn", "fr": "fr-fr"
    },

    addModuleConfiguration: function (moduleConfig) {
        if (!moduleConfig.apiKey) {
            throw new Error('Invalid config, No key for Apixu Provider');
        }
        this.config = { ...moduleConfig };
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

    fetchWeatherData: async function () {
        try {
            const [current, forecast] = await Promise.all([
                this.getData(),
                this.getFore()
            ]);
            return { current, forecast };
        } catch (error) {
            console.error("Error fetching weather data:", error);
            return null;
        }
    },

    getFore: async function () {
        const url = `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${this.config.zip}?apikey=${this.config.apiKey}&language=${this.langarray[this.config.language]}&details=true&metric=false`;
        
		try {
            const response = await fetch(url);
            const data = await response.json();
            return this.parseForecast(data);
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return null;
        }
    },

    getData: async function () {
        const url = `http://dataservice.accuweather.com/currentconditions/v1/${this.config.zip}?apikey=${this.config.apiKey}&language=${this.langarray[this.config.language]}&details=true`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return this.parseResponse(data);
        } catch (error) {
            console.error('Error fetching current weather:', error);
            return null;
        }
    },

    parseForecast: function (response) {
        const forecast = response.DailyForecasts.map(day => ({
            date: { weekday_short: moment(day.Date).format('ddd') },
            high: { fahrenheit: Math.round(day.Temperature.Maximum.Value), celsius: Math.round((day.Temperature.Maximum.Value - 32) * 5 / 9) },
            low: { fahrenheit: Math.round(day.Temperature.Minimum.Value), celsius: Math.round((day.Temperature.Minimum.Value - 32) * 5 / 9) },
            icon: this.imageArray[day.Day.Icon] || "unknown",
            desc: day.Day.ShortPhrase
        }));
		return forecast;
    },

    parseResponse: function (response) {
		
        const result = response[0];
        const current = {
            weather: result.WeatherText,
			weather_f: result.WeatherText,
            temp_c: Math.round(result.Temperature.Metric.Value),
            temp_f: Math.round(result.Temperature.Imperial.Value),
            icon: this.imageArray[result.WeatherIcon] || "unknown",
            humidity: result.RelativeHumidity,
            pressure_mb: result.Pressure.Metric.Value,
            pressure_in: Math.round(result.Pressure.Imperial.Value),
            wind_kph: result.Wind.Speed.Metric.Value,
            wind_mph: result.Wind.Speed.Imperial.Value,
            UV: result.UVIndex,
            visibility_km: result.Visibility.Metric.Value,
            visibility_mi: result.Visibility.Imperial.Value
        };
		return current;
    }
};

if (typeof module !== "undefined") {
    module.exports = provider;
}
