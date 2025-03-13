/* Magic Mirror
 * Module: MMM-NOAA3
 * By Cowboysdude special Thanks to JimL from php help forum!
 */
var NodeHelper = require("node_helper");
var moment = require('moment');
//var request = require('request');
const fs = require('fs');

module.exports = NodeHelper.create({

    config: {
        updateInterval: 5 * 1000,
        initialLoadDelay: 400000
    },
    provider: null,
    providers: {
        darksky: 'ds',
        openweather: 'ow',
        wunderground: 'wg',
        apixu: 'ax',
        weatherbit: 'wb',
        weatherunlocked: 'wu',
        accuweather: 'aw',
        msn: 'ms',
    },

    start: function () {
        var self = this;
        setTimeout(function () {});
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-NOAA3") {
            //this.sendSocketNotification('MMM-NOAA3');
            this.path = "modules/MMM-NOAA3/latlon.json";
            this.provider = this.getProviderFromConfig(payload);
            this.provider.addModuleConfiguration(payload);
            this.config = payload;
            this.getData();
            this.getSRSS();
            this.getAIR();
            this.getMoonData();
            if (this.providers[config.provider] == 'ds') {
                console.log(this.providers[config.provider]);
                this.getALERT()
            };
        }
        this.scheduleUpdate(this.config.updateInterval);
    },

    scheduleUpdate: function () {
        var self = this;
        self.updateInterval = setInterval(() => {
            console.log('NOAA3 weather updated.. next update in 1 hour');
            self.getData();
            self.getSRSS();
            self.getAIR();
            self.getALERT();
            if (self.providers[config.provider] == 'ds') {
                self.getALERT()
            };
        }, self.config.updateInterval);
    },

    getMoonData: async function () {
        var self = this;
        var date = moment().unix();

        const url = "http://api.farmsense.net/v1/moonphases/?d=" + date;
        const options = {
            method: 'GET'
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error('getMoonData response was not ok');
            }
            var moons = await response.json();
            var moon = moons[0]['Phase'];
            self.sendSocketNotification("MOON_RESULT", moon ? moon : 'NO_MOON_DATA');
        } catch (error) {
            console.log("getMoonData Error: " + error.message);
            return;
        }
    },

    getData: async function () {
        try {
            
            const response = await this.provider.fetchWeatherData();
            
            this.sendSocketNotification("WEATHER_RESULT", response || 'NO_WEATHER_RESULT');
        } catch (error) {
            console.error("Error fetching weather data:" + error);
			
            this.sendSocketNotification("WEATHER_RESULT", 'NO_WEATHER_RESULT');
        }
    },

    getSRSS: async function () {
        try {
			const response = await this.provider.fetchSunriseSunset();
			
            this.sendSocketNotification("SRSS_RESULT", response || 'NO_SRSS_DATA');
		} catch (error) {
			console.error("Error fetching SRSS data:" + error);
			
			this.sendSocketNotification("SRSS_RESULT: ", 'NO_SRSS_DATA');
        }
    },

    getAIR: async function () {
        try {
			const response = await this.provider.fetchAirQuality();
			
            this.sendSocketNotification("AIR_RESULT", response || 'NO_AIR_DATA');
        } catch (error) {
			console.error("Error fetching Air Data:", error);
			
			this.sendSocketNotification("AIR_RESULT", 'NO_AIR_DATA');
		}
    },

    getALERT: function () {
        var self = this;
        self.provider.getALERT(function (response) {
            self.sendSocketNotification("ALERT_RESULT", response ? response : 'NO_ALERT_DATA');
        });
    },

    getProviderFromConfig: function (config) {
        if (!this.providers[config.provider]) {
            throw new Error('Invalid config No provider selected');
        }
        console.log(this.providers[config.provider]);
        return require('./providers/' + this.providers[config.provider] + '.js');
    }
});
