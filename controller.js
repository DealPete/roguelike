
function startGame() {
	let [firstDungeon, firstActors, start_spot] = createDungeon(1);
	store.dispatch({type: 'CREATE_DUNGEON', dungeon: firstDungeon});
	store.dispatch({type: 'POPULATE_DUNGEON', actors: firstActors});
	store.dispatch({type: 'READY_FOR_INPUT'});
}

function inLOS(actor, pos, state) {
	if (pos.y < 0 || pos.y >= DungeonHeight || pos.x < 0 || pos.x >= DungeonWidth)
		return false;
	
	for (var y = pos.y, x = pos.x; (y != actor.y || x != actor.x); ) {
		if (y < actor.y) y++; if (y > actor.y) y--;
		if (x < actor.x) x++; if (x > actor.x) x--;
		if (state.dungeon[y][x] == "wall")
			return false;
	}

	return true;
}

function gainLevel(state) {
	let hero = state.actors[0];

	store.dispatch({
		type: 'MESSAGE',
		text: `You advance to level ${hero.xpLevel + 1}!`
	});

	let newStr = hero.str + randomInt(0, 1);
	let newDex = hero.dex + randomInt(0, 1);
	let hpGain = randomInt(10, 20);
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
			newValues: {hp: actor.maxhp}
		});
		return actor.maxhp - actor.hp;
	}
	else {
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: state.actors.indexOf(actor),
			newValues: {hp: actor.hp + healing}
		});
		return healing;
	}
}
		
function injure(actor, damage, state) {
	if (actor.hp - damage > 0) {
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: state.actors.indexOf(actor),
			newValues: {hp: actor.hp - damage}
		});
	} else if (actor.type == "hero") {
		store.dispatch({
			type: 'MESSAGE',
			text: "You die! Press <SPACE> to restart."
		});
		store.dispatch({ type: 'GAME_OVER' });
	} else
		{
		store.dispatch({
			type: 'MESSAGE',
			text: `The ${actor.type} is defeated!`
		});
		store.dispatch({
			type: 'REMOVE_ACTORS',
			indices: [state.actors.indexOf(actor)]
		});
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: 0,
			newValues: {xp: state.actors[0].xp + actor.xp}
		});
		if (state.actors[0].xp + actor.xp >= xpTable[state.actors[0].xpLevel])
			gainLevel(state);
	}
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
			injure(target, damage, state);
		}
	} else {
		let suffix2 = source.type == "hero" ? "" : "es";
		store.dispatch({
			type: 'MESSAGE',
			text: `${actorName} swing${suffix} at ${targetName} and miss${suffix2}.`
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

	if (newY == target.y && newX == target.x && target.type) {
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
			if (!actor.seenHero) {
				if (inLOS(state.actors[0], actor, state))
					actor.seenHero = true;
			}

			if (actor.seenHero) {
				var newYX;
				if (actor.type == "bat") {
					let randomDir = dirs[randomInt(0, 7)];
					let randomSpot = {y: actor.y + randomDir[0], x: actor.x + randomDir[1]};
					if (passable(randomSpot.y, randomSpot.x, state))
						newYX = moveToward(actor, randomSpot, state);
					else
						newYX = moveToward(actor, state.actors[0], state);
				} else
					newYX = moveToward(actor, state.actors[0], state);

				if (newYX)
					store.dispatch({
						type: 'MOVE_ACTOR',
						index: i,
						newYX: newYX
					});
			}
		}
		state = store.getState();
	});
}

