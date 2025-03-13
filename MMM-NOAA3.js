/* Magic Mirror
 * Module: MMM-NOAA3
 * By cowboysdude with HUGE Thanks to JimL at https://www.phphelp.com!!
 */

var current = {};
var srss;

Module.register("MMM-NOAA3", {
    defaults: {
        animationSpeed: 0,
        initialLoadDelay: 8000,
        rotateInterval: 60 * 1000,
		updateInterval: 21600000,
		//updateInterval: 5 * 1000,
        apiKey: "",
        airKey: "",
        pws: "",
        css: "",
        frow: true,
		nupdate: false,
		userlat: "",
		userlon: "",

        langFile: {
            "en": "en-US",
            "de": "de-DE",
            "sv": "sv-SE",
            "es": "es-ES",
            "fr": "fr-FR",
            "zh_cn": "zh-CN",
            "da": "da",
            "nl": "nl-NL",
            "nb": "nb-NO"
        },

        langTrans: {
            "en": "EN",
            "de": "DL",
            "sv": "SW",
            "es": "SP",
            "fr": "FR",
            "zh_cn": "CN",
            "da": "DK",
            "nl": "NL",
            "nb": "NO",
		    "gr": "el"
			},

        levelTrans: {
            "1": "green",
            "2": "yellow",
            "3": "orange",
            "4": "red",
        },

        uvScale: {
            "0": "Low",
            "1": "Low",
            "2": "Low",
            "3": "Moderate",
            "4": "Moderate",
            "5": "Moderate",
            "6": "High",
            "7": "High",
            "8": "Very High",
            "9": "Very High",
            "10": "Very High",
            "11": "Extreme",
        },
		
		moon: {
			"Last Quarter": 'modules/MMM-NOAA3/images/moon/thirdquarter.png',
			"New Moon": 'modules/MMM-NOAA3/images/moon/newmoon.png',
			"Waxing": 'modules/MMM-NOAA3/images/moon/waxingcrescent.png',
			"First Quarter": 'modules/MMM-NOAA3/images/moon/firstquarter.png',
			"Waxing Gibbous": 'modules/MMM-NOAA3/images/moon/waxinggibbous.png',
			"Full Moon": 'modules/MMM-NOAA3/images/moon/fullmoon.png',
			"Waning Gibbous": 'modules/MMM-NOAA3/images/moon/waninggibbous.png',
			"Waning Crescent": 'modules/MMM-NOAA3/images/moon/waningcrescent.png',
			"Waxing Crescent": 'modules/MMM-NOAA3/images/moon/waxingcrescent.png',
			"3rd Quarter":'modules/MMM-NOAA3/images/moon/thirdquarter.png'
		}
    },


    getTranslations: function() {
        return {
            en: "translations/en.json",
            da: "translations/da.json",
            sv: "translations/sv.json",
            de: "translations/de.json",
            es: "translations/es.json",
            fr: "translations/fr.json",
            zh_cn: "translations/zh_cn.json",
            nl: "translations/nl.json",
            nb: "translations/nb.json",
			it: "translations/it.json",
			gr: "translations/gr.json"
        };

    },

    scheduleUpdate: function() {
        setInterval(() => {
        }, this.config.updateInterval);
    },

    secondsToString: function(seconds) {
        var seconds = this.srss.day;

        var date = new Date(seconds * 1000);
        var hh = date.getUTCHours();
        var mm = date.getUTCMinutes();
        var ss = date.getSeconds();
        if (hh < 10) {
            hh = "0" + hh;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }
        if (ss < 10) {
            ss = "0" + ss;
        }
        var t = hh + ":" + mm;
        return t;
    },

    getScripts: function() {
        return ['moment.js'];
    },

    getStyles: function() {
        if (this.config.css == "NOAA3") {
            return ["modules/MMM-NOAA3/css/MMM-NOAA3.css"];
        } else if (this.config.css == "NOAA2") {
            return ["modules/MMM-NOAA3/css/MMM-NOAA2.css"];
        } else if (this.config.css == "NOAA1") {
			return ["modules/MMM-NOAA3/css/MMM-NOAA1.css"];
		} else {
			return ["modules/MMM-NOAA3/css/MMM-NOAA4.css"];
		}
    },

    text: '',

    start: function() {
        Log.info("Starting module: " + this.name);
        this.text = this.translate("TEXT_PLACEHOLDER");
        this.sendSocketNotification('MMM-NOAA3', this.config);
        this.updateInterval = null;
        this.config.lang = this.config.lang || config.language; //automatically overrides and sets language :)
        this.config.units = this.config.units || config.units;
        var lang = this.config.langTrans[config.language];
        this.forecast = {};
        this.air = {};
        this.srss = {};
        this.amess = [];
        this.current = {};
        this.today = "";
        this.aqius = {};
		this.issue = {}; 
        this.activeItem = 0;
        this.rotateInterval = null; 
        this.loaded = true;
    },
	
	 

    socketNotificationReceived: function(notification, payload) {
		if (notification === "WEATHER_RESULT") {
            this.processWeather(payload);
        }
        if (notification === "SRSS_RESULT") {
            this.processSRSS(payload);
        }
        if (notification === "AIR_RESULT") {
            this.processAIR(payload);
        }
        if (notification === "ALERT_RESULT") {
            this.processALERT(payload);
        }
		if (notification === "MOON_RESULT") {
            this.processMOON(payload);
        }  
		 if (this.rotateInterval == null) {
                this.scheduleCarousel();
            }
        this.updateDom();
		console.log(this.config.updateInterval);
        this.config.updateInterval;
    },
	  processMOON: function(data) {
        this.moon = data; 	
    },
	
    processAIR: function(data) {
        this.air = data.air;
    },
    processSRSS: function(data) {
        this.srss = data;
		srss = this.srss; 
    },
	
	processWeather: function(data) {
        this.current = data;
		console.log(this.current);
		var weather = this.current.current;
			 icon = weather.icon;
			 sunset = this.srss.sunset;
	    this.sendNotification("WEATHER", {icon , sunset});
		 this.loaded = true; 
    },
	
	processALERT: function(data) {
        this.issue = data.alerts;
console.log(this.issue);		
    },
	
	scheduleCarousel: function() {
        this.rotateInterval = setInterval(() => {
            this.activeItem++;
            this.updateDom();
        }, this.config.rotateInterval);
    },
	
	
    getDom: function() {
		
		 if (!this.loaded) {
            wrapper.classList.add("container");
            wrapper.innerHTML = "Gathering your weather info..";
            wrapper.className = "bright small";
            return wrapper;
        }
		
		
        var wrapper = document.createElement("div");
        var current = this.current.current;
//console.log(current);
        var d = new Date();
        var n = d.getHours();
 
        if (typeof current !== 'undefined') {
            var weather = current.weather;
            var weather_f = current.weather_f;
			var weather_c = current.weather_f;
            var icon = current.icon;
            var temp_f = current.temp_f;
            var temp_c = current.temp_c;
            var fctext = current.weather_f;
            var fctext_m = current.weather_f;
            var humid = current.humidity;
            var baro_in = current.pressure_in;
            var baro_mb = current.pressure_mb;
            var visibility = Math.round(current.visibility_mi);
            var UV = current.UV;
            var wind_mph = Math.round(current.wind_mph);
            var wind_kph = Math.round(current.wind_kph);
        }
 //console.log('this is from NOAA3 '+weather);
        var cweat = document.createElement("div");
        cweat.classList.add("small", "bright", "floatl");
        if (this.config.provider === 'openweather' && this.config.lang != 'en') {
            cweat.innerHTML = weather_f + "<br>";
        } else {
            cweat.innerHTML = weather + "<br>";
        }
        wrapper.appendChild(cweat);

        var curCon = document.createElement("div");
        curCon.classList.add("img");
        curCon.innerHTML = (n < 18 && n > 6) ? "<img src='modules/MMM-NOAA3/images/" + icon + ".png'>" : "<img src='modules/MMM-NOAA3/images/nt_" + icon + ".png'>";
        wrapper.appendChild(curCon);
		
		
		function myFunction(id) {
    var x = document.getElementById(id);
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else { 
        x.className = x.className.replace(" w3-show", "");
    }
     }

        var cur = document.createElement("div");
        cur.classList.add("tempf", "tooltip");
        var temper = config.units != "metric" ? cur.innerHTML = Math.round(temp_f) + "&deg;<span class='tooltiptext'>" + this.translate('Forecast') + ": " + fctext + "</span> " : Math.round(temp_c) + "&deg;<span class='tooltiptext'>" + this.translate('Forecast') + ": " + fctext + "</span> ";
        cur.innerHTML = `<div class="divTable">
          <div class="divTableBody">
        <div class="divTableRow">
            <div class="divTableHead"> </div> 
        </div>
		<div class="divTableRow"> 
                <div class="divTableCell2">${temper}</div>
            </div></div></div> `
        wrapper.appendChild(cur);

        var top = document.createElement('div');
		top.classList.add('topshow');
		var Baro = config.units != "metric" ? baro_in + " inHg": baro_mb;
		var Miles = config.units != "metric" ? visibility + " Mi": (Math.round(visibility*1.60934)) + " Km";
		top.innerHTML=	
		`<div class="divTable">
          <div class="divTableBody">
        <div class="divTableRow">
            <div class="divTableHead">${this.translate("Humidity")}</div>
            <div class="divTableHead">${this.translate("Pressure")}</div>
            <div class="divTableHead">${this.translate("Visibility")}</div>
        </div>
		
		<div class="divTableRow">
                <div class="divTableCell">${humid}</div>
                <div class="divTableCell">${Baro}</div>
                <div class="divTableCell">${Miles}</div>
            </div></div></div>`;
         top.addEventListener("click", () => hideit(thisTop));			
		 wrapper.appendChild(top);
        
		function hideit(thisTop) {
				top.style.display="none";
			};
		
		srss = this.srss;
        var sunrise = srss.sunrise;
        var sunset = srss.sunset;
		var daylength = moment.utc(srss.day_length * 1000).format('HH:mm:ss');;
        var utcsunrise = moment.utc(sunrise).toDate();
        var utcsunset = moment.utc(sunset).toDate();
        var sunrise = config.timeFormat == 12 ? moment(utcsunrise).local().format("h:mm") : moment(utcsunrise).local().format("HH:mm");
        var sunset = config.timeFormat == 12 ? moment(utcsunset).local().format("h:mm") : moment(utcsunset).local().format("HH:mm");
		 
		var nextDiv = document.createElement('div');
		nextDiv.innerHTML=	
		`<div class="divTable">
   <div class="divTableBody">
   
      <div class="divTableRow">
         <div class="divTableHead">${this.translate("Rise")}</div>
         <div class="divTableHead">${this.translate("Hours of Light")}</div>
         <div class="divTableHead">${this.translate("Set")}</div>
      </div>
	 
      <div class="divTableRow">
         <div class="divTableCell">${sunrise}</div>
         <div class="divTableCell">${daylength}</div>
         <div class="divTableCell">${sunset}</div>
      </div>
   </div>
</div>`; 
		 wrapper.appendChild(nextDiv);
		 
		var time = new Date();
        var g = time.getHours();
        var m = time.getMinutes();
        var fun = g + ":" + m;
        var done = moment(fun, ["h:mm A"]).format("HH:mm");
        var str1 = moment(sunrise, ["h:mm A"]).format("HH:mm");
        var str2 = moment(sunset, ["h:mm A"]).format("HH:mm");
		
		var ev1= moment().format("HH");
		var ev2  = moment(srss.sunrise).format("HH");
		var ev3 =  moment(srss.sunset).format("HH"); 
	// console.log("Now :"+ev1 + " Rise: "+ ev2+" Set:  "+ev3);	
		var lastDiv = document.createElement('div');
        var level = this.air.aqius;
      /*this.air.aqius  > 0 && this.air.aqius <= 50 ? this.air.aqius + "<span class='CellComment'>" + this.translate('Excellent') + "</span>": 
      this.air.aqius > 50 && this.air.aqius <= 100 ? this.air.aqius + "<span class='CellComment'>" + this.translate('Good') + "</span>" :
	  this.air.aqius > 100 && this.air.aqius <= 150 ? this.air.aqius + "<span class='CellComment'>" + this.translate('Lightly Polluted') + "</span>":
	  this.air.aqius > 151 && this.air.aqius <= 200 ? this.air.aqius + "<span class='CellComment'>" + this.translate('Moderately Polluted') + "</span>":
	  this.air.aqius > 201 && this.air.aqius <= 300 ? this.air.aqius + "<span class='CellComment'>" + this.translate('Heavily Polluted') + "</span>":
	  this.air.aqius + "<span class='CellComment'>Severely Polluted</span></div>";	*/	
		lastDiv.innerHTML=
		`<div class="divTable">
   <div class="divTableBody">
  
      <div class="divTableRow">
         <div class="divTableHead">AQI</div>
         <div class="divTableHead">${(ev1 >= ev2 && ev1 <= ev3) ? "UV": this.translate("Night")}</div>
         <div class="divTableHead">${this.translate("Wind")}</div>
      </div>
	   
      <div class="divTableRow">
       <div class="divTableCell">${level}</div>
         <div class="divTableCell">${(ev1 >= ev2 && ev1 <= ev3) ? UV : '<img src ='+this.config.moon[this.moon]+' height="27px" width="27px">'}</div>
         <div class="divTableCell">${(this.config.lang != 'en') ? wind_kph : wind_mph}</div>
      </div>
   </div>
</div>`; 
		 wrapper.appendChild(lastDiv);
		 
	//uv moon above//////////////////////////////////////////////////
	
		var forecast = this.current.forecast
        if (forecast != null) {

            var ForecastTable = document.createElement("table");
            ForecastTable.classList.add("table")
            ForecastTable.setAttribute('style', 'line-height: 20%;');

            var FCRow = document.createElement("tr");
            var jumpy = document.createElement("th");
            jumpy.setAttribute("colspan", 4);
            jumpy.classList.add("rheading");
            jumpy.innerHTML = this.translate("4 Day Forecast");
            FCRow.appendChild(jumpy);
            ForecastTable.appendChild(FCRow);

            var d = new Date();
            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var n = this.translate(weekday[d.getDay()]);


            var nextRow = document.createElement("tr");
            for (i = 0; i < forecast.length; i++) {
                var noaa = forecast[i];
                var wdshort = document.createElement("td");
                if (this.config.provider != "weatherunlocked") {
                    wdshort.classList.add("xsmall", "bright");
                    //wdshort.setAttribute("style", "padding:11px");
                } else {
                    wdshort.classList.add("dates", "bright");
                    wdshort.setAttribute("style", "padding:11px");
                }
                wdshort.innerHTML = (this.translate(noaa.date.weekday_short) == n) ? this.translate("Today") : this.translate(noaa.date.weekday_short);
                nextRow.appendChild(wdshort);
                ForecastTable.appendChild(nextRow);
            }

            var foreRow = document.createElement("tr");
            for (i = 0; i < this.current.forecast.length; i++) {
                var noaa = this.current.forecast[i];
                var fore = document.createElement("td");
                fore.setAttribute("colspan", "1"); 
				//fore.setAttribute('style','float: center');
                fore.classList.add("CellWithComment");
				if (noaa.date.weekday_short == n){
				fore.innerHTML = "<img src='modules/MMM-NOAA3/images/" + noaa.icon + ".png' height='22' width='28'>";	
				} else {
                fore.innerHTML = "<img src='modules/MMM-NOAA3/images/" + noaa.icon + ".png' height='22' width='28'><span class='CellComment'>" + noaa.desc + "</span>";
				}
                foreRow.appendChild(fore);
                ForecastTable.appendChild(foreRow);
            }

            var tempRow = document.createElement("tr");
            for (i = 0; i < this.current.forecast.length; i++) {
                var noaa = this.current.forecast[i];
                var temper = document.createElement("td");
                temper.setAttribute("colspan", "1");
                temper.classList.add("xsmall","bright");
                temper.innerHTML = (config.units != "metric") ? Math.round(noaa.high.fahrenheit) + "/" + Math.round(noaa.low.fahrenheit) : Math.round(noaa.high.celsius) + "/" + Math.round(noaa.low.celsius);
                tempRow.appendChild(temper);
                ForecastTable.appendChild(tempRow);
            }

            wrapper.appendChild(ForecastTable);
        }
		
//////////ALERT FOR DarkSKY ONLY////////////////////
					var issue = this.issue;
		if (typeof issue != 'undefined' || null){
			var keys = Object.keys(this.issue);
			if (keys.length > 0) {
				if (this.activeItem >= keys.length) {
					this.activeItem = 0;
				}
				var issue = this.issue[keys[this.activeItem]];

				var warning = document.createElement("div");
				warning.classList.add('advise');
				warning.innerHTML = "Weather Advisory<BR> Type: "+issue.severity;
				wrapper.appendChild(warning);

				var emer = document.createElement("div");
				emer.classList.add('warning', 'bright');
				var str2 = issue.description.replace(/(([^\s]+\s\s*){30})(.*)/,"$1…");
				emer.innerHTML = issue.title + "<span class='tooltiptext'>" + str2+ "</span> ";
				wrapper.appendChild(emer);

				var area = document.createElement("div");
				area.classList.add('areas');
				area.innerHTML = "Areas effected :<BR>";
				wrapper.appendChild(area);

				var counties = issue.regions;
				var list = document.createElement("div");
				list.classList.add('list');
				for (var i = 0; i < counties.length; i++) {
					list.innerHTML += counties[i] + ",  ";
				}
				wrapper.appendChild(list);
			}
		}
/////////////ALERT END///////////////////////////////////
		
		
		if (this.config.nupdate != false){
        if (config.timeFormat == 12) {
            var doutput = moment().format("M.D.YYYY");
            var tinput = document.lastModified;
            var toutput = (moment(tinput.substring(10, 16), 'HH:mm').add(30, 'minutes').format('h:mm a'));
        } else {
            var doutput = moment().format("DD.MM.YYYY");
            var tinput = document.lastModified;
            var toutput = (moment(tinput.substring(10, 16), 'HH:mm').format('HH:mm'));
        }
		var x = this.config.updateInterval;
		var y = moment.utc(x).format('mm');
        var mod = document.createElement("div");
        mod.classList.add("xxsmall");
		mod.setAttribute('style','text-align: center;');
        mod.innerHTML = "<font color=yellow>[</font>Updated: " +  doutput + " @ "+  toutput+"<font color=yellow>]</font>";
        wrapper.appendChild(mod);
		}
        return wrapper;
    },
});