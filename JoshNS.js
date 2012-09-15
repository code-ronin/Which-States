(function(Josh, $){
	"use strict";
	var states = {};
	var checkins = [];
	var years = {};
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
			$this.trigger('checkin', [place, checkins.length]);
		},
		
		sortedStates: function(states){
			var stateArray = [];
			
			for(var i in states){
				if(states[i].name !== undefined){
					stateArray.push(states[i]);
				}
			}
			
			stateArray.sort(function(a, b){return b.checkins - a.checkins});
			return stateArray;
		},
		
		getAll: function(){
			return this.sortedStates(states);
		},
		
		getAllYears: function(){
			var yarray = [];
			for(var y in years){
				yarray.push(y);
			}
			
			return yarray;
		},

		getYear: function(year){
			if(years[year] !== undefined){
				return this.sortedStates(years[year]);
			}
		},
		
		getCheckins: function(year){
			if(!year){
				return checkins.length;
			}else{
				var yearReturn = [];
				for(var i=0;i<checkins.length;i++){
					if(checkins[i].year === year){
						yearReturn.push(checkins[i]);
					}
				}
				
				return yearReturn.length;
			}
			//return checkins.length;
			//return checkins;
		}
	};
	
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	var This;
	var $infoUL;
	var $years;
	var $alert;
	
	Josh.AC = function(){
		//public properties
		this.USModel = new Josh.US();
		this.fb = new Josh.FB(this.USModel);
		this.fs = new Josh.FS(this.USModel);
		this.svg = new Josh.SVG();
		
		//private
		This = this;
		$infoUL = $('#info');
		$years = $('#years');
		$alert = $('#alert');
		
		
		//events to listen for
		$(this.fb).on('checkinDone', function(){
			This.checkinDone();
		});
		
		$(this.fb).on('checkinStart', function(){
			This.addAlert('Getting states from Facebook...');
		});
		
		$(this.fs).on('checkinDone', function(){
			This.checkinDone();
		});
		
		$(this.fs).on('checkinStart', function(){
			This.addAlert('Getting states from Foursquare...');
		});
		
		$(this.USModel).on('checkin', function(e, d, count){
			$infoUL.append('<li>' + d.name + ' ' + d.state + ' on ' + d.date + '</li>');
			if(count % 4 === 0){
				This.addAlert('Processing ' + d.state);
			}
		});
		
		$('#years').on('click', 'li', function(e){
			if(e.target.innerHTML === 'All'){
				var year = This.USModel.getAll();	
			}else{
				var year = This.USModel.getYear(e.target.innerHTML);
			}
			This.svg.clearAll();
			for(var y=0;y<year.length;y++){
				This.svg.addState(year[y].name, year[y].checkins);
			}
		});
	};
	
	Josh.AC.prototype = {
		addAlert: function(alert){
			$alert.html(alert).removeClass('none');
		},
		
		removeAlert: function(){
			$alert.addClass('none');	
		},
		
		checkinDone: function(){
			var all = this.USModel.getAll();
			for(var i=0;i<all.length;i++){
				this.svg.addState(all[i].name, all[i].checkins);
			}
			
			var years = this.USModel.getAllYears();
			
			var li = "<li>All</li>";
			for(var y=0;y<years.length;y++){
				li += "<li>" + years[y] + "</li>";
			}
			$years.html(li);
			
			this.removeAlert();
		}
	}
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	var $svg;
	var This = this;
	
	Josh.SVG = function(){
		$svg = $('svg');
		
		$svg.on('click', '.white-state', function(e){
			console.log($(e.target).attr('checkins'));
		});
	};
	
	Josh.SVG.prototype = {
		addState: function(state, checkins){
			$svg.children('#' + state).attr('class', 'white-state');
			$svg.children('#' + state).attr('checkins', checkins);
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
	var This;
	var checked = false;
	
	Josh.FB = function(US){
		//dependency injection
		usModel = US;
		$this = $(this);
		This = this;
		
		//init Facebook SDK
		FB.init({
			appId  : '206649819466252',
			status : true, // check login status
			cookie : true, // enable cookies to allow the server to access the session
			oauth  : true, // enable OAuth 2.0
			xfbml   : true
		});
		
		$('#fb_connect').on('click', function(){
			if(!checked){
				This.getCheckins();
			};
		});
	};
	
	Josh.FB.prototype = {
		//this needs to be refactored
		//if you are not already in it won't work 
		//until you hit the button again
		getCheckins: function(){
			$this.trigger('checkinStart');
			FB.getLoginStatus(function(response){
			    if(response.status === 'connected'){
			    	FB.api('me/checkins?limit=750', function(c){
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
						checked = true;
						$this.trigger('checkinDone');
					});
			    }else{
			    	FB.login(function(response){
			    	}, {scope: 'email,user_checkins,user_status'});
			    }
			});
		}
	};
})(window.Josh = window.Josh || {}, window.jQuery);

(function(Josh){
	var oauth;
	var $this;
	var This;
	var usModel;
	var checked = false;
	
	Josh.FS = function(US){
		usModel = US;
		
		$this = $(this);
		This = this;
		
		this.wireEvents();
	};
	
	Josh.FS.prototype = {
		wireEvents: function(){
			//foursquare image
			$('#fs_connect').on('click', function(){
				if(!checked){
					$this.trigger('checkinStart');
					window.open('https://foursquare.com/oauth2/authenticate?client_id=TZGGYQQPLXGWT2DZA5UQU3XRDZPZVSRAMOB5E3P0IN31YRV0&response_type=token&redirect_uri=http://ejosh.co/demos/usmap/fstoken.html', "", "width=500,height=500");
				};
			});
			
			//return from Oauth call
			$(window).on('login', function(e, d){
				oauth = d;
				This.getFourSquare(0, 1);
			});
		},
		
		getFourSquare: function(offset, count){
			if(oauth === undefined){
				//error
				return;
			}
			offset = (offset === undefined) ? 0 : offset;
			count = (count === undefined) ? 1 : count;
		
			$.getJSON('https://api.foursquare.com/v2/users/self/checkins?v=20120806&limit=250&offset=' + offset + '&oauth_token=' + oauth, function(data){
				var checks = data.response.checkins.items;
				count = data.response.checkins.count;
				for(var i in checks){
					if(checks[i].venue !== undefined){
						var date = new Date(checks[i].createdAt * 1000);
						usModel.addCheckin(new Josh.Place( 
							checks[i].venue.location.lat,
							checks[i].venue.location.lng,
							checks[i].venue.location.state,
							checks[i].venue.name,
							date,
							date.getFullYear(),
							'fs'
						));
					}
				}
				
				if(count > offset + 250){
					This.getFourSquare(offset + 250, count);
				}else{
					checked = true;
					$this.trigger('checkinDone');
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
