"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

var mov = { "33": [-1, 1],
	"34": [1, 1],
	"35": [1, -1],
	"36": [-1, -1],
	"37": [0, -1],
	"38": [-1, 0],
	"39": [0, 1],
	"40": [1, 0],
	"97": [1, -1],
	"98": [1, 0],
	"99": [1, 1],
	"100": [0, -1],
	"102": [0, 1],
	"103": [-1, -1],
	"104": [-1, 0],
	"105": [-1, 1]
};

// Room has [exit to east, exit to south]
var exits = [[true, true], [true, true], [true, false], [true, true], [true, true], [true, false], [false, true], [false, true], [false, false]];

var Tiles = {
	// features
	"ladder_up": "-256px -192px",
	"ladder_down": "-288px -192px",
	"wall": "-480px -64px",
	"orb": "-288px -32px",
	"floor": "-128px -64px",
	"sword": "-160px -256px",
	"shield": "-192px -256px",
	"potion": "-96px -256px",
	"chest": "-32px -256px",
	"scroll": "-128px -256px",
	"club": "-416px -256px",
	// actors
	"hero": "-320px -320px",
	"orc": "-96px -448px",
	"skeleton": "-192px -448px",
	"snake": "-320px -448px",
	"bat": "-640px -384px",
	"spider": "-800px -384px"
};

var xpTable = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

var startingStats = [{
	type: "hero",
	maxhp: 20,
	hp: 20,
	str: 5,
	dex: 5,
	armor: 0,
	xp: 0,
	xpLevel: 1,
	dungeonLevel: 1,
	weapon: "hands"
}, {
	type: "skeleton",
	hd: 1,
	str: 2,
	dex: 4,
	armor: 1,
	xp: 5
}, {
	type: "orc",
	hd: 1,
	str: 4,
	dex: 2,
	armor: 2,
	xp: 10
}, {
	type: "snake",
	hd: 2,
	str: 2,
	dex: 6,
	armor: 0,
	xp: 15
}, {
	type: "bat",
	hd: 1,
	str: 1,
	dex: 8,
	armor: 0,
	xp: 5
}, {
	type: "spider",
	hd: 2,
	str: 3,
	dex: 5,
	armor: 0,
	xp: 15
}];

var DungeonWidth = 30;
var DungeonHeight = 30;
var DungeonDepth = 5;
var MonsterDensity = 10;
var SightRadius = 8;
var MessageQueueSize = 6;

var _Redux = Redux;
var combineReducers = _Redux.combineReducers;
var createStore = _Redux.createStore;


var gameRedux = combineReducers({
	controller: controller,
	message: message,
	dungeon: dungeon,
	actors: actors
});

