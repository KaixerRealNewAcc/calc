// Trainers that should auto-select Doubles when chosen in the set selector.
// Names are matched with trainerNamesMatch (from gauntlets.js) against the trainer
// portion of "Species (Trainer)" — use the same spelling as in gen9.js / the dropdown.
var TRAINERS_AUTO_DOUBLES = [
	"Mt. Moon Super Nerd Miguel"
];

function trainerShouldUseDoubles(trainerName) {
	if (!trainerName) return false;
	for (var i = 0; i < TRAINERS_AUTO_DOUBLES.length; i++) {
		var entry = TRAINERS_AUTO_DOUBLES[i];
		if (typeof trainerNamesMatch === "function") {
			if (trainerNamesMatch(entry, trainerName) || trainerNamesMatch(trainerName, entry)) return true;
		} else if (String(entry).trim() === String(trainerName).trim()) {
			return true;
		}
	}
	return false;
}

/** Called when the opposing set (or related UI) changes; must load after gauntlets.js */
function applyBattleSettings(trainerName) {
	if (trainerShouldUseDoubles(trainerName)) {
		$("#doubles-format").prop("checked", true);
		$("#doubles-format").change();
	}
	/* Do not force Singles when not listed — keep the user's manual Singles/Doubles choice */
}
