// Gauntlet config
// Define which trainers are part of back-to-back fights or gauntlets.
// Names are put next to the next trainer button.

var GAUNTLET_LIST = [
	{ name: "", trainers: [""] },
];

function trainerNamesMatch(gauntletName, setNameTrainer) {
	if (!gauntletName || !setNameTrainer) return false;
	var a = String(gauntletName).trim().replace(/\s+/g, " ");
	var b = String(setNameTrainer).trim().replace(/\s+/g, " ");
	if (a === b) return true;
	if (b.indexOf(a) === 0 && (b.length === a.length || b.charAt(a.length) === " ")) return true;
	if (a.indexOf(b) === 0 && (a.length === b.length || a.charAt(b.length) === " ")) return true;
	return false;
}

function getGauntletForTrainer(trainerName) {
	for (var g = 0; g < GAUNTLET_LIST.length; g++) {
		var entry = GAUNTLET_LIST[g];
		var trainers = entry.trainers;
		for (var i = 0; i < trainers.length; i++) {
			if (trainerNamesMatch(trainers[i], trainerName)) {
				return { name: entry.name, trainers: trainers };
			}
		}
	}
	return null;
}

function getGauntletTrainers(trainerName) {
	var gauntlet = getGauntletForTrainer(trainerName);
	if (gauntlet) {
		return gauntlet.trainers;
	}
	return [trainerName];
}
