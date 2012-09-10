(function(Josh, $){
	"use strict";
	var states = {};
	var checkins = [];
	var years = {};
	//var fb = false;
	var fs = false;
	var $this;
	
	Josh.US = function(){
		$this = $(this);
		this.fb = false;
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
		},
		
		setFB: function(){
			this.fb = true;
		}
	};
	
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	//var USModel;
	//var fb;
	var This;
	
	Josh.AC = function(){
		this.USModel = new Josh.US();
		this.fb = new Josh.FB(this.USModel);
		this.svg = new Josh.SVG();
		
		This = this;
		
		$(this.fb).on('checkinDone', function(){
			//scope of the FB object
			var all = This.USModel.getAll();
			for(var i=0;i<all.length;i++){
				This.svg.addState(all[i].name);
			}
		});
		
		this.fb.getCheckins();
	};
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	var $svg;
	
	Josh.SVG = function(){
		$svg = $('svg');
	};
	
	Josh.SVG.prototype = {
		addState: function(state){
			$('#' + state).attr('class', 'white-state');
		},
		
		clearAll: function(){
			$('svg path, svg g').removeAttr('class');
		}
	};
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	Josh.State = function(name){
		this.name = name;
		this.checkins = 1;
	};
})(window.Josh = window.Josh || {});

(function(Josh){
	var usModel;
	var $this;
	
	Josh.FB = function(US){
		//dependency injection
		usModel = US;
		$this = $(this);
		
		//init Facebook SDK
		FB.init({
			appId  : '389943044385763',
			status : true, // check login status
			cookie : true, // enable cookies to allow the server to access the session
			oauth  : true, // enable OAuth 2.0
			xfbml   : true
		});
	};
	
	Josh.FB.prototype = {
		getCheckins: function(){
			FB.getLoginStatus(function(response){
			    if(response.status === 'connected'){
			    	FB.api('me/checkins?limit=750', function(c){
			    		usModel.setFB();
						for(var i in c.data){
							var date = new Date(c.data[i].created_time);
							usModel.addCheckin(new Josh.Place( 
								c.data[i].place.location.latitude,
								c.data[i].place.location.longitude,
								c.data[i].place.location.state,
								c.data[i].place.name,
								date,
								date.getFullYear(),
								'fb'
							));
						}
						$this.trigger('checkinDone');
					});
			    }else{
			    	FB.login(function(response){
						console.log(response);
			    	}, {scope: 'email,user_checkins,user_status'});
			    }
			});
		}
	};
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	var abbr = {
		ALASKA: 		'AK',
		ALABAMA: 		'AL',
		ARKANSAS: 		'AR',
		ARIZONA: 		'AZ',
		CALIFORNIA: 	'CA',
		COLORADO:		'CO',
		CONNECTICUT:	'CT',
		DELAWARE:		'DE',
		FLORIDA:		'FL',
		GEORGIA:		'GA',
		HAWAII:			'HI',
		IOWA:			'IA',
		IDAHO:			'ID',
		ILLINOIS:		'IL',
		INDIANA: 		'IN',
		KANSAS:			'KS',
		KENTUCKY:		'KY',
		LOUISIANA:		'LA',
		MASSACHUSETTS:	'MA',
		MARYLAND:		'MD',
		MAINE:			'ME',
		MINNESOTA:		'MN',
		MISSOURI: 		'MO',
		MISSISSIPPI:	'MS',
		MONTANA:		'MT',
		'NORTH CAROLINA':'NC',
		'NORTH DAKOTA':	'ND',
		NEBRASKA:		'NE',
		'NEW HAMPSHIRE':'NH',
		'NEW JERSEY':	'NJ',
		'NEW MEXICO':	'NM',
		NEVADA:			'NV',
		'NEW YORK':		'NY',
		OHIO:			'OH',
		OKLAHOMA: 		'OK',
		OREGON:			'OR',
		PENNSYLVANIA:	'PA',
		'RHODE ISLAND':	'RI',
		'SOUTH CAROLINA':'SC',
		'SOUTH DAKOTA':	'SD',
		TENNESSEE:		'TN',
		TEXAS: 			'TX',
		UTAH:			'UT',
		VIRGINIA:		'VA',
		VERMONT:		'VT',
		WASHINGTON:		'WA',
		WISCONSIN:		'WI',
		'WEST VIRGINIA':'WV',
		WYOMING:		'WY'
	};
	
	Josh.Place = function(lat, lng, state, name, date, year, type){
		this.lat = lat;
		this.lng = lng;
		//need to check for abbreviation
		if(state !== undefined){
			if(state.length > 2){
				this.state = abbr[state.toUpperCase()];
			}else{
				this.state = state.toUpperCase();
			}
		}
		this.name = name;
		this.date = date;
		this.year = year;
		this.type = type;
	};
})(window.Josh = window.Josh || {});
