(function () {
	//Returns difference of two arrays
	Array.prototype.difference = function(a) {
	    return this.filter(function(i) {return a.indexOf(i) < 0;});
	};

	//Returns overlap of two arrays
	Array.prototype.intersection = function(a) {
		return this.filter(function(i) { return a.indexOf(i) != -1 });
	}

	Array.prototype.max = function() {
		return Math.max.apply(null, this);
	};

	Array.prototype.min = function() {
		return Math.min.apply(null, this);
	};	

	function Cat(id) {
		this.id = id;
		this.stationId = null;
		this.stepCount = 0;
	};

	Cat.prototype.setStationId = function(id) {
		this.stationId = id;
	};

	Cat.prototype.goToStation = function () {
		if (controller.stations[this.stationId].connections.length !== 0) {
			var connections = controller.stations[this.stationId].connections;
			var openConnections = connections.difference(controller.closedStations);

			if (openConnections.length !== 0) {
				var stationId = connections[Math.floor(Math.random()*connections.length)];

				controller.stations[this.stationId].removeCat(this.id);
				controller.stations[stationId].addCat(this.id);
				this.setStationId(stationId);

				this.stepCount += 1;
			}	
		}
	};


	function Human(id) {
		this.id = id;
		this.stationId = null;
		this.visitedStationIds = [];
		this.stepCount = 0;
	};

	Human.prototype.setStationId = function(id) {
		this.stationId = id;
		this.visitedStationIds.push(id);
	};

	Human.prototype.goToStation = function () {
		if (controller.stations[this.stationId].connections.length !== 0) {
			var connections = controller.stations[this.stationId].connections;
			var openConnections = connections.difference(controller.closedStations);

			if (openConnections.length !== 0) {
				var unvisitedConnections = openConnections.difference(this.visitedStationIds);

				//Human has gone in to a dead end
				if (unvisitedConnections.length === 0) {
					this.visitedStationIds = [];
					unvisitedConnections = openConnections.difference(this.visitedStationIds)		
				}

				var stationId = unvisitedConnections[Math.floor(Math.random()*unvisitedConnections.length)];

				controller.stations[this.stationId].removeHuman(this.id);
				controller.stations[stationId].addHuman(this.id);
				this.setStationId(stationId);

				this.stepCount += 1;
			}
		}
	};


	function Station(id) {
		this.id = id;
		this.name = '';
		this.connections = [];
		this.occupants = {
			humans: [],
			cats: []
		};
		this.status = 'open';

		this.setName();
		this.setConnections();
	};

	Station.prototype.setName = function () {
		for (var i = 0; i < stationsJs.length; i+=1) {
			if (parseInt(stationsJs[i][0]) === this.id) {
				this.name = stationsJs[i][1];
			}
		}
	};

	Station.prototype.setConnections = function () {
		for (var i = 0; i < connectionsJs.length; i+=1) {
			if (parseInt(connectionsJs[i][0]) === this.id) {
				this.connections.push(parseInt(connectionsJs[i][1]));
			}

			else if (parseInt(connectionsJs[i][1]) === this.id) {
				this.connections.push(parseInt(connectionsJs[i][0]));
			}
		}
	};

	Station.prototype.addHuman = function(humanId) {
		this.occupants.humans.push(humanId);
	}

	Station.prototype.removeHuman = function(humanId) {
		for (var i = 0; i < this.occupants.humans.length; i++) {
			if (this.occupants.humans[i] === humanId) {
				this.occupants.humans.splice(i, 1);
				return;
			}
		}
	}

	Station.prototype.addCat = function (catId) {
		this.occupants.cats.push(catId);
	}

	Station.prototype.removeCat = function(catId) {
		for (var i = 0; i < this.occupants.cats.length; i++) {
			if (this.occupants.cats[i] === catId) {
				this.occupants.cats.splice(i, 1);
				return;
			}
		}
	}

	Station.prototype.checkMatch = function () {
		var matches = this.occupants.cats.intersection(this.occupants.humans);

		if (matches.length !== 0) {
			for (var i = 0; i < matches.length; i+=1) {
				this.removeHuman(matches[i]);
				this.removeCat(matches[i]);

				controller.stepsFound.push(controller.humans[matches[i]].stepCount);

				delete controller.humans[matches[i]];
				delete controller.cats[matches[i]];

				console.log('Owner', matches[i], 'found cat', matches[i], '-', this.name, 'is now closed.')
			}

			this.status = 'closed';
			controller.closedStations.push(this.id);
		}
	}


	function Controller(participants) {
		this.participants = participants;

		this.stations = {};
		this.closedStations = [];

		this.humans = {};
		this.cats = {};	

		this.stepsFound = [];

		for (var i = 1; i <= stationsJs.length + 1; i+=1) {
			var station = new Station(i);
			this.stations[i] = station;
		}

		for (var i = 1; i <= this.participants; i+=1) {
			var human = new Human(i);
			this.humans[i] = human;
		}

		for (var i = 1; i <= this.participants; i+=1) {
			var cat = new Cat(i);
			this.cats[i] = cat;
		}

		for (var i = 1; i <= this.participants; i+=1) {
			var random = Math.floor(Math.random() * (stationsJs.length - 1 + 1)) + 1;
			var random2 = Math.floor(Math.random() * (stationsJs.length - 1 + 1)) + 1;

			this.stations[random].addCat(this.cats[i].id);
			this.cats[i].setStationId(random);

			this.stations[random2].addHuman(this.humans[i].id);
			this.humans[i].setStationId(random2);	
		}	
	}

	Controller.prototype.loop = function () {
		var count = 0;

		while (count < 100000 && Object.keys(this.cats).length !== 0) {
			for (var i in this.stations) {
				this.stations[i].checkMatch();
			}	

			for (var i in this.cats) {
				this.cats[i].goToStation();
			}	

			for (var i in this.humans) {
				this.humans[i].goToStation();
			}	

			count += 1;
		}	

		console.log('\nTotal number of cats:', this.participants);
		console.log('Number of cats found:', this.participants - Object.keys(this.cats).length);
		
		var averageStepsFound = this.stepsFound.reduce(function(previousValue, currentValue, currentIndex, array) {
			return previousValue + currentValue;
		});	
		averageStepsFound = Math.round(averageStepsFound/this.stepsFound.length);

		console.log('\nAverage number of movements required to find a cat:', averageStepsFound);
		console.log('Minimum number of movements required to find a cat:', this.stepsFound.min());
		console.log('Maximum number of movements required to find a cat:', this.stepsFound.max());
	}

	//Init
	var stationsJs = require('./tfl_stations.json');
	var connectionsJs = require('./tfl_connections.json');	

	if (process.argv.length < 3) {
		console.log('Please specify the number of missing cats.');
	}

	else {
		if (isNaN(parseInt(process.argv[2]))) {
			console.log('Please enter an integer for the number of missing cats.');			
		}

		else {
			var controller = new Controller(parseInt(process.argv[2]));
			controller.loop();
		}
	}
})();
