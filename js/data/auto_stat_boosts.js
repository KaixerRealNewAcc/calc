// Automatic combat stage boosts for specific species + trainer sets (in-game effects, etc.).
// Matched after loading a set; trainer matching uses trainerNamesMatch from gauntlets.js when available.

var AUTO_STAT_BOOST_RULES = [
	{
	},
];

function applyAutoStatBoosts(pokeObj, fullSetName) {
	if (!pokeObj || !pokeObj.length || !fullSetName || fullSetName.indexOf(" (") === -1) {
		return;
	}
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")).trim();
	var trainerName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")")).trim();
	var rule = null;
	for (var r = 0; r < AUTO_STAT_BOOST_RULES.length; r++) {
		var entry = AUTO_STAT_BOOST_RULES[r];
		if (entry.species !== pokemonName) {
			continue;
		}
		if (typeof trainerNamesMatch === "function") {
			if (trainerNamesMatch(entry.trainer, trainerName) || trainerNamesMatch(trainerName, entry.trainer)) {
				rule = entry;
				break;
			}
		} else if (entry.trainer === trainerName) {
			rule = entry;
			break;
		}
	}
	if (!rule || !rule.boosts) {
		return;
	}
	for (var stat in rule.boosts) {
		if (!rule.boosts.hasOwnProperty(stat)) {
			continue;
		}
		var v = rule.boosts[stat];
		var sel = pokeObj.find("." + stat + " .boost");
		if (!sel.length) {
			continue;
		}
		v = Math.max(-6, Math.min(6, ~~v));
		sel.val(String(v)).change();
	}
}
