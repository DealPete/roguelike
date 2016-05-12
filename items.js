function quaffPotion(state) {
	let hero = state.actors[0];

	let potionType = randomInt(1, 8);

	if (potionType == 1) {
		let damage = randomInt(1, 10) + randomInt(1, 10);
		store.dispatch({
			type: 'MESSAGE',
			text: `Argh! The potion was poisoned. You lose ${damage} HP.`
		});
		injure(hero, damage, state);
	} else if (potionType == 2) {
		let increase = randomInt(xpTable[hero.xpLevel - 1] + 1, xpTable[hero.xpLevel]);
		store.dispatch({
			type: 'MESSAGE',
			text: `It was potion of experience! You gain ${increase} XP.`
		});
		store.dispatch({
			type: 'MUTATE_ACTOR',
			index: 0,
			newValues: {xp: hero.xp + increase}
		});

		if (state.actors[0].xp + increase >= xpTable[state.actors[0].xpLevel])
			gainLevel(state);
	} else if (potionType == 3) {
		heal(hero, hero.maxhp - hero.hp, state);
		store.dispatch({
			type: 'MESSAGE',
			text: "It was a potion of panacea! You are fully healed."
		});
	} else {
		let healing = randomInt(1, 10) + randomInt(1, 10);
		healing = heal(hero, healing, state);
		if (hero.hp == hero.maxhp) {
			store.dispatch({
				type: 'MESSAGE',
				text: "It was a potion of healing. You are completely healed."
			});
		} else {
			store.dispatch({
				type: 'MESSAGE',
				text: `It was a potion of healing. You regain ${healing} HP.`
			});
		}
	}
}

function readScroll(state) {
	let hero = state.actors[0];

	let scrollType = randomInt(1, 8);

	if (scrollType == 1) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'The walls come crashing down!'
		});
		for (let j=1; j < DungeonHeight - 1; j++)
			for (let i=1; i < DungeonWidth - 1; i++)
				if (state.dungeon[j][i] == "wall")
					store.dispatch({
						type: 'REMOVE_FEATURE',
						y: j,
						x: i
					});
	} else if (scrollType == 2) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'It was a scroll of summoning!'
		});
		let summonCount = 0;
		for (let j=hero.y - 1; j <= hero.y + 1; j++)
			for (let i=hero.x - 1; i <= hero.x + 1; i++)
				if ((j != hero.y || i != hero.x) && passable(j, i, state))
					if (randomInt(0, 1)) {
						summonCount++;
						store.dispatch({
							type: 'CREATE_ACTOR',
							values: Object.assign({}, {y: j, x: i}, startingStats[randomInt(1, startingStats.length - 1)])
						});
					}
		if (summonCount == 0)
			store.dispatch({
				type: 'MESSAGE',
				text: 'Fortunately, no enemies appear.'
			});
	} else if (scrollType == 3) {
		store.dispatch({
			type: 'MESSAGE',
			text: 'Your enemies explode!'
		});
		
		let removeActors = [];

		state.actors.forEach( (actor, i) => {
			if (i != 0 && inLOS( hero, actor, state ))
				removeActors.push(i);
		});

		store.dispatch({
			type: 'REMOVE_ACTORS',
			indices: removeActors
		});
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
		} while (!passable(y, x, state))
		store.dispatch({
			type: 'MOVE_ACTOR',
			index: 0,
			newYX: {y: y, x: x}
		});
	}
}