var store = createStore(gameRedux);

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDungeon(level, hero) {

	var dungeon = [];
	var actors = [];
	var rooms = [];

	function free_room_tile(i) {
		if (rooms[i].freeTiles.length == 0) return "full";else {
			var pos = randomInt(0, rooms[i].freeTiles.length - 1);
			return rooms[i].freeTiles.splice(pos, 1)[0];
		}
	}
	for (var i = 0; i < DungeonHeight; i++) {
		var tempArray = [];
		for (var j = 0; j < DungeonWidth; j++) {
			tempArray.push("wall");
		}dungeon.push(tempArray);
	}
	for (var _i = 0; _i < 9; _i++) {
		var areaWidth = DungeonHeight / 3;
		var areaHeight = DungeonWidth / 3;

		var newRoom = { width: randomInt(1, areaWidth - 2),
			height: randomInt(1, areaHeight - 2) };

		newRoom.topLeftX = Math.floor(_i / 3) * areaWidth + randomInt(1, areaWidth - newRoom.width - 1);
		newRoom.topLeftY = _i % 3 * areaHeight + randomInt(1, areaHeight - newRoom.height - 1);

		newRoom.freeTiles = [];
		rooms.push(newRoom);
	}
	for (var _i2 = 0; _i2 < 9; _i2++) {
		if (exits[_i2][0]) {
			var bendX = rooms[_i2 + 3].topLeftX - randomInt(1, rooms[_i2 + 3].topLeftX - (rooms[_i2].topLeftX + rooms[_i2].width + 1));
			var exitWestX = rooms[_i2].topLeftX + rooms[_i2].width;
			var exitEastX = rooms[_i2 + 3].topLeftX;
			var exitWestY = randomInt(rooms[_i2].topLeftY, rooms[_i2].height + rooms[_i2].topLeftY - 1);
			var exitEastY = randomInt(rooms[_i2 + 3].topLeftY, rooms[_i2 + 3].height + rooms[_i2 + 3].topLeftY - 1);

			for (var _i3 = exitWestX; _i3 < bendX; _i3++) {
				dungeon[exitWestY][_i3] = "floor";
			}for (var _i4 = bendX; _i4 < exitEastX; _i4++) {
				dungeon[exitEastY][_i4] = "floor";
			}var upDown = exitWestY < exitEastY ? 1 : -1;

			for (var _i5 = exitWestY; _i5 != exitEastY; _i5 += upDown) {
				dungeon[_i5][bendX] = "floor";
			}
		}

		if (exits[_i2][1]) {
			var bendY = rooms[_i2 + 1].topLeftY - randomInt(1, rooms[_i2 + 1].topLeftY - (rooms[_i2].topLeftY + rooms[_i2].height + 1));
			var exitNorthY = rooms[_i2].topLeftY + rooms[_i2].height;
			var exitSouthY = rooms[_i2 + 1].topLeftY;
			var exitNorthX = randomInt(rooms[_i2].topLeftX, rooms[_i2].width + rooms[_i2].topLeftX - 1);
			var exitSouthX = randomInt(rooms[_i2 + 1].topLeftX, rooms[_i2 + 1].width + rooms[_i2 + 1].topLeftX - 1);

			for (var _i6 = exitNorthY; _i6 < bendY; _i6++) {
				dungeon[_i6][exitNorthX] = "floor";
			}for (var _i7 = bendY; _i7 < exitSouthY; _i7++) {
				dungeon[_i7][exitSouthX] = "floor";
			}var _upDown = exitNorthX < exitSouthX ? 1 : -1;

			for (var _i8 = exitNorthX; _i8 != exitSouthX; _i8 += _upDown) {
				dungeon[bendY][_i8] = "floor";
			}
		}

		for (var _y = 0; _y < rooms[_i2].height; _y++) {
			for (var _x = 0; _x < rooms[_i2].width; _x++) {
				var tileY = _y + rooms[_i2].topLeftY;
				var tileX = _x + rooms[_i2].topLeftX;
				rooms[_i2].freeTiles.push({ y: tileY, x: tileX });
				dungeon[tileY][tileX] = "floor";
			}
		}
	}

	var ladder_down = randomInt(0, 8);
	for (var hero_start = randomInt(0, 8); hero_start == ladder_down; hero_start = randomInt(0, 8)) {}

	var _free_room_tile = free_room_tile(ladder_down);

	var y = _free_room_tile.y;
	var x = _free_room_tile.x;

	if (level == DungeonDepth) dungeon[y][x] = "orb";else dungeon[y][x] = "ladder_down";

	var start_spot = free_room_tile(hero_start);
	if (hero) actors.push(Object.assign({}, hero, start_spot));else actors.push(Object.assign({}, start_spot, startingStats[0]));

	function getFreeTile() {
		var tile;
		do {
			for (var tile_room = randomInt(0, 8); tile_room == hero_start; tile_room = randomInt(0, 8)) {}
			tile = free_room_tile(tile_room);
		} while (tile == "full");
		return tile;
	}

	for (var _i9 = 0; _i9 < MonsterDensity; _i9++) {
		var newMonster = Object.assign({}, getFreeTile(), startingStats[randomInt(1, startingStats.length - 1)]);
		var hp = 0;
		for (var _i10 = 0; _i10 < newMonster.hd; _i10++) {
			hp += randomInt(1, 8);
		}newMonster.hp = hp;

		actors.push(newMonster);
	}

	for (var _i11 = 0; _i11 < randomInt(0, 5); _i11++) {
		var tile = getFreeTile();
		dungeon[tile.y][tile.x] = "potion";
	}

	for (var _i12 = 0; _i12 < randomInt(0, 5); _i12++) {
		var _tile = getFreeTile();
		dungeon[_tile.y][_tile.x] = "scroll";
	}

	if (randomInt(0, 1)) {
		var _tile2 = getFreeTile();
		if (!hero || hero.weapon == "hands") dungeon[_tile2.y][_tile2.x] = "club";else dungeon[_tile2.y][_tile2.x] = "sword";
	}

	return [dungeon, actors];
}

