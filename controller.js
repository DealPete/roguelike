
function startGame() {
	let [firstDungeon, firstActors, start_spot] = createDungeon(1);
	store.dispatch({type: 'CREATE_DUNGEON', dungeon: firstDungeon});
	store.dispatch({type: 'POPULATE_DUNGEON', actors: firstActors});
	store.dispatch({type: 'READY_FOR_INPUT'});
}

function inLOS(actor, pos, dungeon) {
	if (pos.y < 0 || pos.y >= DungeonHeight || pos.x < 0 || pos.x >= DungeonWidth)
		return false;
	
	for (var y = pos.y, x = pos.x; (y != actor.y || x != actor.x); ) {
		if (y < actor.y) y++; if (y > actor.y) y--;
		if (x < actor.x) x++; if (x > actor.x) x--;
		if (dungeon[y][x] == "wall")
			return false;
	}

	return true;
}

function attack(source, target, state) {
	let actorName = source.type == "hero" ? "You" : `The ${source.type}`;
	let targetName = target.type == "hero" ? "you" : `the ${target.type}`;
	let suffix = source.type == "hero" ? "" : "s";

	let attackRoll = randomInt(1, source.str + source.dex);
	if (attackRoll > target.dex || randomInt(1, 8) == 8) {
		let damage = randomInt(1, source.str) - target.armor;
		if (damage < 1) {
			store.dispatch({
				type: 'MESSAGE',
				text: `${actorName} strike${suffix} ${targetName}, but deal no damage.`
			});
		} else {
			store.dispatch({
				type: 'MESSAGE',
				text: `${actorName} strike${suffix} ${targetName} for ${damage} damage.`
			});
			if (target.hp - damage > 0) {
				store.dispatch({
					type: 'MUTATE_ACTOR',
					index: state.actors.indexOf(target),
					newValues: {hp: target.hp - damage}
				});
			} else if (target.type == "hero") {
				store.dispatch({
					type: 'MESSAGE',
					text: "You die! Press <SPACE> to restart."
				});
				store.dispatch({ type: 'HERO_DIES' });
			} else
				{
				store.dispatch({
					type: 'MESSAGE',
					text: `The ${target.type} is defeated!`
				});
				store.dispatch({
					type: 'MUTATE_ACTOR',
					index: 0,
					newValues: {xp: state.actors[0].xp + target.xp}
				});
				store.dispatch({
					type: 'REMOVE_ACTOR',
					index: state.actors.indexOf(target)
				});
			}
		}
	} else {
		store.dispatch({
			type: 'MESSAGE',
			text: `${actorName} swing${suffix} at ${targetName} and miss.`
		});
	}
}

function passable(y, x, state) {
	if (state.dungeon[y][x] == "wall" || state.actors.find( actor => actor.y == y && actor.x == x ))
		return false;
	else
		return true;
}

function moveToward(actor, target, state) {
	let newY = actor.y, newX = actor.x;
	if (target.y > newY) newY++;
	if (target.y < newY) newY--;
	if (target.x > newX) newX++;
	if (target.x < newX) newX--;

	if (newY == target.y && newX == target.x) {
		attack(actor, target, state);
	}
	else if (passable(newY, newX, state))
		return {y: newY, x: newX}
	else {
		newY = actor.y; newX = actor.x
		if (target.x > newX) newX++;
		if (target.x < newX) newX--;
		
		if (passable(newY, newX, state))
			return {y: newY, x: newX}
		else {
			newY = actor.y; newX = actor.x
			if (target.y > newY) newY++;
			if (target.y < newY) newY--;

			if (passable(newY, newX, state))
				return {y: newY, x: newX};
			else
				return null;
		}
	}
}

function moveMonsters() {
	let state = store.getState();

	state.actors.forEach( (actor, i) => {
		if (i != 0 && state.controller == "working") {
			let newYX = moveToward(actor, state.actors[0], state);
			if (newYX)
				store.dispatch({
					type: 'MOVE_ACTOR',
					index: i,
					newYX: newYX
				});
		}
		state = store.getState();
	});
}

window.addEventListener("keydown", (e) => {
		let state = store.getState();
		let [ dungeon, actors ] = [ state.dungeon, state.actors ];
		let hero = actors[0];

		if (state.controller == "ready") {
			store.dispatch({ type: 'BEGIN_TURN' });
			if (mov[e.keyCode]) {
				let newY = hero.y + mov[e.keyCode][0];
				let newX = hero.x + mov[e.keyCode][1];
				let actor = actors.find( actor => actor.y == newY && actor.x == newX );
				if (actor) {
					attack(hero, actor, state);
				}
				else {
					switch(dungeon[newY][newX]) {
						case "wall":
							break;

						case "orb":
							store.dispatch({type: 'MESSAGE',
								text:
	"Congratulations! You have discovered to orb of Zot! You win!"
							});

						default:
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
			} else switch(e.keyCode) {
				case 32:
				case 101:
					moveMonsters();
					break;

				case 190:
					if (e.shiftKey)
						if (dungeon[hero.y][hero.x] == "ladder_down") {
							let [ newDungeon, actors ] = createDungeon(hero.lvl + 1, hero);
							store.dispatch({ type: 'CREATE_DUNGEON', dungeon: newDungeon });	
							store.dispatch({ type: "MUTATE_ACTOR", index: 0, newValues:
								{ lvl: hero.lvl + 1 }});
							store.dispatch({ type: 'POPULATE_DUNGEON', actors: actors });
							store.dispatch({ type: "MESSAGE", text: 
								"You climb down the ladder to level " + (hero.lvl + 1)});
						}
						else
							store.dispatch({ type: "MESSAGE", text: "You can't go down here."});
					break;
			}
		} else if (e.keyCode == 32 && state.controller == "hero_dead") {
			startGame();
		}
		if (store.getState().controller == "working")
			store.dispatch({ type: 'READY_FOR_INPUT' });
	}
, false);

startGame();

