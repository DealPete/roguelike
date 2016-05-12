const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

const mov = {"33": [-1, 1],
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
const exits = [[true, true],
	[true, true],
	[true, false],
	[true, true],
	[true, true],
	[true, false],
	[false, true],
	[false, true],
	[false , false]]

const Tiles = {
	// features
	"ladder_up": "-256px -192px",
	"ladder_down": "-288px -192px",
	"wall" : "-480px -64px",
	"orb": "-288px -32px",
	"floor" : "-128px -64px",
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

const xpTable = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

const startingStats = [
	{
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
	},
	{
		type: "skeleton",
		hd: 1,
		str: 2,
		dex: 4,
		armor: 1,
		xp: 5
	},
	{
		type: "orc",
		hd: 1,
		str: 4,
		dex: 2,
		armor: 2,
		xp: 10
	},
	{
		type: "snake",
		hd: 2,
		str: 2,
		dex: 6,
		armor: 0,
		xp: 15
	},
	{
		type: "bat",
		hd: 1,
		str: 1,
		dex: 8,
		armor: 0,
		xp: 5
	},
	{
		type: "spider",
		hd: 2,
		str: 3,
		dex: 5,
		armor: 0,
		xp: 15
	}
];

const DungeonWidth = 30;
const DungeonHeight = 30;
const DungeonDepth = 5;
const MonsterDensity = 10;
const SightRadius = 8;
const MessageQueueSize = 6;

const { combineReducers, createStore } = Redux;

const gameRedux = combineReducers({
	controller,
	message,
	dungeon,
	actors
});

const store = createStore(gameRedux);

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDungeon(level, hero) {
	
	let dungeon = [];
	let actors = [];
	let rooms = [];

	function free_room_tile(i) {
		if (rooms[i].freeTiles.length == 0)
			return "full";
		else {
			let pos = randomInt(0, rooms[i].freeTiles.length - 1);
			return rooms[i].freeTiles.splice(pos, 1)[0];
		}
	}
	for(let i=0; i< DungeonHeight; i++) {
		let tempArray = [];
		for(let j=0; j< DungeonWidth; j++)
			tempArray.push("wall");
		dungeon.push(tempArray);
	}
	for(let i=0; i< 9; i++) {
		let areaWidth = (DungeonHeight/3);
		let areaHeight = (DungeonWidth/3);

		let newRoom = {width: randomInt(1, areaWidth - 2),
			height: randomInt(1, areaHeight - 2)};

		newRoom.topLeftX = Math.floor(i / 3)*areaWidth +
			randomInt(1, areaWidth - newRoom.width - 1);
		newRoom.topLeftY = (i % 3)*areaHeight +
			randomInt(1, areaHeight - newRoom.height - 1);
		
		newRoom.freeTiles = [];
		rooms.push(newRoom);
	}
	for(let i=0; i<9; i++) {
		if (exits[i][0]) {
			let bendX = rooms[i+3].topLeftX -
				randomInt(1, rooms[i+3].topLeftX -
					(rooms[i].topLeftX + rooms[i].width + 1));
			let exitWestX = rooms[i].topLeftX + rooms[i].width;
			let exitEastX = rooms[i+3].topLeftX;
			let exitWestY = randomInt(rooms[i].topLeftY,
				rooms[i].height + rooms[i].topLeftY - 1);
			let exitEastY = randomInt(rooms[i+3].topLeftY,
				rooms[i+3].height + rooms[i+3].topLeftY - 1);

			for(let i=exitWestX; i < bendX; i++)
				dungeon[exitWestY][i] = "floor";

			for(let i=bendX; i < exitEastX; i++)
				dungeon[exitEastY][i] = "floor";

			let upDown = exitWestY < exitEastY ? 1 : -1;

			for(let i=exitWestY; i != exitEastY; i += upDown)
				dungeon[i][bendX] = "floor";
		}
			
		if (exits[i][1]) {
			let bendY = rooms[i+1].topLeftY -
				randomInt(1, rooms[i+1].topLeftY -
					(rooms[i].topLeftY + rooms[i].height + 1));
			let exitNorthY = rooms[i].topLeftY + rooms[i].height;
			let exitSouthY = rooms[i+1].topLeftY;
			let exitNorthX = randomInt(rooms[i].topLeftX,
				rooms[i].width + rooms[i].topLeftX -1);
			let exitSouthX = randomInt(rooms[i+1].topLeftX,
				rooms[i+1].width + rooms[i+1].topLeftX - 1);

			for(let i=exitNorthY; i < bendY; i++)
				dungeon[i][exitNorthX] = "floor";

			for(let i=bendY; i < exitSouthY; i++)
				dungeon[i][exitSouthX] = "floor";

			let upDown = exitNorthX < exitSouthX ? 1 : -1;

			for(let i=exitNorthX; i != exitSouthX; i += upDown)
				dungeon[bendY][i] = "floor";
		}

		for(let y=0; y<rooms[i].height; y++)
			for(let x=0; x<rooms[i].width; x++) {
				let tileY = y + rooms[i].topLeftY;
				let tileX = x + rooms[i].topLeftX;
				rooms[i].freeTiles.push({y: tileY, x: tileX});
				dungeon[tileY][tileX] = "floor";
			}
	}
	
	let ladder_down = randomInt(0, 8);
	for(var hero_start = randomInt(0, 8);
		hero_start == ladder_down; hero_start = randomInt(0, 8));

	let {y, x} = free_room_tile(ladder_down);
	if (level == DungeonDepth)
		dungeon[y][x] = "orb";
	else
		dungeon[y][x] = "ladder_down";

	let start_spot = free_room_tile(hero_start);
	if (hero)
		actors.push(Object.assign({}, hero, start_spot));
	else
		actors.push(Object.assign({}, start_spot, startingStats[0]));

	function getFreeTile() {
		var tile;
		do {
			for(var tile_room = randomInt(0, 8);
				tile_room == hero_start; tile_room = randomInt(0, 8))
				;
			tile = free_room_tile(tile_room);
		} while (tile == "full")
		return tile;
	}

	for(let i=0; i < MonsterDensity; i++) {
		let newMonster = Object.assign({}, getFreeTile(), startingStats[randomInt(1, startingStats.length - 1)]);
		let hp = 0;
		for(let i=0; i < newMonster.hd; i++)
			hp += randomInt(1, 8);
		newMonster.hp = hp;

		actors.push(newMonster);
	}

	for (let i=0; i < randomInt(0, 5); i++) {
		let tile = getFreeTile();
		dungeon[tile.y][tile.x] = "potion";
	}

	for (let i=0; i < randomInt(0, 5); i++) {
		let tile = getFreeTile();
		dungeon[tile.y][tile.x] = "scroll";
	}

	if (randomInt(0,1)) {
		let tile = getFreeTile();
		if (!hero || hero.weapon == "hands")
			dungeon[tile.y][tile.x] = "club";
		else
			dungeon[tile.y][tile.x] = "sword";
	}
		
	return [dungeon, actors];
}

function controller(state = "init", action) {
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

function message(state = [["Welcome to the game.", "new"]], action) {
	let newQueue = [];
	switch (action.type) {
	case 'READY_FOR_INPUT':
		state.forEach( ([message, age]) => {
			if (age == "new")
				newQueue.push([message, "fresh"]);
			else
				newQueue.push([message, age]);
		});
		return newQueue;

	case 'MESSAGE':
		state.forEach( ([message, age], i) => {
			if (i > 0 || state.length < MessageQueueSize)
				newQueue.push([message, age == "new" ? "new" : "old"]);
		});
		newQueue.push([action.text, "new"]);
		return newQueue;
	
	default:
		return state;
	}
}

function dungeon(state = [], action) {
	switch (action.type) {
		case 'CREATE_DUNGEON':
			return action.dungeon;
		
		case 'REMOVE_FEATURE':
			return state.slice(0, action.y)
				.concat([state[action.y].slice(0, action.x)
					.concat(["floor"])
					.concat(state[action.y].slice(action.x + 1))])
				.concat(state.slice(action.y + 1));

		default:
			return state;
	}
}

function actors(state = [], action) {
	switch (action.type) {
		case 'POPULATE_DUNGEON':
			return action.actors;
		// MOVE_ACTOR: index, newYX
		case 'MOVE_ACTOR':
			return state.slice(0, action.index).concat([Object.assign({}, state[action.index],
				{y: action.newYX.y, x: action.newYX.x})]).concat(state.slice(action.index + 1));
		// MUTATE_ACTOR: index, newValues
		case 'MUTATE_ACTOR':
			return state.slice(0, action.index)
			.concat([Object.assign({}, state[action.index], action.newValues)])
			.concat(state.slice(action.index + 1));
		// CREATE_ACTOR: values
		case 'CREATE_ACTOR':
			return state.concat([action.values]);
		// REMOVE_ACTOR: indices
		case 'REMOVE_ACTORS':
			return state.filter( (actor, i) => action.indices.indexOf(i) == -1 );
		default:
			return state;
	}
}

class Tile extends React.Component {
	shouldComponentUpdate(nextProps) {
		return this.props.tile != nextProps.tile;
	};
	render() {
		if (this.props.tile == "blank")
			return (<div className="blank_tile"></div>);
		else
			return (<div 
				style={{"backgroundPosition": Tiles[this.props.tile]}} className="tile">
			</div>);
	};
}

class PlayerStats extends React.Component {
	render() {
		let hero = this.props.hero;
		return (<div id="stats">
					<p>Dupre the Fighter</p>
					<p>Level {hero.xpLevel}<br/>
					EXP {hero.xp}/{xpTable[hero.xpLevel]}</p>
					<p>HP {hero.hp}/{hero.maxhp}</p>
					<p>Strength {hero.str}</p>
					<p>Dexterity {hero.dex}</p>
					<p>Weapon: {hero.weapon}</p>
				</div>)
	}
}

class MessageBox extends React.Component {
	render() {
		return (<div className="messageBox">
					{this.props.message.map( ([message, age], i) =>
					<span className={age == "old" ? "stale" : "fresh"} key={i}>{message}<br/></span>)}
				</div>);
	}
}

class Container extends React.Component {
	render() {

		if (this.props.state.controller != "init") {
			let [ actors, dungeon, message ] = [ this.props.state.actors,
				this.props.state.dungeon, this.props.state.message ];
			let hero = actors[0];
			let viewport = [];

			for(let j = hero.y - SightRadius; j < hero.y + SightRadius; j++) {
				let viewrow = [];
				for(let i = hero.x - SightRadius; i < hero.x + SightRadius; i++) {
					let key = j*(2*SightRadius + 1) + i;
					if (inLOS({y: hero.y, x: hero.x}, {y: j, x: i}, this.props.state)) {
						let actor = actors.find( actor => actor.y == j && actor.x == i )
						if (actor)
							viewrow.push(<Tile key={key} tile={actor.type} />);
						else
							viewrow.push(<Tile key={key} tile={dungeon[j][i]} />);
					}
					else
						viewrow.push(<Tile key={key} tile={"blank"} />);
				}
				viewport.push(<div className="row" key={j}>{viewrow}</div>);
			}
					
			return (<div>
						<h1>Dungeon Level {hero.dungeonLevel}</h1>
						<div id="viewport">
							{viewport}
							<MessageBox message={message} />
						</div>
						<PlayerStats hero={hero} />
					</div>
						);
		}

		return (<div></div>);
	};
}

const render = () => {
	let state = store.getState(); 
	ReactDOM.render(
		<Container state={state} />,
		document.getElementById('react')
	);
};

store.subscribe(render);