function controller() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? "init" : arguments[0];
	var action = arguments[1];

	switch (action.type) {
		case "BEGIN_TURN":
			return "working";
		case "READY_FOR_INPUT":
			return "ready";
		case "GAME_OVER":
			return "game_over";
		default:
			return state;
	}
}

function message() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? [["Welcome to the game.", "new"]] : arguments[0];
	var action = arguments[1];

	var newQueue = [];
	switch (action.type) {
		case 'READY_FOR_INPUT':
			state.forEach(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2);

				var message = _ref2[0];
				var age = _ref2[1];

				if (age == "new") newQueue.push([message, "fresh"]);else newQueue.push([message, age]);
			});
			return newQueue;

		case 'MESSAGE':
			state.forEach(function (_ref3, i) {
				var _ref4 = _slicedToArray(_ref3, 2);

				var message = _ref4[0];
				var age = _ref4[1];

				if (i > 0 || state.length < MessageQueueSize) newQueue.push([message, age == "new" ? "new" : "old"]);
			});
			newQueue.push([action.text, "new"]);
			return newQueue;

		default:
			return state;
	}
}

function dungeon() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	var action = arguments[1];

	switch (action.type) {
		case 'CREATE_DUNGEON':
			return action.dungeon;

		case 'REMOVE_FEATURE':
			return state.slice(0, action.y).concat([state[action.y].slice(0, action.x).concat(["floor"]).concat(state[action.y].slice(action.x + 1))]).concat(state.slice(action.y + 1));

		default:
			return state;
	}
}

function actors() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	var action = arguments[1];

	switch (action.type) {
		case 'POPULATE_DUNGEON':
			return action.actors;
		// MOVE_ACTOR: index, newYX
		case 'MOVE_ACTOR':
			return state.slice(0, action.index).concat([Object.assign({}, state[action.index], { y: action.newYX.y, x: action.newYX.x })]).concat(state.slice(action.index + 1));
		// MUTATE_ACTOR: index, newValues
		case 'MUTATE_ACTOR':
			return state.slice(0, action.index).concat([Object.assign({}, state[action.index], action.newValues)]).concat(state.slice(action.index + 1));
		// CREATE_ACTOR: values
		case 'CREATE_ACTOR':
			return state.concat([action.values]);
		// REMOVE_ACTOR: indices
		case 'REMOVE_ACTORS':
			return state.filter(function (actor, i) {
				return action.indices.indexOf(i) == -1;
			});
		default:
			return state;
	}
}

var Tile = function (_React$Component) {
	_inherits(Tile, _React$Component);

	function Tile() {
		_classCallCheck(this, Tile);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(Tile).apply(this, arguments));
	}

	_createClass(Tile, [{
		key: "shouldComponentUpdate",
		value: function shouldComponentUpdate(nextProps) {
			return this.props.tile != nextProps.tile;
		}
	}, {
		key: "render",
		value: function render() {
			if (this.props.tile == "blank") return React.createElement("div", { className: "blank_tile" });else return React.createElement("div", {
				style: { "backgroundPosition": Tiles[this.props.tile] }, className: "tile" });
		}
	}]);

	return Tile;
}(React.Component);

var PlayerStats = function (_React$Component2) {
	_inherits(PlayerStats, _React$Component2);

	function PlayerStats() {
		_classCallCheck(this, PlayerStats);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(PlayerStats).apply(this, arguments));
	}

	_createClass(PlayerStats, [{
		key: "render",
		value: function render() {
			var hero = this.props.hero;
			return React.createElement(
				"div",
				{ id: "stats" },
				React.createElement(
					"p",
					null,
					"Dupre the Fighter"
				),
				React.createElement(
					"p",
					null,
					"Level ",
					hero.xpLevel,
					React.createElement("br", null),
					"EXP ",
					hero.xp,
					"/",
					xpTable[hero.xpLevel]
				),
				React.createElement(
					"p",
					null,
					"HP ",
					hero.hp,
					"/",
					hero.maxhp
				),
				React.createElement(
					"p",
					null,
					"Strength ",
					hero.str
				),
				React.createElement(
					"p",
					null,
					"Dexterity ",
					hero.dex
				),
				React.createElement(
					"p",
					null,
					"Weapon: ",
					hero.weapon
				)
			);
		}
	}]);

	return PlayerStats;
}(React.Component);

