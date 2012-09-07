(function(Josh, $){
	"use strict";
	var states = {};
	var checkins = [];
	var years = {};
	var fb = false;
	var fs = false;
	var $this;
	
	Josh.US = function(){
		$this = $(this);
	};
	
	Josh.US.prototype = {
		addCheckin: function(place){
			checkins.push(place);
			years[place.year] = (years[place.year] !== undefined) ? years[place.year] : {};
			
			if(states[place.state] === undefined){
					states[place.state] = new Josh.State(place.state);
					years[place.year][place.state] = new Josh.State(place.state);
				}else{
					states[place.state].checkins++;
					if(years[place.year][place.state] === undefined){
						years[place.year][place.state] = new Josh.State(place.state);
					}else{
						years[place.year][place.state].checkins++;
					}
				}
			$this.trigger('checkin', place);
		},
		
		sortedStates: function(states){
			var stateArray = [];
			
			for(var i in states){
				if(states[i].name !== undefined){
					stateArray.push(states[i]);
					stateArray.sort(function(a, b){return b.checkins - a.checkins});
				}
			}
			return stateArray;
		},
		
		getAll: function(){
			return this.sortedStates(states);
		},

		getYear: function(year){
			if(years[year] !== undefined){
				return this.sortedStates(years[year]);
			}
		}
	};
	
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	Josh.State = function(name){
		this.name = name;
		this.checkins = 1;
	};
})(window.Josh = window.Josh || {});