window.addEventListener("keydown", (e) => {
		let state = store.getState();

		if (state.controller == "ready") {
			let [ dungeon, actors ] = [ state.dungeon, state.actors ];
			let hero = actors[0];

			store.dispatch({ type: 'BEGIN_TURN' });
			if (mov[e.keyCode]) {
				let newY = hero.y + mov[e.keyCode][0];
				let newX = hero.x + mov[e.keyCode][1];
				let actor = actors.find( actor => actor.y == newY && actor.x == newX );
				if (actor) {
					attack(hero, actor, state);
				}
				else {
					let move = true;

					switch(dungeon[newY][newX]) {
						case "wall":
							move = false;
							break;

						case "club":
							store.dispatch({type: 'MESSAGE',
								text: "You find a stout club. It should be good for whacking monsters."
							});
							store.dispatch({type: 'MUTATE_ACTOR',
								index: 0,
								newValues: {weapon: "club", str: hero.str + 2}
							});
							store.dispatch({type: 'REMOVE_FEATURE',
								y: newY,
								x: newX
							});
							break;

						case "sword":
							if (hero.weapon == "club") {
								store.dispatch({type: 'MESSAGE',
									text: "You find a sword! Time to chop stuff up."
								});
								store.dispatch({type: 'MUTATE_ACTOR',
									index: 0,
									newValues: {weapon: "sword", str: hero.str + 2}
								});
							} else {
								let bonus = hero.weapon[hero.weapon.length - 1];
								var weapon = "sword";

								bonus = parseInt(bonus);
								if (isNaN(bonus))
									bonus = 0;
								else
									weapon = "sword + " + (bonus + 1);

								store.dispatch({type: 'MESSAGE',
									text: "You find a better sword."
								});
								store.dispatch({type: 'MUTATE_ACTOR',
									index: 0,
									newValues: {weapon: weapon, str: hero.str + 1}
								});
							}
							store.dispatch({type: 'REMOVE_FEATURE',
								y: newY,
								x: newX
							});
							break;
							
						case "orb":
							store.dispatch({type: 'MESSAGE',
								text: "Congratulations! You have discovered to orb of Zot! You win!"
							});
							store.dispatch({type: 'GAME_OVER'});
							break;

						case "ladder_down":
							store.dispatch({type: 'MESSAGE',
								text: "There is a ladder here. Press > to descend."
							});
							break;

						case "potion":
							store.dispatch({type: 'MESSAGE',
								text: "There is a potion here. Press Q to quaff it."
							});
							break;

						case "scroll":
							store.dispatch({type: 'MESSAGE',
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
			} else switch(e.keyCode) {
				case 81:
					if (dungeon[hero.y][hero.x] == "potion") {
						store.dispatch({type: 'MESSAGE',
							text: 'You throw back the potion.'
						});
						store.dispatch({type: 'REMOVE_FEATURE',
							y: hero.y,
							x: hero.x
						});
						quaffPotion(state);
					} else {
						store.dispatch({type: 'MESSAGE',
							text: 'There is nothing quaffable here.'
						});
					}
					break;

				case 82:
					if (dungeon[hero.y][hero.x] == "scroll") {
						store.dispatch({type: 'MESSAGE',
							text: 'You read the scroll.'
						});
						store.dispatch({type: 'REMOVE_FEATURE',
							y: hero.y,
							x: hero.x
						});
						readScroll(state);
					} else {
						store.dispatch({type: 'MESSAGE',
							text: 'There is nothing to read here.'
						});
					}
					break;

				case 32:
				case 101:
					moveMonsters();
					break;

				case 190:
					if (e.shiftKey)
						if (dungeon[hero.y][hero.x] == "ladder_down") {
							let [ newDungeon, actors ] = createDungeon(hero.dungeonLevel + 1, hero);
							store.dispatch({ type: 'CREATE_DUNGEON', dungeon: newDungeon });	
							store.dispatch({ type: 'POPULATE_DUNGEON', actors: actors });
							store.dispatch({ type: 'MUTATE_ACTOR', index: 0, newValues:
								{ dungeonLevel: hero.dungeonLevel + 1 }});
							store.dispatch({ type: "MESSAGE", text: 
								"You climb down the ladder to level " + (hero.dungeonLevel + 1) + "."});
						}
						else
							store.dispatch({ type: "MESSAGE", text: "You can't go down here."});
					break;
			}
		} else if (e.keyCode == 32 && state.controller == "game_over") {
			startGame();
		}
		if (store.getState().controller == "working")
			store.dispatch({ type: 'READY_FOR_INPUT' });
	}
, false);

startGame();