var MessageBox = function (_React$Component3) {
	_inherits(MessageBox, _React$Component3);

	function MessageBox() {
		_classCallCheck(this, MessageBox);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(MessageBox).apply(this, arguments));
	}

	_createClass(MessageBox, [{
		key: "render",
		value: function render() {
			return React.createElement(
				"div",
				{ className: "messageBox" },
				this.props.message.map(function (_ref5, i) {
					var _ref6 = _slicedToArray(_ref5, 2);

					var message = _ref6[0];
					var age = _ref6[1];
					return React.createElement(
						"span",
						{ className: age == "old" ? "stale" : "fresh", key: i },
						message,
						React.createElement("br", null)
					);
				})
			);
		}
	}]);

	return MessageBox;
}(React.Component);

var Container = function (_React$Component4) {
	_inherits(Container, _React$Component4);

	function Container() {
		_classCallCheck(this, Container);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(Container).apply(this, arguments));
	}

	_createClass(Container, [{
		key: "render",
		value: function render() {
			var _this5 = this;

			if (this.props.state.controller != "init") {
				var _actors = this.props.state.actors;
				var _dungeon = this.props.state.dungeon;
				var _message = this.props.state.message;

				var hero = _actors[0];
				var viewport = [];

				var _loop = function _loop(j) {
					var viewrow = [];

					var _loop2 = function _loop2(i) {
						var key = j * (2 * SightRadius + 1) + i;
						if (inLOS({ y: hero.y, x: hero.x }, { y: j, x: i }, _this5.props.state)) {
							var actor = _actors.find(function (actor) {
								return actor.y == j && actor.x == i;
							});
							if (actor) viewrow.push(React.createElement(Tile, { key: key, tile: actor.type }));else viewrow.push(React.createElement(Tile, { key: key, tile: _dungeon[j][i] }));
						} else viewrow.push(React.createElement(Tile, { key: key, tile: "blank" }));
					};

					for (var i = hero.x - SightRadius; i < hero.x + SightRadius; i++) {
						_loop2(i);
					}
					viewport.push(React.createElement(
						"div",
						{ className: "row", key: j },
						viewrow
					));
				};

				for (var j = hero.y - SightRadius; j < hero.y + SightRadius; j++) {
					_loop(j);
				}

				return React.createElement(
					"div",
					null,
					React.createElement(
						"h1",
						null,
						"Dungeon Level ",
						hero.dungeonLevel
					),
					React.createElement(
						"div",
						{ id: "viewport" },
						viewport,
						React.createElement(MessageBox, { message: _message })
					),
					React.createElement(PlayerStats, { hero: hero })
				);
			}

			return React.createElement("div", null);
		}
	}]);

	return Container;
}(React.Component);

var render = function render() {
	var state = store.getState();
	ReactDOM.render(React.createElement(Container, { state: state }), document.getElementById('react'));
};

store.subscribe(render);
'use strict';

function quaffPotion(state) {
	var hero = state.actors[0];

	var potionType = randomInt(1, 8);

	if (potionType == 1) {
		var damage = randomInt(1, 10) + randomInt(1, 10);
		store.dispatch({
			type: 'MESSAGE',
			text: 'Argh! The potion was poisoned. You lose ' + damage + ' HP.'
		});
		injure(hero, damage, state);
	} else if (potionType == 2) {
		var increase = randomInt(xpTable[hero.xpLevel - 1] + 1, xpTable[hero.xpLevel]);
		store.dispatch({
			type: 'MESSAGE',
			text: 'It was potion of experience! You gain ' + increase + ' XP.'
		});
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: 0,
			newValues: { xp: hero.xp + increase }
		});

		if (state.actors[0].xp + increase >= xpTable[state.actors[0].xpLevel]) gainLevel(state);
	} else if (potionType == 3) {
		heal(hero, hero.maxhp - hero.hp, state);
		store.dispatch({
			type: 'MESSAGE',
			text: "It was a potion of panacea! You are fully healed."
		});
	} else {
		var healing = randomInt(1, 10) + randomInt(1, 10);
		healing = heal(hero, healing, state);
		if (hero.hp == hero.maxhp) {
			store.dispatch({
				type: 'MESSAGE',
				text: "It was a potion of healing. You are completely healed."
			});
		} else {
			store.dispatch({
				type: 'MESSAGE',
				text: 'It was a potion of healing. You regain ' + healing + ' HP.'
			});
		}
	}
}

