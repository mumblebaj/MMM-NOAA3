const moment = require('moment');
const xml2js = require('xml2js');
var lat, lon, zip, UV;
var current;

var provider = {
    config: {},
    imageArray: {
        "3": "tstorms",
        "4": "tstorms",
        "5": "chancesleet",
        "6": "chancesleet",
        "7": "chancesleet",
        "8": "sleet",
        "9": "drizzle",
        "10": "sleet",
        "11": "rain",
        "12": "rain",
        "13": "flurries",
        "14": "snow",
        "15": "snow",
        "16": "snow",
        "17": "NA",
        "18": "sleet",
        "19": "hazy",
        "20": "fog",
        "21": "hazy",
        "22": "hazy",
        "23": "wind",
        "24": "wind",
        "25": "NA",
        "26": "cloudy",
        "27": "partlycloudy",
        "28": "partlycloudy",
        "29": "partlycloudy",
        "30": "partlycloudy",
        "31": "clear",
        "32": "clear",
        "33": "clear",
        "34": "clear",
        "35": "chancesleet",
        "36": "clear",
        "37": "tstorms",
        "38": "tstorms",
        "39": "tstorms",
        "40": "rain",
        "41": "snow",
        "42": "snow",
        "43": "snow",
        "44": "partlycloudy",
        "45": "tstorms",
        "46": "snow",
        "47": "tstorms"
    },

    addModuleConfiguration: function (moduleConfig) {
        if (!moduleConfig.apiKey) {
            throw new Error('Invalid config, No key for Apixu Provider');
        }
        this.config = {
            ...moduleConfig
        };
    },

    fetchWeatherData: async function () {
        convert = {
            "imperial": "F",
            "metric": "C"
        }
        var self = this;
        url = "http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=" + convert[config.units] + "+&culture=" + config.language + "&weasearchstr=" + this.config.userlat + "," + this.config.userlon;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const xmlText = await response.text(); // Extract XML body as text

            return this.parseResponse(xmlText); // Pass the raw XML string to parseResponse
        } catch (error) {
            console.error("Error fetching MSN data:", error);
        }
    },

    fetchSunriseSunset: async function () {

        const url = `https://api.sunrise-sunset.org/json?lat=${this.config.userlat}&lng=${this.config.userlon}&formatted=0`;
        try {
            const response = await fetch(url);
            if (!response.ok)
                throw new Error('Sunrise-Sunset API response was not ok');
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
            if (!response.ok)
                throw new Error('Air Quality API response was not ok');
            const data = await response.json();
            return {
                air: data.data.current.pollution
            };
        } catch (error) {
            console.log("Air Quality Data Error:", error.message);
            return null;
        }
    },

    parseResponse: function (response) {
        const parser = new xml2js.Parser({
            explicitArray: false
        });

        return new Promise((resolve, reject) => {
            parser.parseString(response, (err, result) => {
                if (err) {
                    console.error("XML Parsing Error:", err);
                    reject(err);
                    return;
                }

                var weather = result.weatherdata.weather;
				
				const forecast = weather.forecast.slice(0, 4).map(day => {
					return {
						date: { weekday_short: day.$.shortday },
						high: {
							fahrenheit: Math.round(day.$.high),
							celsius: Math.round(day.$.high)
						},
						low: {
							fahrenheit: Math.round(day.$.low),
							celsius: Math.round(day.$.low)
						},
						desc: day.$.skytextday,
						icon: this.imageArray[day.$.skycodeday] || "unknown"
					};
				});

                var currentweather = weather.current;
                var currently = currentweather.$;

                let windSpeed = currently.windspeed.replace(/\D/g, "");
                const current = {
                    weather: currently.skytext,
                    weather_f: currently.skytext,
                    temp_f: currently.temperature,
                    temp_c: currently.temperature,
                    icon: this.imageArray
                     ? this.imageArray[currently.skycode]
                     : "unknown",
                    humidity: currently.humidity + "%",
                    pressure_in: "1",
                    pressure_mb: "1",
                    UV: "2",
                    visibility_mi: "1",
                    visibility_km: "1",
                    wind_mph: windSpeed,
                    wind_kph: windSpeed
                };

                resolve({
                    current,
                    forecast
                });
            });
        });
    }
};

if (typeof module !== "undefined") {
    module.exports = provider;
}