function readScroll(state) {
	var hero = state.actors[0];

	var scrollType = randomInt(1, 8);

	if (scrollType == 1) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'The walls come crashing down!'
		});
		for (var j = 1; j < DungeonHeight - 1; j++) {
			for (var i = 1; i < DungeonWidth - 1; i++) {
				if (state.dungeon[j][i] == "wall") store.dispatch({
					type: 'REMOVE_FEATURE',
					y: j,
					x: i
				});
			}
		}
	} else if (scrollType == 2) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'It was a scroll of summoning!'
		});
		var summonCount = 0;
		for (var _j = hero.y - 1; _j <= hero.y + 1; _j++) {
			for (var _i = hero.x - 1; _i <= hero.x + 1; _i++) {
				if ((_j != hero.y || _i != hero.x) && passable(_j, _i, state)) if (randomInt(0, 1)) {
					summonCount++;
					store.dispatch({
						type: 'CREATE_ACTOR',
						values: Object.assign({}, { y: _j, x: _i }, startingStats[randomInt(1, startingStats.length - 1)])
					});
				}
			}
		}if (summonCount == 0) store.dispatch({
			type: 'MESSAGE',
			text: 'Fortunately, no enemies appear.'
		});
	} else if (scrollType == 3) {
		(function () {
			store.dispatch({
				type: 'MESSAGE',
				text: 'Your enemies explode!'
			});

			var removeActors = [];

			state.actors.forEach(function (actor, i) {
				if (i != 0 && inLOS(hero, actor, state)) removeActors.push(i);
			});

			store.dispatch({
				type: 'REMOVE_ACTORS',
				indices: removeActors
			});
		})();
	} else if (scrollType == 4) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'It is a scroll of training. Your abilities improve.'
		});
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: 0,
			newValues: {
				str: hero.str + 1,
				dex: hero.dex + 1
			}
		});
	} else {
		store.dispatch({
			type: 'MESSAGE',
			text: 'Your position suddenly seems uncertain...'
		});
		var y, x;
		do {
			y = randomInt(1, DungeonHeight - 2);
			x = randomInt(1, DungeonWidth - 2);
		} while (!passable(y, x, state));
		store.dispatch({
			type: 'MOVE_ACTOR',
			index: 0,
			newYX: { y: y, x: x }
		});
	}
}
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function startGame() {
	var _createDungeon = createDungeon(1);

	var _createDungeon2 = _slicedToArray(_createDungeon, 3);

	var firstDungeon = _createDungeon2[0];
	var firstActors = _createDungeon2[1];
	var start_spot = _createDungeon2[2];

	store.dispatch({ type: 'CREATE_DUNGEON', dungeon: firstDungeon });
	store.dispatch({ type: 'POPULATE_DUNGEON', actors: firstActors });
	store.dispatch({ type: 'READY_FOR_INPUT' });
}

function inLOS(actor, pos, state) {
	if (pos.y < 0 || pos.y >= DungeonHeight || pos.x < 0 || pos.x >= DungeonWidth) return false;

	for (var y = pos.y, x = pos.x; y != actor.y || x != actor.x;) {
		if (y < actor.y) y++;if (y > actor.y) y--;
		if (x < actor.x) x++;if (x > actor.x) x--;
		if (state.dungeon[y][x] == "wall") return false;
	}

	return true;
}

function gainLevel(state) {
	var hero = state.actors[0];

	store.dispatch({
		type: 'MESSAGE',
		text: 'You advance to level ' + (hero.xpLevel + 1) + '!'
	});

	var newStr = hero.str + randomInt(0, 1);
	var newDex = hero.dex + randomInt(0, 1);
	var hpGain = randomInt(10, 20);
	store.dispatch({
		type: 'MUTATE_ACTOR',
		index: 0,
		newValues: {
			str: newStr,
			dex: newDex,
			maxhp: hero.maxhp + hpGain,
			hp: hero.hp + hpGain,
			xpLevel: hero.xpLevel + 1
		}
	});
}

function heal(actor, healing, state) {
	if (actor.hp + healing > actor.maxhp) {
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: state.actors.indexOf(actor),
			newValues: { hp: actor.maxhp }
		});
		return actor.maxhp - actor.hp;
	} else {
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: state.actors.indexOf(actor),
			newValues: { hp: actor.hp + healing }
		});
		return healing;
	}
}

function injure(actor, damage, state) {
	if (actor.hp - damage > 0) {
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: state.actors.indexOf(actor),
			newValues: { hp: actor.hp - damage }
		});
	} else if (actor.type == "hero") {
		store.dispatch({
			type: 'MESSAGE',
			text: "You die! Press <SPACE> to restart."
		});
		store.dispatch({ type: 'GAME_OVER' });
	} else {
		store.dispatch({
			type: 'MESSAGE',
			text: 'The ' + actor.type + ' is defeated!'
		});
		store.dispatch({
			type: 'REMOVE_ACTORS',
			indices: [state.actors.indexOf(actor)]
		});
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: 0,
			newValues: { xp: state.actors[0].xp + actor.xp }
		});
		if (state.actors[0].xp + actor.xp >= xpTable[state.actors[0].xpLevel]) gainLevel(state);
	}
}

function attack(source, target, state) {
	var actorName = source.type == "hero" ? "You" : 'The ' + source.type;
	var targetName = target.type == "hero" ? "you" : 'the ' + target.type;
	var suffix = source.type == "hero" ? "" : "s";

	var attackRoll = randomInt(1, source.str + source.dex);
	if (attackRoll > target.dex || randomInt(1, 8) == 8) {
		var damage = randomInt(1, source.str) - target.armor;
		if (damage < 1) {
			store.dispatch({
				type: 'MESSAGE',
				text: actorName + ' strike' + suffix + ' ' + targetName + ', but deal no damage.'
			});
		} else {
			store.dispatch({
				type: 'MESSAGE',
				text: actorName + ' strike' + suffix + ' ' + targetName + ' for ' + damage + ' damage.'
			});
			injure(target, damage, state);
		}
	} else {
		var suffix2 = source.type == "hero" ? "" : "es";
		store.dispatch({
			type: 'MESSAGE',
			text: actorName + ' swing' + suffix + ' at ' + targetName + ' and miss' + suffix2 + '.'
		});
	}
}

function passable(y, x, state) {
	if (state.dungeon[y][x] == "wall" || state.actors.find(function (actor) {
		return actor.y == y && actor.x == x;
	})) return false;else return true;
}

function moveToward(actor, target, state) {
	var newY = actor.y,
	    newX = actor.x;
	if (target.y > newY) newY++;
	if (target.y < newY) newY--;
	if (target.x > newX) newX++;
	if (target.x < newX) newX--;

	if (newY == target.y && newX == target.x && target.type) {
		attack(actor, target, state);
	} else if (passable(newY, newX, state)) return { y: newY, x: newX };else {
		newY = actor.y;newX = actor.x;
		if (target.x > newX) newX++;
		if (target.x < newX) newX--;

		if (passable(newY, newX, state)) return { y: newY, x: newX };else {
			newY = actor.y;newX = actor.x;
			if (target.y > newY) newY++;
			if (target.y < newY) newY--;

			if (passable(newY, newX, state)) return { y: newY, x: newX };else return null;
		}
	}
}

function moveMonsters() {
	var state = store.getState();

	state.actors.forEach(function (actor, i) {
		if (i != 0 && state.controller == "working") {
			if (!actor.seenHero) {
				if (inLOS(state.actors[0], actor, state)) actor.seenHero = true;
			}

			if (actor.seenHero) {
				var newYX;
				if (actor.type == "bat") {
					var randomDir = dirs[randomInt(0, 7)];
					var randomSpot = { y: actor.y + randomDir[0], x: actor.x + randomDir[1] };
					if (passable(randomSpot.y, randomSpot.x, state)) newYX = moveToward(actor, randomSpot, state);else newYX = moveToward(actor, state.actors[0], state);
				} else newYX = moveToward(actor, state.actors[0], state);

				if (newYX) store.dispatch({
					type: 'MOVE_ACTOR',
					index: i,
					newYX: newYX
				});
			}
		}
		state = store.getState();
	});
}

window.addEventListener("keydown", function (e) {
	var state = store.getState();

	if (state.controller == "ready") {
		var dungeon = state.dungeon;
		var actors = state.actors;

		var hero = actors[0];

		store.dispatch({ type: 'BEGIN_TURN' });
		if (mov[e.keyCode]) {
			var weapon;

			(function () {
				var newY = hero.y + mov[e.keyCode][0];
				var newX = hero.x + mov[e.keyCode][1];
				var actor = actors.find(function (actor) {
					return actor.y == newY && actor.x == newX;
				});
				if (actor) {
					attack(hero, actor, state);
				} else {
					var move = true;

					switch (dungeon[newY][newX]) {
						case "wall":
							move = false;
							break;

						case "club":
							store.dispatch({ type: 'MESSAGE',
								text: "You find a stout club. It should be good for whacking monsters."
							});
							store.dispatch({ type: 'MUTATE_ACTOR',
								index: 0,
								newValues: { weapon: "club", str: hero.str + 2 }
							});
							store.dispatch({ type: 'REMOVE_FEATURE',
								y: newY,
								x: newX
							});
							break;

						case "sword":
							if (hero.weapon == "club") {
								store.dispatch({ type: 'MESSAGE',
									text: "You find a sword! Time to chop stuff up."
								});
								store.dispatch({ type: 'MUTATE_ACTOR',
									index: 0,
									newValues: { weapon: "sword", str: hero.str + 2 }
								});
							} else {
								var bonus = hero.weapon[hero.weapon.length - 1];
								weapon = "sword";


								bonus = parseInt(bonus);
								if (!isNaN(bonus)) weapon = "sword + " + (bonus + 1);

								store.dispatch({ type: 'MESSAGE',
									text: "You find a better sword."
								});
								store.dispatch({ type: 'MUTATE_ACTOR',
									index: 0,
									newValues: { weapon: weapon, str: hero.str + 1 }
								});
							}
							store.dispatch({ type: 'REMOVE_FEATURE',
								y: newY,
								x: newX
							});
							break;

						case "orb":
							store.dispatch({ type: 'MESSAGE',
								text: "Congratulations! You have discovered to orb of Zot! You win!"
							});
							store.dispatch({ type: 'GAME_OVER' });
							break;

						case "ladder_down":
							store.dispatch({ type: 'MESSAGE',
								text: "There is a ladder here. Press > to descend."
							});
							break;

						case "potion":
							store.dispatch({ type: 'MESSAGE',
								text: "There is a potion here. Press Q to quaff it."
							});
							break;

						case "scroll":
							store.dispatch({ type: 'MESSAGE',
								text: "There is a scroll here. Press R to read it."
							});
							break;

						default:
					}

					if (move) {
						store.dispatch({
							type: 'MOVE_ACTOR',
							index: 0,
							newYX: {
								y: newY,
								x: newX
							}
						});
					}
				}

				moveMonsters();
			})();
		} else switch (e.keyCode) {
			case 81:
				if (dungeon[hero.y][hero.x] == "potion") {
					store.dispatch({ type: 'MESSAGE',
						text: 'You throw back the potion.'
					});
					store.dispatch({ type: 'REMOVE_FEATURE',
						y: hero.y,
						x: hero.x
					});
					quaffPotion(state);
				} else {
					store.dispatch({ type: 'MESSAGE',
						text: 'There is nothing quaffable here.'
					});
				}
				break;

			case 82:
				if (dungeon[hero.y][hero.x] == "scroll") {
					store.dispatch({ type: 'MESSAGE',
						text: 'You read the scroll.'
					});
					store.dispatch({ type: 'REMOVE_FEATURE',
						y: hero.y,
						x: hero.x
					});
					readScroll(state);
				} else {
					store.dispatch({ type: 'MESSAGE',
						text: 'There is nothing to read here.'
					});
				}
				break;

			case 32:
			case 101:
				moveMonsters();
				break;

			case 190:
				if (e.shiftKey) if (dungeon[hero.y][hero.x] == "ladder_down") {
					var _createDungeon3 = createDungeon(hero.dungeonLevel + 1, hero);

					var _createDungeon4 = _slicedToArray(_createDungeon3, 2);

					var newDungeon = _createDungeon4[0];
					var _actors = _createDungeon4[1];

					store.dispatch({ type: 'CREATE_DUNGEON', dungeon: newDungeon });
					store.dispatch({ type: 'POPULATE_DUNGEON', actors: _actors });
					store.dispatch({ type: 'MUTATE_ACTOR', index: 0, newValues: { dungeonLevel: hero.dungeonLevel + 1 } });
					store.dispatch({ type: "MESSAGE", text: "You climb down the ladder to level " + (hero.dungeonLevel + 1) + "." });
				} else store.dispatch({ type: "MESSAGE", text: "You can't go down here." });
				break;
		}
	} else if (e.keyCode == 32 && state.controller == "game_over") {
		startGame();
	}
	if (store.getState().controller == "working") store.dispatch({ type: 'READY_FOR_INPUT' });
}, false);

startGame();
