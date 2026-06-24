if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex) { // eslint-disable-line no-extend-native
		var k;
		if (this == null) {
			throw new TypeError('"this" equals null or n is undefined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

function startsWith(string, target) {
	return (string || '').slice(0, target.length) === target;
}

function endsWith(string, target) {
	return (string || '').slice(-target.length) === target;
}

var LEGACY_STATS_RBY = ["hp", "at", "df", "sl", "sp"];
var LEGACY_STATS_GSC = ["hp", "at", "df", "sa", "sd", "sp"];
var LEGACY_STATS = [LEGACY_STATS_GSC, LEGACY_STATS_RBY, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC];
var HIDDEN_POWER_REGEX = /Hidden Power (\w*)/;

var CALC_STATUS = {
	'Healthy': '',
	'Paralyzed': 'par',
	'Poisoned': 'psn',
	'Badly Poisoned': 'tox',
	'Burned': 'brn',
	'Asleep': 'slp',
	'Frozen': 'frz'
};

function legacyStatToStat(st) {
	switch (st) {
	case 'hp':
		return "hp";
	case 'at':
		return "atk";
	case 'df':
		return "def";
	case 'sa':
		return "spa";
	case 'sd':
		return "spd";
	case 'sp':
		return "spe";
	case 'sl':
		return "spc";
	}
}

// input field validation
var bounds = {
	"level": [0, 100],
	"base": [1, 255],
	"evs": [0, 252],
	"ivs": [0, 31],
	"dvs": [0, 15],
	"sps": [0, 32],
	"move-bp": [0, 65535]
};
for (var bounded in bounds) {
	attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
}
function attachValidation(clazz, min, max) {
	$("." + clazz).keyup(function () {
		validate($(this), min, max);
	});
}
function validate(obj, min, max) {
	obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

$("input:radio[name='format']").change(function () {
	var gameType = $("input:radio[name='format']:checked").val();
	if (gameType === 'Singles') {
		$("input:checkbox[name='ruin']:checked").prop("checked", false);
	}
	$(".format-specific." + gameType.toLowerCase()).each(function () {
		if ($(this).hasClass("gen-specific") && !$(this).hasClass("g" + gen)) {
			return;
		}
		$(this).show();
	});
	$(".format-specific").not("." + gameType.toLowerCase()).hide();
});

var defaultLevel = 100;
$("input:radio[name='defaultLevel']").change(function () {
	defaultLevel = $("input:radio[name='defaultLevel']:checked").val();
	$("#levelL1").val(defaultLevel);
	$("#levelR1").val(defaultLevel);
	$("#levelL1").trigger("change");
	$("#levelR1").trigger("change");
});

// auto-calc stats and current HP on change
$(".level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});
$(".nature").bind("keyup change", function () {
	calcStats($(this).closest(".poke-info"));
});
$(".hp .base, .hp .evs, .hp .ivs, .hp .sps").bind("keyup change", function () {
	calcHP($(this).closest(".poke-info"));
});
$(".at .base, .at .evs, .at .ivs, .at .sps").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'at');
});
$(".df .base, .df .evs, .df .ivs , .df .sps").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'df');
});
$(".sa .base, .sa .evs, .sa .ivs, .sa .sps").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sa');
});
$(".sd .base, .sd .evs, .sd .ivs, .sd .sps").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sd');
});
$(".sp .base, .sp .evs, .sp .ivs, .sp .sps").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sp');
});
$(".evs, .sps").bind('keyup change', function () {
	totalEVs($(this).closest(".poke-info"));
});
$(".sl .base").keyup(function () {
	calcStat($(this).closest(".poke-info"), 'sl');
});
$(".at .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'at');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".df .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'df');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sa .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sa');
	poke.find(".sd .dvs").val($(this).val());
	calcStat(poke, 'sd');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sp .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sp');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sl .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sl');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});

function getForcedTeraType(pokemonName) {
	if (startsWith(pokemonName, "Ogerpon-Cornerstone")) {
		return "Rock";
	} else if (startsWith(pokemonName, "Ogerpon-Hearthflame")) {
		return "Fire";
	} else if (pokemonName === "Ogerpon" || startsWith(pokemonName, "Ogerpon-Teal")) {
		return "Grass";
	} else if (startsWith(pokemonName, "Ogerpon-Wellspring")) {
		return "Water";
	} else if (startsWith(pokemonName, "Terapagos")) {
		return "Stellar";
	}
	return null;
}

function getHPDVs(poke) {
	return (~~poke.find(".at .dvs").val() % 2) * 8 +
(~~poke.find(".df .dvs").val() % 2) * 4 +
(~~poke.find(".sp .dvs").val() % 2) * 2 +
(~~poke.find(gen === 1 ? ".sl .dvs" : ".sa .dvs").val() % 2);
}

function calcStats(poke) {
	for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
		calcStat(poke, LEGACY_STATS[gen][i]);
	}
}

function calcCurrentHP(poke, max, percent, skipDraw) {
	var current = Math.round(Number(percent) * Number(max) / 100);
	poke.find(".current-hp").val(current);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return current;
}
function calcPercentHP(poke, max, current, skipDraw) {
	var percent = Math.round(100 * Number(current) / Number(max));
	if (percent === 0 && current > 0) {
		percent = 1;
	} else if (percent === 100 & current < max) {
		percent = 99;
	}

	poke.find(".percent-hp").val(percent);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return percent;
}
function drawHealthBar(poke, max, current) {
	var fillPercent = 100 * current / max;
	var fillColor = fillPercent > 50 ? "green" : fillPercent > 20 ? "yellow" : "red";

	var healthbar = poke.find(".hpbar");
	healthbar.addClass("hp-" + fillColor);
	var unwantedColors = ["green", "yellow", "red"];
	unwantedColors.splice(unwantedColors.indexOf(fillColor), 1);
	for (var i = 0; i < unwantedColors.length; i++) {
		healthbar.removeClass("hp-" + unwantedColors[i]);
	}
	healthbar.css("background", "linear-gradient(to right, " + fillColor + " " + fillPercent + "%, white 0%");
}
// TODO: these HP inputs should really be input type=number with min=0, step=1, constrained by max=maxHP or 100
$(".current-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, max);
	var current = $(this).val();
	calcPercentHP($(this).parent(), max, current);
});
$(".percent-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, 100);
	var percent = $(this).val();
	calcCurrentHP($(this).parent(), max, percent);
});

$(".ability").bind("keyup change", function () {
	var ability = $(this).closest(".poke-info").find(".ability").val();

	for (var i = 1; i <= 4; i++) {
		var moveSelector = ".move" + i;
		var moveHits = 3;

		var moveName = $(this).closest(".poke-info").find(moveSelector).find(".select2-chosen").text();
		var move = moves[moveName] || moves['(No Move)'];
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if (ability === 'Skill Link') {
			moveHits = 5;
		} else if ($(this).closest(".poke-info").find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}
		$(this).closest(".poke-info").find(moveSelector).find(".move-hits").val(moveHits);
	}

	var TOGGLE_ABILITIES = ['Flash Fire', 'Intimidate', 'Minus', 'Plus', 'Slow Start', 'Unburden', 'Stakeout', 'Teraform Zero'];

	if (TOGGLE_ABILITIES.indexOf(ability) >= 0) {
		$(this).closest(".poke-info").find(".abilityToggle").show();
	} else {
		$(this).closest(".poke-info").find(".abilityToggle").hide();
	}

	checkRivalry(ability);

	var boostedStat = $(this).closest(".poke-info").find(".boostedStat");
	if (ability === "Protosynthesis" || ability === "Quark Drive") {
		boostedStat.show();
		autosetQP($(this).closest(".poke-info"));
	} else {
		boostedStat.val("");
		boostedStat.hide();
	}

	if (ability === "Supreme Overlord") {
		$(this).closest(".poke-info").find(".alliesFainted").show();
	} else {
		$(this).closest(".poke-info").find(".alliesFainted").val('0');
		$(this).closest(".poke-info").find(".alliesFainted").hide();
	}

});

function autosetQP(pokemon) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";

	var item = pokemon.find(".item").val();
	var ability = pokemon.find(".ability").val();
	var boostedStat = pokemon.find(".boostedStat").val();

	if (!boostedStat || boostedStat === "auto") {
		if (
			(item === "Booster Energy") ||
			(ability === "Protosynthesis" && currentWeather === "Sun") ||
			(ability === "Quark Drive" && currentTerrain === "Electric")
		) {
			pokemon.find(".boostedStat").val("auto");
		} else {
			pokemon.find(".boostedStat").val("");
		}
	}
}

$("#p1 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 0);
	autosetTerrain($(this).val(), 0);
	autosetQP($(this).closest(".poke-info"));
});

$("input[name='weather']").change(function () {
	var allPokemon = $('.poke-info');
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualWeather = "";
var lastAutoWeather = ["", ""];
function autosetWeather(ability, i) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	if (lastAutoWeather.indexOf(currentWeather) === -1) {
		lastManualWeather = currentWeather;
		lastAutoWeather[1 - i] = "";
	}
	switch (ability) {
		case "Drought":
		case "Orichalcum Pulse":
			lastAutoWeather[i] = "Sun";
			$("#sun").prop("checked", true);
			break;
		case "Drizzle":
			lastAutoWeather[i] = "Rain";
			$("#rain").prop("checked", true);
			break;
		case "Sand Stream":
			lastAutoWeather[i] = "Sand";
			$("#sand").prop("checked", true);
			break;
		case "Snow Warning":
			if (gen >= 9) {
				lastAutoWeather[i] = "Snow";
				$("#snow").prop("checked", true);
			} else {
				lastAutoWeather[i] = "Hail";
				$("#hail").prop("checked", true);
			}
			break;
		case "Desolate Land":
			lastAutoWeather[i] = "Harsh Sunshine";
			$("#harshsunshine").prop("checked", true);
			break;
		case "Primordial Sea":
			lastAutoWeather[i] = "Heavy Rain";
			$("#heavyrain").prop("checked", true);
			break;
		case "Delta Stream":
			lastAutoWeather[i] = "Strong Winds";
			$("#strongwinds").prop("checked", true);
			break;
		default:
			break;
	}
}

var lastManualTerrain = "";
var lastAutoTerrain = ["", ""];
function autosetTerrain(ability, i) {
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";
	if (lastAutoTerrain.indexOf(currentTerrain) === -1) {
		lastManualTerrain = currentTerrain;
		lastAutoTerrain[1 - i] = "";
	}
	// terrain input uses checkbox instead of radio, need to uncheck all first
	$("input:checkbox[name='terrain']:checked").prop("checked", false);
	switch (ability) {
		case "Electric Surge":
		case "Hadron Engine":
			lastAutoTerrain[i] = "Electric";
			$("#electric").prop("checked", true);
			break;
		case "Grassy Surge":
			lastAutoTerrain[i] = "Grassy";
			$("#grassy").prop("checked", true);
			break;
		case "Misty Surge":
			lastAutoTerrain[i] = "Misty";
			$("#misty").prop("checked", true);
			break;
		case "Psychic Surge":
			lastAutoTerrain[i] = "Psychic";
			$("#psychic").prop("checked", true);
			break;
		default:
			lastAutoTerrain[i] = "";
			var newTerrain = lastAutoTerrain[1 - i] !== "" ? lastAutoTerrain[1 - i] : lastManualTerrain;
			if ("No terrain" !== newTerrain) {
				$("input:checkbox[name='terrain'][value='" + newTerrain + "']").prop("checked", true);
			}
			break;
	}
}

$("#p1 .item").bind("keyup change", function () {
	autosetStatus("#p1", $(this).val());
});

var lastManualStatus = { "#p1": "Healthy" };
var lastAutoStatus = { "#p1": "Healthy" };
function autosetStatus(p, item) {
	var currentStatus = $(p + " .status").val();
	if (item === "Flame Orb") {
		lastAutoStatus[p] = "Burned";
		$(p + " .status").val("Burned");
		$(p + " .status").change();
	} else if (item === "Toxic Orb") {
		lastAutoStatus[p] = "Badly Poisoned";
		$(p + " .status").val("Badly Poisoned");
		$(p + " .status").change();
	}
}

$(".status").bind("keyup change", function () {
	if ($(this).val() === 'Badly Poisoned') {
		$(this).parent().children(".toxic-counter").show();
	} else {
		$(this).parent().children(".toxic-counter").hide();
	}
});

$(".teraType").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	var checked = pokeObj.find(".teraToggle").prop("checked");
	stellarButtonsVisibility(pokeObj, $(this).val() === "Stellar" && checked);
});

function critRateLabelsVisible() {
	var $toggle = $("#showCritPercentages");
	return !$toggle.length || $toggle.is(":checked");
}

function critRateLabelHtml(labelId) {
	return '<span class="crit-rate" id="' + labelId + '">' +
		'<span class="crit-rate-value"></span><span class="crit-rate-sign">%</span></span>';
}

function ensureCritRateLabelStructure($label) {
	if (!$label.find(".crit-rate-value").length) {
		$label.html('<span class="crit-rate-value"></span><span class="crit-rate-sign">%</span>');
	}
}

function updateCritRateLabel(moveGroupObj, rate) {
	var idSuffix = moveGroupObj.children(".move-crit").attr("id").substr(4);
	updateCritRateLabelById(idSuffix, rate);
}

function updateCritRateLabelById(idSuffix, rate) {
	if (!critRateLabelsVisible()) return;
	var $label = $("#critRate" + idSuffix);
	if (!$label.length) return;
	ensureCritRateLabelStructure($label);
	var value = formatCritRateValue(rate);
	$label.find(".crit-rate-value").text(value);
	$label.toggle(value !== "");
}

function updateCritRateLabelsFromPokemon(p1, p2, p1field, p2field) {
	for (var i = 0; i < 4; i++) {
		updateCritRateLabelById("L" + (i + 1), getCritRate(p1, p2, p1field, p2field, i));
		updateCritRateLabelById("R" + (i + 1), getCritRate(p2, p1, p2field, p1field, i));
	}
}

function setCritCheckbox(moveGroupObj, checked, autoCrit) {
	var crit = moveGroupObj.children(".move-crit");
	crit.data("autoCrit", autoCrit);
	crit.prop("checked", checked).change();
}

function ensureCritRateLabels(showCritPercentages) {
	if (showCritPercentages) {
		$(".move-crit").each(function () {
			var idSuffix = this.id.substr(4);
			var labelId = "critRate" + idSuffix;
			if (!$("#" + labelId).length) {
				$(this).next(".crit-btn").after(critRateLabelHtml(labelId));
			}
		});
	} else {
		$(".crit-rate").remove();
	}
}

function populateCritRateLabels() {
	var p1info = $("#p1");
	var p2info = $("#p2");
	if (!p1info.length || !p2info.length) return;
	var p1 = createPokemon(p1info);
	var p2 = createPokemon(p2info);
	var p1field = createField();
	updateCritRateLabelsFromPokemon(p1, p2, p1field, p1field.clone().swap());
}

function refreshCritRateLabels() {
	var showCritPercentages = critRateLabelsVisible();
	$("body").toggleClass("show-crit-percentages", showCritPercentages);
	ensureCritRateLabels(showCritPercentages);
	if (showCritPercentages) {
		populateCritRateLabels();
	}
}

$(document).on("change", "#showCritPercentages", refreshCritRateLabels);

$(".crit-rate").on("click", function () {
	var suffix = this.id.substr(this.id.length - 2);
	var $crit = $("#crit" + suffix);
	$crit.click();
});

var lockerMove = "";
// auto-update move details on select
$(".move-selector").change(function () {
	var moveName = $(this).val();
	var move = moves[moveName] || moves['(No Move)'];
	var moveGroupObj = $(this).parent();
	moveGroupObj.children(".move-bp").val(moveName === 'Present' ? 40 : move.bp);
	var m = moveName.match(HIDDEN_POWER_REGEX);
	if (m) {
		var pokeObj = $(this).closest(".poke-info");
		var pokemon = createPokemon(pokeObj);
		var actual = calc.Stats.getHiddenPower(GENERATION, pokemon.ivs);
		if (actual.type !== m[1]) {
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (hpIVs && gen < 7) {
				for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
					var legacyStat = LEGACY_STATS[gen][i];
					var stat = legacyStatToStat(legacyStat);
					pokeObj.find("." + legacyStat + " .ivs").val(hpIVs[stat] !== undefined ? hpIVs[stat] : 31);
					pokeObj.find("." + legacyStat + " .dvs").val(hpIVs[stat] !== undefined ? calc.Stats.IVToDV(hpIVs[stat]) : 15);
				}
				if (gen < 3) {
					var hpDV = calc.Stats.getHPDV({
						atk: pokeObj.find(".at .ivs").val(),
						def: pokeObj.find(".df .ivs").val(),
						spe: pokeObj.find(".sp .ivs").val(),
						spc: pokeObj.find(".sa .ivs").val()
					});
					pokeObj.find(".hp .ivs").val(calc.Stats.DVToIV(hpDV));
					pokeObj.find(".hp .dvs").val(hpDV);
				}
				pokeObj.change();
				moveGroupObj.children(".move-bp").val(gen >= 6 ? 60 : 70);
			}
		} else {
			moveGroupObj.children(".move-bp").val(actual.power);
		}
	} else if (gen >= 2 && gen <= 6 && HIDDEN_POWER_REGEX.test($(this).attr('data-prev'))) {
		// If this selector was previously Hidden Power but now isn't, reset all IVs/DVs to max.
		var pokeObj = $(this).closest(".poke-info");
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			pokeObj.find("." + legacyStat + " .ivs").val(31);
			pokeObj.find("." + legacyStat + " .dvs").val(15);
		}
	}
	$(this).attr('data-prev', moveName);
	moveGroupObj.children(".move-type").val(move.type);
	moveGroupObj.children(".move-cat").val(move.category);
	moveGroupObj.children(".move-crit").prop("checked", move.willCrit === true);

	var stat = move.category === 'Special' ? 'spa' : 'atk';
	if (Array.isArray(move.multihit) || (!isNaN(move.multihit) && move.multiaccuracy)) {
		moveGroupObj.children(".move-times").hide();
		moveGroupObj.children(".move-times").val(1);
		moveGroupObj.children(".move-hits").empty();
		if (!isNaN(move.multihit)) {
			for (var i = 1; i <= move.multihit; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		} else {
			for (var i = 1; i <= move.multihit[1]; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		}
		moveGroupObj.children(".move-hits").show();
		var pokemon = $(this).closest(".poke-info");

		var moveHits = 3;
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if (pokemon.find('.ability').val() === 'Skill Link') {
			moveHits = 5;
		} else if (pokemon.find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}

		moveGroupObj.children(".move-hits").val(moveHits);
	} else if (!isNaN(move.multihit)) {
		moveGroupObj.children(".move-hits").val(1);
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".move-times").val(1);
		moveGroupObj.children(".move-times").hide();
	} else {
		moveGroupObj.children(".move-hits").val(1);
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".move-times").show();
	}
	moveGroupObj.children(".move-z").prop("checked", false);
});

$(".item").change(function () {
	var itemName = $(this).val();
	var pokeObj = $(this).closest('.poke-info');

	var $metronomeControl = pokeObj.find('.metronome');
	if (itemName === "Metronome") {
		$metronomeControl.show();
	} else {
		$metronomeControl.hide();
	}

	if (itemName === "Flame Orb") {
		pokeObj.find(".status").val("Burned");
		pokeObj.find(".status").change();
	} else if (itemName === "Toxic Orb") {
		pokeObj.find(".status").val("Badly Poisoned");
		pokeObj.find(".status").change();
	} else if (($(this).attr('data-prev') === "Flame Orb" && pokeObj.find(".status").val() === "Burned") ||
			($(this).attr('data-prev') === "Toxic Orb" && pokeObj.find(".status").val() === "Badly Poisoned")) {
		pokeObj.find(".status").val("Healthy");
		pokeObj.find(".status").change();
	}

	for (var i = 1; i <= 4; i++) {
		var moveSelector = ".move" + i;
		var moveHits = 3;

		var moveName = pokeObj.find(moveSelector).find(".select2-chosen").text();
		var move = moves[moveName] || moves['(No Move)'];
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if (pokeObj.find(".ability").val() === 'Skill Link') {
			moveHits = 5;
		} else if (pokeObj.find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}
		pokeObj.find(moveSelector).find(".move-hits").val(moveHits);
	}

	autosetQP(pokeObj);
	pokeObj.find('.item').attr('data-prev', itemName);
});

function smogonAnalysis(pokemonName) {
	var generation = ["champions", "rb", "gs", "rs", "dp", "bw", "xy", "sm", "ss", "sv"][gen];
	if (pokemonName === "Aegislash-Shield" || pokemonName === "Aegislash-Both") pokemonName = "Aegislash";
	return "https://smogon.com/dex/" + generation + "/pokemon/" + pokemonName.toLowerCase() + "/";
}

function sortmons(a, b) {
	return parseInt(a.split("[")[1].split("]")[0]) - parseInt(b.split("[")[1].split("]")[0])
}

// auto-update set details on select
$(".set-selector").change(function () {
	window.NO_CALC = true;
	var fullSetName = $(this).val();
	var params = new URLSearchParams(window.location.search);
	params.set('mode', $(this).attr("id"));
	var mode = params.get('mode');
	if ($(this).hasClass('opposing')) {
		topPokemonIcon(fullSetName, $("#p2mon")[0])
		CURRENT_TRAINER_POKS = get_trainer_poks(fullSetName)
		var next_poks = CURRENT_TRAINER_POKS.sort(sortmons)
		var trpok_html = ""
		var trpoktag_html = ""
		var pok

		if(($('hardcore').prop('checked'))) 
		{
			if(m === 'brilliantblue') {
				var weatherRR = "clear";
				for (var newWeatherRR in flagsRR.weather) {if (flagsRR.weather[newWeatherRR].includes(CURRENT_TRAINER)) { weatherRR = newWeatherRR; break;} }

				var terrainRR = "none";
				for (var newTerrainRR in flagsRR.terrain){ if (flagsRR.terrain[newTerrainRR].includes(CURRENT_TRAINER)) { terrainRR = newTerrainRR; break; } }

				if (weatherRR) $(`#${weatherRR}`).prop("checked", true).change();
				if (terrainRR) $(`#${terrainRR}`).prop("checked", true).change();
				$('#trickroom').prop("checked", CURRENT_TRAINER == "Leader Sabrina");
				$('#solidRockR').prop("checked", CURRENT_TRAINER == "Leader Brock Rematch");
				$('#tailwindR').prop("checked", CURRENT_TRAINER == "Leader Koga");
				$('#swampR').prop("checked", CURRENT_TRAINER == "Route 22 Rival #2 Bulbasaur");
			}

		} else if ($('brilliantblue').prop('checked')) {
			if(m === 'brilliantblue') {
				var weatherBB = "clear";
				for (var newWeatherBB in flagsBB.weather){ if (flagsBB.weather[newWeatherBB].includes(CURRENT_TRAINER)) { weatherBB = newWeatherBB; break; }}

				var terrainBB = "none";
				for (var newTerrainBB in flagsBB.terrain){ if (flagsBB.terrain[newTerrainBB].includes(CURRENT_TRAINER)) { terrainBB = newTerrainBB; break; }}

				if (weatherBB) $(`#${weatherBB}`).prop("checked", true).change();
				if (terrainBB) $(`#${terrainBB}`).prop("checked", true).change();
			}
		}


		for (i in next_poks) {
			if (next_poks[i][0].includes($('input.opposing').val())) {
				continue
			}
			var pok_name = next_poks[i].split("]")[1].split(" (")[0]
			pok = `<img class="trainer-pok right-side" src="https://raw.githubusercontent.com/KaixerRealNewAcc/sprites/master/${pok_name}.png" data-id="${CURRENT_TRAINER_POKS[i].split("]")[1]}" title="${next_poks[i]}, ${next_poks[i]} BP">`
			if (pok_name == "Zygarde-10%") {
				pok = `<img class="trainer-pok right-side" src="https://raw.githubusercontent.com/KaixerRealNewAcc/sprites/master/Zygarde-Dog.png" data-id="${CURRENT_TRAINER_POKS[i].split("]")[1]}" title="${next_poks[i]}, ${next_poks[i]} BP">`
			}
			if (pok_name.includes("Vivillon")) {
				pok_name = "Vivillon";
			}
			if (pok_name.includes("Pikachu")) {
				pok = `<img class="trainer-pok right-side" src="https://raw.githubusercontent.com/May8th1995/sprites/master/Pikachu.png" data-id="${CURRENT_TRAINER_POKS[i].split("]")[1]}" title="${next_poks[i]}, ${next_poks[i]} BP">`
			}
			if (pok_name.includes("Flapple")) {
				pok = `<img class="trainer-pok right-side" src="https://raw.githubusercontent.com/May8th1995/sprites/master/Flapple.png" data-id="${CURRENT_TRAINER_POKS[i].split("]")[1]}" title="${next_poks[i]}, ${next_poks[i]} BP">`
			}
			if (pok_name.includes("Appletun")) {
				pok = `<img class="trainer-pok right-side" src="https://raw.githubusercontent.com/May8th1995/sprites/master/Appletun.png" data-id="${CURRENT_TRAINER_POKS[i].split("]")[1]}" title="${next_poks[i]}, ${next_poks[i]} BP">`
			}
			if (CURRENT_TRAINER in flagsRR.battleType.trueDouble) {
				$("#doubles-format").prop("checked", true);
				// this ruined my day
				trpok_html += pok
			}
			else
			{
				// this ruined my day
				trpok_html += pok
				$("#singles-format").prop("checked", true);
			}
		}
	} else {
		topPokemonIcon(fullSetName, $("#p1mon")[0])
	}

	$('.trainer-pok-list-opposing').html(trpok_html);
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));
	var pokemon = pokedex[pokemonName];
	if (pokemon) {
		var pokeObj = $(this).closest(".poke-info");
		if (stickyMoves.getSelectedSide() === pokeObj.prop("id")) {
			stickyMoves.clearStickyMove();
		}
		pokeObj.find(".teraToggle").prop("checked", false);
		pokeObj.find(".analysis").attr("href", smogonAnalysis(pokemonName));
		pokeObj.find(".type1").val(pokemon.types[0]);
		pokeObj.find(".type2").val(pokemon.types[1]);
		pokeObj.find(".hp .base").val(pokemon.bs.hp);
		var i;
		for (i = 0; i < LEGACY_STATS[gen].length; i++) {
			pokeObj.find("." + LEGACY_STATS[gen][i] + " .base").val(pokemon.bs[LEGACY_STATS[gen][i]]);
		}
		pokeObj.find(".boost").val(0);
		pokeObj.find(".percent-hp").val(100);
		pokeObj.find(".status").val("Healthy");

		$(".status").change();
		var moveObj;
		var abilityObj = pokeObj.find(".ability");
		var itemObj = pokeObj.find(".item");
		var randset = $("#randoms").prop("checked") ? randdex[pokemonName] : undefined;
		var regSets = pokemonName in setdex && setName in setdex[pokemonName];

		if (randset) {
			var listItems = randdex[pokemonName].items ? randdex[pokemonName].items : [];
			var listAbilities = randdex[pokemonName].abilities ? randdex[pokemonName].abilities : [];
			if (gen >= 3) $(this).closest('.poke-info').find(".ability-pool").show();
			$(this).closest('.poke-info').find(".extraSetAbilities").text(listAbilities.join(', '));
			if (gen >= 2) $(this).closest('.poke-info').find(".item-pool").show();
			$(this).closest('.poke-info').find(".extraSetItems").text(listItems.join(', '));
			if (gen >= 9) {
				$(this).closest('.poke-info').find(".role-pool").show();
				$(this).closest('.poke-info').find(".tera-type-pool").show();
			}
			var listRoles = randdex[pokemonName].roles ? Object.keys(randdex[pokemonName].roles) : [];
			$(this).closest('.poke-info').find(".extraSetRoles").text(listRoles.join(', '));
			var listTeraTypes = [];
			if (randdex[pokemonName].roles) {
				for (var roleName in randdex[pokemonName].roles) {
					var role = randdex[pokemonName].roles[roleName];
					for (var q = 0; q < role.teraTypes.length; q++) {
						if (listTeraTypes.indexOf(role.teraTypes[q]) === -1) {
							listTeraTypes.push(role.teraTypes[q]);
						}
					}
				}
			}
			pokeObj.find(".teraType").val(listTeraTypes[0] || pokemon.types[0]);
			$(this).closest('.poke-info').find(".extraSetTeraTypes").text(listTeraTypes.join(', '));
		} else {
			$(this).closest('.poke-info').find(".ability-pool").hide();
			$(this).closest('.poke-info').find(".item-pool").hide();
			$(this).closest('.poke-info').find(".role-pool").hide();
			$(this).closest('.poke-info').find(".tera-type-pool").hide();
		}
		if (regSets || randset) {
			var set = regSets ? correctHiddenPower(setdex[pokemonName][setName]) : randset;
			if (regSets) {
				pokeObj.find(".teraType").val(set.teraType || pokemon.types[0]);
			}
			pokeObj.find(".level").val(set.level);
			pokeObj.find(".hp .evs").val((set.evs && set.evs.hp !== undefined) ? set.evs.hp : 0);
			pokeObj.find(".hp .ivs").val((set.ivs && set.ivs.hp !== undefined) ? set.ivs.hp : 31);
			pokeObj.find(".hp .dvs").val((set.dvs && set.dvs.hp !== undefined) ? set.dvs.hp : 15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(
					(set.evs && set.evs[LEGACY_STATS[gen][i]] !== undefined) ?
						set.evs[LEGACY_STATS[gen][i]] : ($("#randoms").prop("checked") ? 84 : 0));
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(
					(set.ivs && set.ivs[LEGACY_STATS[gen][i]] !== undefined) ? set.ivs[LEGACY_STATS[gen][i]] : 31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .dvs").val(
					(set.dvs && set.dvs[LEGACY_STATS[gen][i]] !== undefined) ? set.dvs[LEGACY_STATS[gen][i]] : 15);
			}
			setSelectValueIfValid(pokeObj.find(".nature"), set.nature, "Hardy");
			var abilityFallback = (typeof pokemon.abilities !== "undefined") ? pokemon.abilities[0] : "";
			if ($("#randoms").prop("checked")) {
				setSelectValueIfValid(abilityObj, randset.abilities && randset.abilities[0], abilityFallback);
				setSelectValueIfValid(itemObj, randset.items && randset.items[0], "");
			} else {
				setSelectValueIfValid(abilityObj, set.ability, abilityFallback);
				setSelectValueIfValid(itemObj, set.item, "");
			}
			var setMoves = set.moves;
			if (randset) {
				if (gen < 9) {
					setMoves = randset.moves;
				} else {
					setMoves = [];
					for (var role in randset.roles) {
						for (var q = 0; q < randset.roles[role].moves.length; q++) {
							var moveName = randset.roles[role].moves[q];
							if (setMoves.indexOf(moveName) === -1) setMoves.push(moveName);
						}
					}
				}
			}
			var moves = selectMovesFromRandomOptions(setMoves);
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				setSelectValueIfValid(moveObj, moves[i], "(No Move)");
				moveObj.change();
			}
			if (randset) {
				$(this).closest('.poke-info').find(".move-pool").show();
				$(this).closest('.poke-info').find(".extraSetMoves").html(formatMovePool(setMoves));
			}
		} else {
			pokeObj.find(".teraType").val(pokemon.types[0]);
			pokeObj.find(".level").val(100);
			pokeObj.find(".hp .evs").val(0);
			pokeObj.find(".hp .ivs").val(31);
			pokeObj.find(".hp .dvs").val(15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(0);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .dvs").val(15);
			}
			pokeObj.find(".nature").val("Hardy");
			setSelectValueIfValid(abilityObj, pokemon.ab, "");
			itemObj.val("");
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				moveObj.val("(No Move)");
				moveObj.change();
			}
			if ($("#randoms").prop("checked")) {
				$(this).closest('.poke-info').find(".move-pool").hide();
			}
		}
		if (typeof getSelectedTiers === "function") { // doesn't exist when in 1vs1 mode
			var format = getSelectedTiers()[0];
			var is50lvl = startsWith(format, "VGC") || startsWith(format, "Battle Spot");
			//var isDoubles = format === 'Doubles' || has50lvl; *TODO*
			if (format === "LC") pokeObj.find(".level").val(5);
			if (is50lvl) pokeObj.find(".level").val(50);
			//if (isDoubles) field.gameType = 'Doubles'; *TODO*
		}
		var formeObj = $(this).siblings().find(".forme").parent();
		itemObj.prop("disabled", false);
		var baseForme;
		if (pokemon.baseSpecies && pokemon.baseSpecies !== pokemon.name) {
			baseForme = pokedex[pokemon.baseSpecies];
		}
		if (pokemon.otherFormes) {
			showFormes(formeObj, pokemonName, pokemon, pokemonName);
		} else if (baseForme && baseForme.otherFormes) {
			showFormes(formeObj, pokemonName, baseForme, pokemon.baseSpecies);
		} else {
			formeObj.hide();
		}
		calcHP(pokeObj);
		calcStats(pokeObj);
		abilityObj.change();
		itemObj.change();
		if (pokemon.gender === "N") {
			pokeObj.find(".gender").parent().hide();
			pokeObj.find(".gender").val("");
		} else pokeObj.find(".gender").parent().show();
	}
	window.NO_CALC = false;

	if (pokemon && typeof applyAutoStatBoosts === "function") {
		applyAutoStatBoosts($sel.closest(".poke-info"), fullSetName);
	}

});

function formatMovePool(moves) {
	var formatted = [];
	for (var i = 0; i < moves.length; i++) {
		formatted.push(isKnownDamagingMove(moves[i]) ? moves[i] : '<i>' + moves[i] + '</i>');
	}
	return formatted.join(', ');
}

function isKnownDamagingMove(move) {
	var m = GENERATION.moves.get(calc.toID(move));
	return m && m.basePower;
}

function selectMovesFromRandomOptions(moves) {
	var selected = [];

	var nonDamaging = [];
	for (var i = 0; i < moves.length; i++) {
		if (isKnownDamagingMove(moves[i])) {
			selected.push(moves[i]);
			if (selected.length >= 4) break;
		} else {
			nonDamaging.push(moves[i]);
		}
	}

	while (selected.length < 4 && nonDamaging.length) {
		selected.push(nonDamaging.pop());
	}

	return selected;
}

function showFormes(formeObj, pokemonName, pokemon, baseFormeName) {
	var formes = pokemon.otherFormes.slice();
	formes.unshift(baseFormeName);

	var defaultForme = formes.indexOf(pokemonName);
	if (defaultForme < 0) defaultForme = 0;

	var formeOptions = getSelectOptions(formes, false, defaultForme);
	formeObj.children("select").find("option").remove().end().append(formeOptions).change();
	formeObj.show();
}

function stellarButtonsVisibility(pokeObj, vis) {
	var fullSetName = pokeObj.find("input.set-selector").val();
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var moveObjs = [
		pokeObj.find(".move1"),
		pokeObj.find(".move2"),
		pokeObj.find(".move3"),
		pokeObj.find(".move4")
	];
	if (vis && !startsWith(pokemonName, 'Terapagos')) {
		for (var i = 0; i < moveObjs.length; i++) {
			var moveObj = moveObjs[i];
			moveObj.find(".move-stellar").prop("checked", true);
			moveObj.find(".stellar-btn").show();
		}
		return;
	}
	for (var i = 0; i < moveObjs.length; i++) {
		var moveObj = moveObjs[i];
		moveObj.find(".move-stellar").prop("checked", false);
		moveObj.find(".stellar-btn").hide();
	}
}

function setSelectValueIfValid(select, value, fallback) {
	select.val(!value ? fallback : select.children("option[value='" + value + "']").length ? value : fallback);
}

// and the award for worst named function goes to...
function setSetName(setName, arrayOfNames) {
	for (var trainerName of arrayOfNames) {
		if (setName.includes(trainerName)) {
			return trainerName;
		}
	}
	return setName;
}


$(".teraToggle").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	stellarButtonsVisibility(pokeObj, pokeObj.find(".teraType").val() === "Stellar" && this.checked);
	var forme = $(this).parent().siblings().find(".forme");
	var curForme = forme.val();
	if (forme.is(":hidden")) return;
	var container = $(this).closest(".info-group").siblings();
	// Ogerpon and Terapagos mechs
	if (startsWith(curForme, "Ogerpon")) {
		if (
			curForme !== "Ogerpon" && !endsWith(curForme, "Tera") &&
			container.find(".item").val() !== curForme.split("-")[1] + " Mask"
		) return;
		if (this.checked) {
			var newForme = curForme === "Ogerpon" ? "Ogerpon-Teal-Tera" : curForme + "-Tera";
			forme.val(newForme);
			container.find(".ability").val("Embody Aspect (" + newForme.split("-")[1] + ")");
			return;
		}
		if (!endsWith(curForme, "Tera")) return;
		var newForme = curForme === "Ogerpon-Teal-Tera" ? "Ogerpon" : curForme.slice(0, -5);
		forme.val(newForme);
		container.find(".ability").val(pokedex[newForme].abilities[0]);
	} else if (startsWith(curForme, "Terapagos")) {
		if (this.checked) {
			var newForme = "Terapagos-Stellar";

			forme.val(newForme);
			container.find(".ability").val(pokedex[newForme].abilities[0]);

			for (var property in pokedex[newForme].bs) {
				var baseStat = container.find("." + property).find(".base");
				baseStat.val(pokedex[newForme].bs[property]);
				baseStat.keyup();
			}
			return;
		}

		if (!endsWith(curForme, "Stellar")) return;
		var newForme = "Terapagos-Terastal";

		forme.val(newForme);
		container.find(".ability").val(pokedex[newForme].abilities[0]);
		for (var property in pokedex[newForme].bs) {
			var baseStat = container.find("." + property).find(".base");
			baseStat.val(pokedex[newForme].bs[property]);
			baseStat.keyup();
		}
	}
});

$(".forme").change(function () {
	var altForme = pokedex[$(this).val()],
		container = $(this).closest(".info-group").siblings(),
		fullSetName = container.find(".select2-chosen").first().text(),
		pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
		setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));

	$(this).parent().siblings().find(".type1").val(altForme.types[0]);
	$(this).parent().siblings().find(".type2").val(altForme.types[1] ? altForme.types[1] : "");
	genderSelector(gen, altForme.gender, container.parent(), container.parent().find(".gender").val());
	$(this).parent().siblings().find(".analysis").attr("href", smogonAnalysis($(this).val()));
	for (var i = 0; i < LEGACY_STATS[9].length; i++) {
		var baseStat = container.find("." + LEGACY_STATS[9][i]).find(".base");
		baseStat.val(altForme.bs[LEGACY_STATS[9][i]]);
		baseStat.keyup();
	}
	if (
		(startsWith($(this).val(), "Ogerpon") && endsWith($(this).val(), "Tera")) || $(this).val() === "Terapagos-Stellar"
	) {
		$(this).parent().siblings().find(".teraToggle").prop("checked", true);
	}
	var isRandoms = $("#randoms").prop("checked");
	var pokemonSets = isRandoms ? randdex[pokemonName] : setdex[pokemonName];
	var chosenSet = isRandoms && gen < 8 ? pokemonSets : pokemonSets && pokemonSets[setName];
	var greninjaSet = $(this).val().indexOf("Greninja") !== -1;
	var isAltForme = $(this).val() !== pokemonName;
	if (isAltForme && abilities.indexOf(altForme.abilities[0]) !== -1 && !greninjaSet) {
		container.find(".ability").val(altForme.abilities[0]);
	} else if (!isAltForme && abilities.indexOf(altForme.abilities[0]) !== -1 && !greninjaSet) {
		if (chosenSet && (chosenSet.ability || chosenSet.abilities[0])) {
			container.find(".ability").val(isRandoms ? chosenSet.abilities[0] : chosenSet.ability);
		} else {
			container.find(".ability").val(altForme.abilities[0]);
		}
	} else if (greninjaSet) {
		$(this).parent().find(".ability");
	} else if (chosenSet) {
		if (!isRandoms) {
			container.find(".abilities").val(chosenSet.ability);
		} else {
			container.find(".ability").val(chosenSet.abilities[0]);
		}
	}
	var forcedTeraType = getForcedTeraType($(this).val());
	if (forcedTeraType) {
		$(this).parent().siblings().find(".teraType").val(forcedTeraType);
	}
	container.find(".ability").keyup();
	if (startsWith($(this).val(), "Ogerpon-") && !startsWith($(this).val(), "Ogerpon-Teal")) {
		container.find(".item").val($(this).val().split("-")[1] + " Mask").keyup();
	} else {
		container.find(".item").prop("disabled", false);
	}
});

$("#p2 .forme").change(function(e) {
	if (!e.originalEvent) { return; }
	var altForme = pokedex[$(this).val()],
	container = $(this).closest(".info-group").siblings(),
	fullSetName = container.find(".select2-chosen").first().text(),
	pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
	setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));

	var isRandoms = $("#randoms").prop("checked");
	var pokemonSets = isRandoms ? randdex[pokemonName] : setdex[pokemonName];
	var chosenSet = pokemonSets && pokemonSets[setName];

	// console.log(setName); // DEBUG

	// overwrite ability if a mega has forme switched
	if (pokemonName.indexOf("-Mega") !== -1) {
		if (setName.includes("")) {
			setName = "";
		}

		setName = setSetName(setName, ["Rocket Hideout Giovanni"]);

		// console.log(MEGA_BASE_ABILITIES[setName]); // DEBUG

		// if forme is != mega
		if ($(this).val().indexOf("-Mega") === -1) {
			container.find(".ability").val(MEGA_BASE_ABILITIES[setName][pokemonName.split("-Mega")[0]]);
		} else { // if mega form use mega ability
			container.find(".ability").val(chosenSet.ability);
		}
	}
});

function correctHiddenPower(pokemon) {
	// After Gen 7 bottlecaps means you can have a HP without perfect IVs
	// Level 100 is elided from sets so if its undefined its level 100
	if (gen >= 7 && (!pokemon.level || pokemon.level >= 100)) return pokemon;

	// Convert the legacy stats table to a useful one, and also figure out if all are maxed
	var ivs = {};
	var maxed = true;
	for (var i = 0; i <= LEGACY_STATS[9].length; i++) {
		var s = LEGACY_STATS[9][i];
		var iv = ivs[legacyStatToStat(s)] = (pokemon.ivs && typeof pokemon.ivs[s] !== "undefined") ? pokemon.ivs[s] : 31;
		if (iv !== 31) maxed = false;
	}

	var expected = calc.Stats.getHiddenPower(GENERATION, ivs);
	for (var i = 0; i < pokemon.moves.length; i++) {
		var m = pokemon.moves[i].match(HIDDEN_POWER_REGEX);
		if (!m) continue;
		// The Hidden Power type matches the IVs provided so we don't need to do anything else
		if (expected.type === m[1]) {
			continue;
		}
		// The Pokemon has Hidden Power and is not maxed but the types don't match we don't
		// want to attempt to reconcile the user's IVs so instead just correct the HP type
		if (!maxed) {
			pokemon.moves[i] = "Hidden Power " + expected.type;
			continue;
		}
		// Otherwise, use the default preset hidden power IVs that PS would use
		var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
		if (!hpIVs) continue; // some impossible type was specified, ignore
		pokemon.ivs = pokemon.ivs || {hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31};
		pokemon.dvs = pokemon.dvs || {hp: 15, at: 15, df: 15, sa: 15, sd: 15, sp: 15};
		for (var stat in hpIVs) {
			pokemon.ivs[calc.Stats.shortForm(stat)] = hpIVs[stat];
			pokemon.dvs[calc.Stats.shortForm(stat)] = calc.Stats.IVToDV(hpIVs[stat]);
		}
		if (gen < 3) {
			pokemon.dvs.hp = calc.Stats.getHPDV({
				atk: pokemon.ivs.at || 31,
				def: pokemon.ivs.df || 31,
				spe: pokemon.ivs.sp || 31,
				spc: pokemon.ivs.sa || 31
			});
			pokemon.ivs.hp = calc.Stats.DVToIV(pokemon.dvs.hp);
		}
	}
	return pokemon;
}

function createPokemon(pokeInfo) {
	if (typeof pokeInfo === "string") { // in this case, pokeInfo is the id of an individual setOptions value whose moveset's tier matches the selected tier(s)
		var name = pokeInfo.substring(0, pokeInfo.indexOf(" ("));
		var setName = pokeInfo.substring(pokeInfo.indexOf("(") + 1, pokeInfo.lastIndexOf(")"));
		var isRandoms = $("#randoms").prop("checked");
		var isChampions = $("#champions").prop("checked");
		var set = isRandoms ? randdex[name] : setdex[name][setName];

		var ivs = {};
		var evs = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			var stat = legacyStatToStat(legacyStat);

			ivs[stat] = (gen >= 3 && set.ivs && typeof set.ivs[legacyStat] !== "undefined") ? set.ivs[legacyStat] : 31;
			var sps = set.sps;
			if (isChampions) {
				var sps = 0;
				if (set.sps) {
					sps = set.sps[legacyStat] || 0;
				} else {
					sps = set.evs && typeof set.evs[legacyStat] !== "undefined" ? set.evs[legacyStat] : 0;
					if (sps === 4) sps = 1;
					else sps = Math.ceil(sps / 8);
				}
				evs[stat] = sps;
			} else {
				evs[stat] = (set.evs && typeof set.evs[legacyStat] !== "undefined") ? set.evs[legacyStat] : 0;
			}
		}
		var moveNames = set.moves;
		if (isRandoms && (gen !== 8 && gen !== 1)) {
			moveNames = [];
			for (var role in set.roles) {
				for (var q = 0; q < set.roles[role].moves.length; q++) {
					var moveName = set.roles[role].moves[q];
					if (moveNames.indexOf(moveName) === -1) moveNames.push(moveName);
				}
			}
		}

		var pokemonMoves = [];
		for (var i = 0; i < 4; i++) {
			var moveName = moveNames[i];
			pokemonMoves.push(new calc.Move(gen, moves[moveName] ? moveName : "(No Move)", {ability: ability, item: item}));
		}

		if (isRandoms) {
			pokemonMoves = pokemonMoves.filter(function (move) {
				return move.category !== "Status";
			});
		}

		return new calc.Pokemon(gen, name, {
			level: set.level,
			ability: set.ability,
			abilityOn: true,
			item: set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || set.item === "White Herb" || set.item.indexOf("ite") < 0) ? set.item : "",
			gender: set.gender,
			nature: set.nature,
			ivs: ivs,
			evs: evs,
			moves: pokemonMoves
		});
	} else {
		var setName = pokeInfo.find("input.set-selector").val();
		var name;
		if (setName.indexOf("(") === -1) {
			name = setName;
		} else {
			var pokemonName = setName.substring(0, setName.indexOf(" ("));
			var species = pokedex[pokemonName];
			name = (species.otherFormes || (species.baseSpecies && species.baseSpecies !== pokemonName)) ? pokeInfo.find(".forme").val() : pokemonName;
		}

		var baseStats = {};
		var ivs = {};
		var evs = {};
		var boosts = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var stat = legacyStatToStat(LEGACY_STATS[gen][i]);
			baseStats[stat === 'spc' ? 'spa' : stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .base").val();
			ivs[stat] =
				gen == 0 ? 31 : gen > 2 ? ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .ivs").val() : ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .dvs").val() * 2 + 1;
			evs[stat] = gen === 0 ? ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .sps").val() : ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .evs").val();
			boosts[stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .boost").val();
		}
		if (gen === 1) baseStats.spd = baseStats.spa;

		var ability = pokeInfo.find(".ability").val();
		var item = pokeInfo.find(".item").val();
		var gender = pokeInfo.find(".gender").val();
		var isDynamaxed = pokeInfo.find(".max").prop("checked");
		var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
		var opts = {
			ability: ability,
			item: item,
			gender: gender,
			isDynamaxed: isDynamaxed,
			teraType: teraType,
			species: name,
		};
		pokeInfo.isDynamaxed = isDynamaxed;
		calcHP(pokeInfo);
		var curHP = ~~pokeInfo.find(".current-hp").val();
		// FIXME the Pokemon constructor expects non-dynamaxed HP
		if (isDynamaxed) curHP = Math.floor(curHP / 2);
		var types = [pokeInfo.find(".type1").val(), pokeInfo.find(".type2").val()];
		return new calc.Pokemon(gen, name, {
			level: ~~pokeInfo.find(".level").val(),
			ability: ability,
			abilityOn: pokeInfo.find(".abilityToggle").is(":checked"),
			item: item,
			gender: gender,
			nature: pokeInfo.find(".nature").val(),
			ivs: ivs,
			evs: evs,
			isDynamaxed: isDynamaxed,
			alliesFainted: parseInt(pokeInfo.find(".alliesFainted").val()),
			boostedStat: pokeInfo.find(".boostedStat").val() || undefined,
			teraType: teraType,
			boosts: boosts,
			curHP: curHP,
			status: CALC_STATUS[pokeInfo.find(".status").val()],
			toxicCounter: pokeInfo.find(".status").val() === 'Badly Poisoned' ? ~~pokeInfo.find(".toxic-counter").val() : 0,
			moves: [
				getMoveDetails(pokeInfo.find(".move1"), opts),
				getMoveDetails(pokeInfo.find(".move2"), opts),
				getMoveDetails(pokeInfo.find(".move3"), opts),
				getMoveDetails(pokeInfo.find(".move4"), opts),
			],
			overrides: {
				baseStats: baseStats,
				types: types
			}
		});
	}
}

function getGender(gender) {
	if (!gender || gender === 'genderless' || gender === 'N') return 'N';
	if (gender.toLowerCase() === 'male' || gender === 'M') return 'M';
	return 'F';
}

function genderSelector(gen, speciesGender, pokeObj, setGender) {
	if (gen === 1) {
		pokeObj.find(".gender").val("");
		pokeObj.find(".gender").parent().hide();
		return;
	}
	pokeObj.find(".gender").parent().show();
	pokeObj.find(".gender").val(setGender || speciesGender || "");
}

function checkRivalry(ability) {
	if (ability === "Rivalry") {
		$(".gender").each(function () {
			if ($(this).val() === "") $(this).val("M");
		});
		return true;
	}
}

function getMoveDetails(moveInfo, opts) {
	var moveName = moveInfo.find("select.move-selector").val();
	var isZMove = gen > 6 && moveInfo.find("input.move-z").prop("checked");
	var isCrit = moveInfo.find(".move-crit").prop("checked");
	var isStellarFirstUse = moveInfo.find(".move-stellar").prop("checked");
	var hits = +moveInfo.find(".move-hits").val();
	var timesUsed = +moveInfo.find(".move-times").val();
	var timesUsedWithMetronome = moveInfo.find(".metronome").is(':visible') ? +moveInfo.find(".metronome").val() : 1;
	var overrides = {
		basePower: +moveInfo.find(".move-bp").val(),
		type: moveInfo.find(".move-type").val()
	};
	if (moveName === 'Tera Blast') {
		// custom logic for stellar type tera blast
		var isStellar = opts.teraType === 'Stellar';
		var statDrops = moveInfo.find('.move-times');
		var dropsStats = statDrops.is(':visible');
		if (isStellar !== dropsStats) {
			// update stat drop dropdown here
			if (isStellar) statDrops.show(); else statDrops.hide();
		}
		if (isStellar) overrides.self = {boosts: {atk: -1, spa: -1}};
	}
	if (gen >= 4) overrides.category = moveInfo.find(".move-cat").val();
	return new calc.Move(gen, moveName, {
		ability: opts.ability, item: opts.item, useZ: isZMove, species: opts.species, isCrit: isCrit, hits: hits,
		isStellarFirstUse: isStellarFirstUse, timesUsed: timesUsed, timesUsedWithMetronome: timesUsedWithMetronome,
		overrides: overrides, useMax: opts.isDynamaxed
	});
}

function createField() {
	var gameType = $("input:radio[name='format']:checked").val();
	var isBeadsOfRuin = $("#beads").prop("checked");
	var isTabletsOfRuin = $("#tablets").prop("checked");
	var isSwordOfRuin = $("#sword").prop("checked");
	var isVesselOfRuin = $("#vessel").prop("checked");
	var isMagicRoom = $("#magicroom").prop("checked");
	var isWonderRoom = $("#wonderroom").prop("checked");
	var isTrickRoom = $("#trickroom").prop("checked");
	var isGravity = $("#gravity").prop("checked");
	var isSR = [$("#srL").prop("checked"), $("#srR").prop("checked")];
	var weather;
	var spikes;
	if (gen === 2) {
		spikes = [$("#gscSpikesL").prop("checked") ? 1 : 0, $("#gscSpikesR").prop("checked") ? 1 : 0];
		weather = $("input:radio[name='gscWeather']:checked").val();
	} else {
		weather = $("input:radio[name='weather']:checked").val();
		spikes = [~~$("input:radio[name='spikesL']:checked").val(), ~~$("input:radio[name='spikesR']:checked").val()];
	}
	var steelsurge = [$("#steelsurgeL").prop("checked"), $("#steelsurgeR").prop("checked")];
	var vinelash = [$("#vinelashL").prop("checked"), $("#vinelashR").prop("checked")];
	var wildfire = [$("#wildfireL").prop("checked"), $("#wildfireR").prop("checked")];
	var cannonade = [$("#cannonadeL").prop("checked"), $("#cannonadeR").prop("checked")];
	var volcalith = [$("#volcalithL").prop("checked"), $("#volcalithR").prop("checked")];
	var terrain = ($("input:checkbox[name='terrain']:checked").val()) ? $("input:checkbox[name='terrain']:checked").val() : "";
	var isReflect = [$("#reflectL").prop("checked"), $("#reflectR").prop("checked")];
	var isLightScreen = [$("#lightScreenL").prop("checked"), $("#lightScreenR").prop("checked")];
	var isSolidRock = [$("#solidRockL").prop("checked"), $("#solidRockR").prop("checked")];
	var isMagnetRise = [$("#magnetRiseL").prop("checked"), $("#magnetRiseR").prop("checked")];
	var isProtected = [$("#protectL").prop("checked"), $("#protectR").prop("checked")];
	var isSeeded = [$("#leechSeedL").prop("checked"), $("#leechSeedR").prop("checked")];
	var isSaltCured = [$("#saltCureL").prop("checked"), $("#saltCureR").prop("checked")];
	var isForesight = [$("#foresightL").prop("checked"), $("#foresightR").prop("checked")];
	var isHelpingHand = [$("#helpingHandL").prop("checked"), $("#helpingHandR").prop("checked")];
	var isTailwind = [$("#tailwindL").prop("checked"), $("#tailwindR").prop("checked")];
	var isSwamp = [$("#swampL").prop("checked"), $("#swampR").prop("checked")];
	var isFlowerGift = [$("#flowerGiftL").prop("checked"), $("#flowerGiftR").prop("checked")];
	var isPowerTrick = [$("#powerTrickL").prop("checked"), $("#powerTrickR").prop("checked")];
	var isSteelySpirit = [$("#steelySpiritL").prop("checked"), $("#steelySpiritR").prop("checked")];
	var isFriendGuard = [$("#friendGuardL").prop("checked"), $("#friendGuardR").prop("checked")];
	var isAuroraVeil = [$("#auroraVeilL").prop("checked"), $("#auroraVeilR").prop("checked")];
	var isBattery = [$("#batteryL").prop("checked"), $("#batteryR").prop("checked")];
	var isPowerSpot = [$("#powerSpotL").prop("checked"), $("#powerSpotR").prop("checked")];
	// TODO: support switching in as well!
	var isSwitchingOut = [$("#switchingL").prop("checked"), $("#switchingR").prop("checked")];

	var createSide = function (i) {
		return new calc.Side({
			spikes: spikes[i],
			isSR: isSR[i],
			steelsurge: steelsurge[i],
			vinelash: vinelash[i],
			wildfire: wildfire[i],
			cannonade: cannonade[i],
			volcalith: volcalith[i],
			isReflect: isReflect[i],
			isLightScreen: isLightScreen[i],
			isSolidRock: isSolidRock[i],
			isProtected: isProtected[i],
			isSeeded: isSeeded[i],
			isSaltCured: isSaltCured[i],
			isForesight: isForesight[i],
			isTailwind: isTailwind[i],
			isSwamp: isSwamp[i],
			isHelpingHand: isHelpingHand[i],
			isFlowerGift: isFlowerGift[i],
			isPowerTrick: isPowerTrick[i],
			isSteelySpirit: isSteelySpirit[i],
			isFriendGuard: isFriendGuard[i],
			isAuroraVeil: isAuroraVeil[i],
			isBattery: isBattery[i],
			isPowerSpot: isPowerSpot[i],
			isSwitching: isSwitchingOut[i] ? 'out' : undefined
		});
	};
	return new calc.Field({
		gameType: gameType,
		terrain: terrain,
		isBeadsOfRuin: isBeadsOfRuin,
		isTabletsOfRuin: isTabletsOfRuin,
		isSwordOfRuin: isSwordOfRuin,
		isVesselOfRuin: isVesselOfRuin,
		weather: weather,
		isMagicRoom: isMagicRoom,
		isWonderRoom: isWonderRoom,
		isTrickRoom: isTrickRoom,
		isGravity: isGravity,
		attackerSide: createSide(0),
		defenderSide: createSide(1)
	});
}

function calcHP(poke) {
	var total = calcStat(poke, "hp");
	var $maxHP = poke.find(".max-hp");

	var prevMaxHP = Number($maxHP.attr('data-prev')) || total;
	var $currentHP = poke.find(".current-hp");
	var prevCurrentHP = $currentHP.attr('data-set') ? Math.min(Number($currentHP.val()), prevMaxHP) : prevMaxHP;
	// NOTE: poke.find(".percent-hp").val() is a rounded value!
	var prevPercentHP = 100 * prevCurrentHP / prevMaxHP;

	$maxHP.text(total);
	$maxHP.attr('data-prev', total);

	var newCurrentHP = calcCurrentHP(poke, total, prevPercentHP);
	calcPercentHP(poke, total, newCurrentHP);

	$currentHP.attr('data-set', true);
}

function totalEVs(poke) {
	var el = gen === 0 ? ".sps" : ".evs";
	var totalEVs = 0;
	for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
		var statName = LEGACY_STATS[gen][i];
		var stat = poke.find("." + statName);
		var evs = ~~stat.find(el).val();
		totalEVs += evs;
	}
	poke.find(".total" + el.slice(1)).find(el).text(totalEVs);
	return totalEVs;
}

function calcStat(poke, StatID) {
	var stat = poke.find("." + StatID);
	var base = ~~stat.find(".base").val();
	var level = ~~poke.find(".level").val();
	var nature, ivs, evs;
	if (gen === 0) {
		level = 50;
		ivs = 31;
		evs = ~~stat.find(".sps").val();
		if (StatID !== "hp") nature = poke.find(".nature").val();
	} else if (gen < 3) {
		ivs = ~~stat.find(".dvs").val() * 2;
		evs = 252;
	} else {
		ivs = ~~stat.find(".ivs").val();
		evs = ~~stat.find(".evs").val();
		if (StatID !== "hp") nature = poke.find(".nature").val();
	}
	// Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
	var total = calc.calcStat(gen, legacyStatToStat(StatID), base, ivs, evs, level, nature);
	if (gen > 7 && StatID === "hp" && poke.isDynamaxed && total !== 1) {
		total *= 2;
	}
	stat.find(".total").text(total);
	return total;
}

var GENERATION = {
	'1': 1, 'rb': 1, 'rby': 1,
	'2': 2, 'gs': 2, 'gsc': 2,
	'3': 3, 'rs': 3, 'rse': 3, 'frlg': 3, 'adv': 3,
	'4': 4, 'dp': 4, 'dpp': 4, 'hgss': 4,
	'5': 5, 'bw': 5, 'bw2': 5, 'b2w2': 5,
	'6': 6, 'xy': 6, 'oras': 6,
	'7': 7, 'sm': 7, 'usm': 7, 'usum': 7,
	'8': 8, 'ss': 8,
	'9': 9, 'sv': 9
};

var SETDEX = [
	typeof SETDEX_CHAMPIONS === 'undefined' ? {} : SETDEX_CHAMPIONS,
	typeof SETDEX_RBY === 'undefined' ? {} : SETDEX_RBY,
	typeof SETDEX_GSC === 'undefined' ? {} : SETDEX_GSC,
	typeof SETDEX_ADV === 'undefined' ? {} : SETDEX_ADV,
	typeof SETDEX_DPP === 'undefined' ? {} : SETDEX_DPP,
	typeof SETDEX_BW === 'undefined' ? {} : SETDEX_BW,
	typeof SETDEX_XY === 'undefined' ? {} : SETDEX_XY,
	typeof SETDEX_SM === 'undefined' ? {} : SETDEX_SM,
	typeof SETDEX_SS === 'undefined' ? {} : SETDEX_SS,
	typeof SETDEX_SV === 'undefined' ? {} : SETDEX_SV,
];

/*
 * Converts an object that has the hierarchy Format -> Pokemon -> Sets
 * into one that has the hierarchy Pokemon -> Format -> Sets
 * An example for Gen 9 Duraludon would be:
 * {
 *		Randoms: {
 *			...
 *			Duraludon: {...},
 *			...
 *		},
 *		Doubles Randoms: {
 *			...
 *			Duraludon: {...},
 *			...
 *		},
 *		Baby Randoms: {
 *			...
 *			Duraludon: {...},
 *			...
 *		}
 * }
 * getting converted into:
 * {
 *		...
 *		Duraludon: {
 *			Randoms: {...},
 *			Doubles Randoms: {...},
 *			Baby Randoms: {...}
 *		}
 *		...
 * }
 */
function formatRandSets(gen) {
	var combined = {};

	for (var format in gen) {
		var formatSets = gen[format];
		for (var pokemon in formatSets) {
			var sets = formatSets[pokemon];
			if (!(pokemon in combined)) {
				combined[pokemon] = {};
			}
			combined[pokemon][format] = sets;
		}
	}

	return combined;
}

// Creates a single dictionary for Gen 8 & Gen 9 Random Battles formats
var GEN8RANDSETS = formatRandSets({
	"Randoms": typeof GEN8RANDOMBATTLE === 'undefined' ? {} : GEN8RANDOMBATTLE,
	"Doubles Randoms": typeof GEN8RANDOMDOUBLESBATTLE === 'undefined' ? {} : GEN8RANDOMDOUBLESBATTLE,
	"BDSP Randoms": typeof GEN8BDSPRANDOMBATTLE === 'undefined' ? {} : GEN8BDSPRANDOMBATTLE,
});

var GEN9RANDSETS = formatRandSets({
	"Randoms": typeof GEN9RANDOMBATTLE === 'undefined' ? {} : GEN9RANDOMBATTLE,
	"Doubles Randoms": typeof GEN9RANDOMDOUBLESBATTLE === 'undefined' ? {} : GEN9RANDOMDOUBLESBATTLE,
	"Baby Randoms": typeof GEN9BABYRANDOMBATTLE === 'undefined' ? {} : GEN9BABYRANDOMBATTLE,
});

var RANDDEX = [
	{},
	typeof GEN1RANDOMBATTLE === 'undefined' ? {} : GEN1RANDOMBATTLE,
	typeof GEN2RANDOMBATTLE === 'undefined' ? {} : GEN2RANDOMBATTLE,
	typeof GEN3RANDOMBATTLE === 'undefined' ? {} : GEN3RANDOMBATTLE,
	typeof GEN4RANDOMBATTLE === 'undefined' ? {} : GEN4RANDOMBATTLE,
	typeof GEN5RANDOMBATTLE === 'undefined' ? {} : GEN5RANDOMBATTLE,
	typeof GEN6RANDOMBATTLE === 'undefined' ? {} : GEN6RANDOMBATTLE,
	typeof GEN7RANDOMBATTLE === 'undefined' ? {} : GEN7RANDOMBATTLE,
	GEN8RANDSETS,
	GEN9RANDSETS,
];

var gen, genWasChanged, notation, pokedex, setdex, flagsRR, flagsBB, randdex, typeChart, moves, abilities, items, calcHP, calcStat, GENERATION;

TR_NAMES = get_trainer_names()

$(".gen").change(function () {
	/*eslint-disable */
	gen = ~~$(this).val() || 9;
	GENERATION = calc.Generations.get(gen);
	var params = new URLSearchParams(window.location.search);
	if (gen === 9) {
		params.delete('gen');
		params = '' + params;
		if (window.history && window.history.replaceState) {
			window.history.replaceState({}, document.title, window.location.pathname + (params.length ? '?' + params : ''));
		}
	} else {
		params.set('gen', gen);
		if (window.history && window.history.pushState) {
			params.sort();
			var path = window.location.pathname + '?' + params;
			window.history.pushState({}, document.title, path);
			gtag('config', 'UA-26211653-3', {'page_path': path});
		}
	}
	genWasChanged = true;
	/* eslint-enable */
	// declaring these variables with var here makes z moves not work; TODO
	pokedex = calc.SPECIES[gen];
	setdex = SETDEX[gen];
	randdex = RANDDEX[gen];
	flagsRR = FLAGS_RR;
	flagsBB = FLAGS_BB;
	typeChart = calc.TYPE_CHART[gen];
	moves = calc.MOVES[gen];
	items = calc.ITEMS[gen];
	abilities = calc.ABILITIES[gen];
	clearField();
	$("#importedSets").prop("checked", false);
	loadDefaultLists();
	$(".gen-specific.g" + gen).show();
	$(".gen-specific").not(".g" + gen).hide();
	$("input:radio[name='format']").change();
	var typeOptions = getSelectOptions(Object.keys(typeChart));
	$("select.type1, select.move-type").find("option").remove().end().append(typeOptions);
	$("select.teraType").find("option").remove().end().append(getSelectOptions(Object.keys(typeChart).slice(1)));
	$("select.type2").find("option").remove().end().append("<option value=\"\">(none)</option>" + typeOptions);
	var moveOptions = getSelectOptions(Object.keys(moves), true);
	$("select.move-selector").find("option").remove().end().append(moveOptions);
	var abilityOptions = getSelectOptions(abilities, true);
	$("select.ability").find("option").remove().end().append("<option value=\"\">(other)</option>" + abilityOptions);
	var itemOptions = getSelectOptions(items, true);
	$("select.item").find("option").remove().end().append("<option value=\"\">(none)</option>" + itemOptions);

	selectTrainer(1);
	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
});

function getFirstValidSetOption() {
	var sets = getSetOptions();
	// NB: The first set is never valid, so we start searching after it.
	for (var i = 1; i < sets.length; i++) {
		if (sets[i].id && sets[i].id.indexOf('(Blank Set)') === -1) return sets[i];
	}
	return undefined;
}

$(".notation").change(function () {
	notation = $(this).val();
});

function clearField() {
	$("#singles-format").prop("checked", true);
	$("#clear").prop("checked", true);
	$("#gscClear").prop("checked", true);
	$("#magicroom").prop("checked", false);
	$("#wonderroom").prop("checked", false);
	$("#gravity").prop("checked", false);
	$("#srL").prop("checked", false);
	$("#srR").prop("checked", false);
	$("#spikesL0").prop("checked", true);
	$("#spikesR0").prop("checked", true);
	$("#gscSpikesL").prop("checked", false);
	$("#gscSpikesR").prop("checked", false);
	$("#steelsurgeL").prop("checked", false);
	$("#steelsurgeR").prop("checked", false);
	$("#vinelashL").prop("checked", false);
	$("#vinelashR").prop("checked", false);
	$("#wildfireL").prop("checked", false);
	$("#wildfireR").prop("checked", false);
	$("#cannonadeL").prop("checked", false);
	$("#cannonadeR").prop("checked", false);
	$("#volcalithL").prop("checked", false);
	$("#volcalithR").prop("checked", false);
	$("#reflectL").prop("checked", false);
	$("#reflectR").prop("checked", false);
	$("#lightScreenL").prop("checked", false);
	$("#lightScreenR").prop("checked", false);
	$('#solidRockL').prop("checked", false);
	$('#solidRockR').prop("checked", false);
	$("#protectL").prop("checked", false);
	$("#protectR").prop("checked", false);
	$("#leechSeedL").prop("checked", false);
	$("#leechSeedR").prop("checked", false);
	$("#flowerGiftL").prop("checked", false);
	$("#flowerGiftR").prop("checked", false);
	$("#powerTrickL").prop("checked", false);
	$("#powerTrickR").prop("checked", false);
	$("#steelySpiritL").prop("checked", false);
	$("#steelySpiritR").prop("checked", false);
	$("#saltCureL").prop("checked", false);
	$("#saltCureR").prop("checked", false);
	$("#foresightL").prop("checked", false);
	$("#foresightR").prop("checked", false);
	$("#helpingHandL").prop("checked", false);
	$("#helpingHandR").prop("checked", false);
	$("#tailwindL").prop("checked", false);
	$("#tailwindR").prop("checked", false);
	$("#swampL").prop("checked", false);
	$("#swampR").prop("checked", false);
	$("#friendGuardL").prop("checked", false);
	$("#friendGuardR").prop("checked", false);
	$("#auroraVeilL").prop("checked", false);
	$("#auroraVeilR").prop("checked", false);
	$("#batteryL").prop("checked", false);
	$("#batteryR").prop("checked", false);
	$("#powerSpotL").prop("checked", false);
	$("#powerSpotR").prop("checked", false);
	$("#switchingL").prop("checked", false);
	$("#switchingR").prop("checked", false);
	$("input:checkbox[name='terrain']").prop("checked", false);
}

function getSetOptions(sets) {
	var setsHolder = sets;
	if (setsHolder === undefined) {
		setsHolder = pokedex;
	}
	var pokeNames = Object.keys(setsHolder);
	pokeNames.sort();
	var setOptions = [];
	for (var i = 0; i < pokeNames.length; i++) {
		var pokeName = pokeNames[i];
		setOptions.push({
			pokemon: pokeName,
			text: pokeName
		});
		if ($("#randoms").prop("checked")) {
			if (pokeName in randdex) {
				if (gen >= 8) {
					// The Gen 8 and 9 randdex contains information for multiple Random Battles formats for each Pokemon.
					// Duraludon, for example, has data for Randoms, Doubles Randoms, and Baby Randoms.
					// Therefore, all of this information has to be populated within the set options.
					var randTypes = Object.keys(randdex[pokeName]);
					for (var j = 0; j < randTypes.length; j++) {
						var rand = randTypes[j];
						setOptions.push({
							pokemon: pokeName + (rand === "Randoms" ? "" : " (" + rand.split(' ')[0] + ")"),
							set: rand + ' Set',
							text: pokeName + " (" + rand + ")",
							id: pokeName + " (" + rand + ")"
						});
					}
				} else {
					setOptions.push({
						pokemon: pokeName,
						set: 'Randoms Set',
						text: pokeName + " (Randoms)",
						id: pokeName + " (Randoms)"
					});
				}
			}
		} else {
			if (pokeName in setdex) {
				var setNames = Object.keys(setdex[pokeName]);
				for (var j = 0; j < setNames.length; j++) {
					var setName = setNames[j];
					setOptions.push({
						pokemon: pokeName,
						set: setName,
						text: pokeName + " (" + setName + ")",
						id: pokeName + " (" + setName + ")",
						isCustom: setdex[pokeName][setName].isCustomSet,
						nickname: setdex[pokeName][setName].nickname || ""
					});
				}
			}
			setOptions.push({
				pokemon: pokeName,
				set: "Blank Set",
				text: pokeName + " (Blank Set)",
				id: pokeName + " (Blank Set)"
			});
		}
	}
	return setOptions;
}

function getSelectOptions(arr, sort, defaultOption) {
	if (sort) {
		arr.sort();
	}
	var r = '';
	for (var i = 0; i < arr.length; i++) {
		r += '<option value="' + arr[i] + '" ' + (defaultOption === i ? 'selected' : '') + '>' + arr[i] + '</option>';
	}
	return r;
}

var stickyWeather = (function () {
	var lastClicked = '';
	$(".weather").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-weather");
		} else {
			$('.locked-weather').removeClass('locked-weather');
		}
		lastClicked = this.id;
	});

	return {
		clearStickyWeather: function () {
			lastClicked = null;
			$('.locked-weather').removeClass('locked-weather');
		}
	};
})();

var stickyMoves = (function () {
	var lastClicked = 'resultMoveL1';
	$(".result-move").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-move");
		} else {
			$('.locked-move').removeClass('locked-move');
		}
		lastClicked = this.id;
	});

	return {
		clearStickyMove: function () {
			lastClicked = null;
			$('.locked-move').removeClass('locked-move');
		},
		setSelectedMove: function (slot) {
			lastClicked = slot;
		},
		getSelectedSide: function () {
			if (lastClicked) {
				if (lastClicked.indexOf('resultMoveL') !== -1) {
					return 'p1';
				} else if (lastClicked.indexOf('resultMoveR') !== -1) {
					return 'p2';
				}
			}
			return null;
		}
	};
})();

function isPokeInfoGrounded(pokeInfo) {
	var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
	return $("#gravity").prop("checked") || (
		  teraType ? teraType !== "Flying" : pokeInfo.find(".type1").val() !== "Flying" &&
        teraType ? teraType !== "Flying" : pokeInfo.find(".type2").val() !== "Flying" &&
        pokeInfo.find(".ability").val() !== "Levitate" &&
        pokeInfo.find(".item").val() !== "Air Balloon"
	);
}

function getTerrainEffects() {
	var className = $(this).prop("className");
	className = className.substring(0, className.indexOf(" "));
	switch (className) {
	case "type1":
	case "type2":
	case "teraType":
	case "teraToggle":
	case "item":
		var id = $(this).closest(".poke-info").prop("id");
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#" + id).find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#" + id)));
		} else if (terrainValue === "Misty") {
			$("#" + id).find(".status").prop("disabled", isPokeInfoGrounded($("#" + id)));
		}
		break;
	case "ability":
		// with autoset, ability change may cause terrain change, need to consider both sides
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if (terrainValue === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	default:
		$("input:checkbox[name='terrain']").not(this).prop("checked", false);
		if ($(this).prop("checked") && $(this).val() === "Electric") {
			// need to enable status because it may be disabled by Misty Terrain before.
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if ($(this).prop("checked") && $(this).val() === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	}
}

function loadDefaultLists() {
    $(".set-selector").select2({
        formatResult: function (object) {
            if ($("#randoms").prop("checked")) {
                return object.pokemon;
            } else {
                return object.set ? ("&nbsp;&nbsp;&nbsp;" + object.set) : ("<b>" + object.text + "</b>");
            }
        },
        query: function (query) {
            var pageSize = 30;
            var results = [];
            var options = getSetOptions();
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var pokeName = option.pokemon.toUpperCase();
                var setName = option.set ? option.set.toUpperCase() : "";
                var tokens = query.term ? query.term.toUpperCase().split(" ") : [];
                var matchesPoke = !tokens.length || tokens.every(function (term) {
                    return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0 || pokeName.indexOf(" " + term) >= 0;
                });
                var matchesSet = !!option.set && tokens.length && tokens.every(function (term) {
                    return setName.indexOf(term) === 0 || setName.indexOf("-" + term) >= 0 || setName.indexOf(" " + term) >= 0;
                });
                if (!query.term || matchesPoke || matchesSet) {
                    if ($("#randoms").prop("checked")) {
                        if (option.id) results.push(option);
                    } else {
                        results.push(option);
                    }
                }
            }
            // If searching, deduplicate by set name when matching by set (trainer/party), and pick the first mon (smallest index)
            if (query.term && !$("#randoms").prop("checked")) {
                var tokens = query.term.toUpperCase().split(" ");
                var bySetBest = {};
                var seenBestId = {};
                for (var r = 0; r < results.length; r++) {
                    var opt = results[r];
                    var setNameUpper = opt.set ? opt.set.toUpperCase() : "";
                    if (!opt.set || setNameUpper === "BLANK SET") continue; // don't dedupe headers or Blank Set
                    var matchesSet = tokens.every(function (term) {
                        return setNameUpper.indexOf(term) === 0 || setNameUpper.indexOf("-" + term) >= 0 || setNameUpper.indexOf(" " + term) >= 0;
                    });
                    if (!matchesSet) continue;
                    var idx = Infinity;
                    try {
                        if (window.setdex && setdex[opt.pokemon] && setdex[opt.pokemon][opt.set] && typeof setdex[opt.pokemon][opt.set].index !== 'undefined') {
                            idx = setdex[opt.pokemon][opt.set].index;
                        }
                    } catch (e) { /* ignore lookup issues */ }
                    if (!(setNameUpper in bySetBest) || idx < bySetBest[setNameUpper].idx) {
                        bySetBest[setNameUpper] = { idx: idx, option: opt };
                    }
                }
                if (Object.keys(bySetBest).length) {
                    var filtered = [];
                    var chosenIds = {};
                    for (var r2 = 0; r2 < results.length; r2++) {
                        var opt2 = results[r2];
                        if (opt2.set) {
                            var setUpper = opt2.set.toUpperCase();
                            if (bySetBest[setUpper]) {
                                var bestOpt = bySetBest[setUpper].option;
                                if (!chosenIds[setUpper]) {
                                    filtered.push(bestOpt);
                                    chosenIds[setUpper] = true;
                                }
                                // skip additional entries for this set
                                continue;
                            }
                        }
                        // keep non-set matches and headers as-is
                        filtered.push(opt2);
                    }
                    results = filtered;
                }
            }
            query.callback({
                results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
                more: results.length >= query.page * pageSize
            });
        },
        initSelection: function (element, callback) {
            callback(getFirstValidSetOption());
        }
    });
}


function allPokemon(selector) {
	var allSelector = "";
	for (var i = 0; i < $(".poke-info").length; i++) {
		if (i > 0) {
			allSelector += ", ";
		}
		allSelector += "#p" + (i + 1) + " " + selector;
	}
	return allSelector;
}

function loadCustomList(id) {
	$("#" + id + " .set-selector").select2({
		formatResult: function (set) {
			return (set.nickname ? set.pokemon + " (" + set.nickname + ")" : set.id);
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				var setName = option.set ? option.set.toUpperCase() : option.set;
				if (option.isCustom && option.set && (!query.term || query.term.toUpperCase().split(" ").every(function (term) {
					return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0 || pokeName.indexOf(" " + term) >= 0 || setName.indexOf(term) === 0 || setName.indexOf("-" + term) >= 0 || setName.indexOf(" " + term) >= 0;
				}))) {
					results.push(option);
				}
			}
			query.callback({
				results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
				more: results.length >= query.page * pageSize
			});
		},
		initSelection: function (element, callback) {
			var data = "";
			callback(data);
		}
	});
}

function get_trainer_names() {
	var all_poks = SETDEX_SV
	var trainer_names = []

	for (const [pok_name, poks] of Object.entries(all_poks)) {
		var pok_tr_names = Object.keys(poks)
		var monName = pok_name;
		if (monName.includes("Vivillon")) { monName = "Vivillon"; }
		for (i in pok_tr_names) {
			var index = (poks[pok_tr_names[i]]["index"])
			var trainer_name = pok_tr_names[i]
			trainer_names.push(`[${index}]${monName} (${trainer_name})`)
		}
	}
	return trainer_names
}
function addBoxed(poke) {
	if (document.getElementById(`${poke.name}${poke.nameProp}`)) {
		//nothing to do it already exist
		return
	}
	var newPoke = document.createElement("img");
	newPoke.id = `${poke.name}${poke.nameProp}`
	newPoke.className = "trainer-pok left-side";
	newPoke.src = getSrcImgPokemon(poke);
	newPoke.dataset.id = `${poke.name} (${poke.nameProp})`
	newPoke.addEventListener("dragstart", dragstart_handler);
	$('#box-poke-list')[0].appendChild(newPoke);
}



function getSrcImgPokemon(poke) {
	//edge case
	if (!poke) {
		return
	}
	if (poke.name == "Aegislash-Shield") {
		return `https://raw.githubusercontent.com/May8th1995/sprites/master/Aegislash.png`
	}
	else if (poke.name == "Pikachu-Flying" || poke.name == "Pikachu-Surfing") {
		return `https://raw.githubusercontent.com/May8th1995/sprites/master/Pikachu.png`
	} else {
		return `https://raw.githubusercontent.com/KaixerRealNewAcc/sprites/master/${poke.name}.png`
	}
}

function getPokemonSprite(poke) {
	//edge case
	if (!poke) {
		return
	}
	if (poke.name == "Aegislash-Shield") {
		return `https://play.pokemonshowdown.com/sprites/gen5/aegislash.png`
	} else {
		return `<img class="mon-sprite" src="https://raw.githubusercontent.com/May8th1995/sprites/master/${poke.name}.png"`
	}
}

function get_trainer_poks(trainer_name, ignore_trainer_name) {
	var true_name = trainer_name.split("(")[1].split("\n")[0].trim()
	window.CURRENT_TRAINER = true_name.substring(0, true_name.length -1);

	var matches = []
	for (i in TR_NAMES) {
		if (TR_NAMES[i].includes(true_name)) {
			matches.push(TR_NAMES[i])
		}
	}

	return matches
}

function topPokemonIcon(fullname, node) {
	var mon = { name: fullname.split(" (")[0] };
	var src = getSrcImgPokemon(mon);
	node.src = src;
}

function PokemonSprite(fullname, node) {
	var mon = { name: fullname.split(" (")[0] };
	var src = getPokemonSprite(mon);
	node.src = src;
}

$(document).on('click', '.right-side', function () {
	var set = $(this).attr('data-id');
	PokemonSprite(set, $("#p2mon")[0])
	topPokemonIcon(set, $("#p2mon")[0])
	$('.opposing').val(set);
	$('.opposing').change();
	$('.opposing .select2-chosen').text(set);

	if (typeof applyBattleSettings === 'function') {
		applyBattleSettings(get_trainer_names(set));
	}
})

$(document).on('click', '.left-side', function () {
	var set = $(this).attr('data-id');
	topPokemonIcon(set, $("#p1mon")[0])
	$('.player').val(set);
	$('.player').change();
	$('.player .select2-chosen').text(set);
	if (typeof applyBattleSettings === "function") {
		applyBattleSettings(get_trainer_names(set));
	}
})

//select first mon of the box when loading
function selectFirstMon() {
	var pMons = document.getElementsByClassName("trainer-pok left-side");
	let set = pMons[i].getAttribute("data-id");
	$('.player').val(set);
	$('.player').change();
	$('.player .select2-chosen').text(set);
}

function selectTrainer(value) {
	localStorage.setItem("lasttimetrainer", value);
	all_poks = SETDEX_SV
	for (const [pok_name, poks] of Object.entries(all_poks)) {
		var pok_tr_names = Object.keys(poks)
		for (i in pok_tr_names) {
			var index = (poks[pok_tr_names[i]]["index"])
			if (index == value) {
				var set = `${pok_name} (${pok_tr_names[i]})`;
				$('.opposing').val(set);
				$('.opposing').change();
				$('.opposing .select2-chosen').text(set);
			}
		}
	}
}

function nextTrainer() {
	string = ($(".trainer-pok-list-opposing")).html();
	initialSplit = string.split("[")
	value = parseInt(initialSplit[initialSplit.length - 2].split("]")[0]) + 1
	selectTrainer(value)
}

function previousTrainer() {
	string = ($(".trainer-pok-list-opposing")).html();
	value = parseInt(string.split("]")[0].split("[")[1]) - 1;
	selectTrainer(value)
}

function resetTrainer() {
	if (confirm(`Are you sure you want to reset? This will clear all imported sets and change your current trainer back to Rival #1. This cannot be undone.`)){
		selectTrainer(1);
		localStorage.removeItem("customsets");
		$(allPokemon("#importedSetsOptions")).hide();
		loadDefaultLists();
		for (let zone of document.getElementsByClassName("dropzone")){
			zone.innerHTML="";
		}
	}
	
}

function HideShowCCSettings(){
	$('#show-cc')[0].toggleAttribute("hidden");
	$('#hide-cc')[0].toggleAttribute("hidden");
	$('#refr-cc')[0].toggleAttribute("hidden");
	$('#info-cc')[0].toggleAttribute("hidden");
	$('#cc-sets')[0].toggleAttribute("hidden");
}

function colorCodeUpdate(){
	var speCheck = document.getElementById("cc-spe-border").checked;
	var ohkoCheck = document.getElementById("cc-ohko-color").checked;
	if (!speCheck && !ohkoCheck){
		return
	}
	var pMons = document.getElementsByClassName("trainer-pok left-side");
	// i calc here to alleviate some calculation
	var p2info = $("#p2");
	var p2 = createPokemon(p2info);
	for (let i = 0; i < pMons.length; i++) {
		let set = pMons[i].getAttribute("data-id");
		let idColor = calculationsColors(set, p2);
		if (speCheck && ohkoCheck){
			pMons[i].className = `trainer-pok left-side mon-speed-${idColor.speed} mon-dmg-${idColor.code}`;
		}
		else if (speCheck){
			pMons[i].className = `trainer-pok left-side mon-speed-${idColor.speed}`;
		}
		else if (ohkoCheck){
			pMons[i].className = `trainer-pok left-side mon-dmg-${idColor.code}`;
		}
		
		
	}
}
function showColorCodes(){
	colorCodeUpdate();
	HideShowCCSettings();
}

function refreshColorCode(){
	colorCodeUpdate();
}

function hideColorCodes(){
	var pMons = document.getElementsByClassName("trainer-pok left-side");
	for (let i = 0; i < pMons.length; i++) {
		pMons[i].className = "trainer-pok left-side";
	}
	document.getElementById("cc-auto-refr").checked = false;
	HideShowCCSettings();
}

function toggleInfoColorCode(){
	document.getElementById("info-cc-field").toggleAttribute("hidden");
}

function TrashPokemon() {
	var maybeMultiple = document.getElementById("trash-box").getElementsByClassName("trainer-pok");
	if (maybeMultiple.length == 0){
		return; //nothing to delete
	}
	var numberPKM = maybeMultiple.length > 1 ? `${maybeMultiple.length} Pokemon(s)` : "this Pokemon"; 
	var yes = confirm(`do you really want to remove ${numberPKM}?`);
	if (!yes) {
		return;
	}
	var customSets = JSON.parse(localStorage.customsets);
	var length= maybeMultiple.length;
	for( let i = 0; i<length; i++){
		var pokeTrashed = maybeMultiple[i];
		var name = pokeTrashed.getAttribute("data-id").split(" (")[0];
		delete customSets[name];
	}
	document.getElementById("trash-box").innerHTML="";
	localStorage.setItem("customsets", JSON.stringify(customSets));
	$('#box-poke-list')[0].click();
	//switch to the next pokemon automatically
	
}
function RemoveAllPokemon() {
	document.getEle
}
function allowDrop(ev) {
	ev.preventDefault();
}

var pokeDragged = null;
function dragstart_handler(ev) {
	pokeDragged = ev.target;
}

function drop(ev) {
	ev.preventDefault();
	if (ev.target.classList.contains("dropzone")) {
		pokeDragged.parentNode.removeChild(pokeDragged);
		ev.target.appendChild(pokeDragged);	
	}
	// if it's a pokemon
	else if(ev.target.classList.contains("left-side")) {
		//And if a sibling switch them
		if(ev.target.parentNode == pokeDragged.parentNode){
			let prev1 = ev.target.previousSibling || ev.target;
			let prev2 = pokeDragged.previousSibling || pokeDragged;

			prev1.after(pokeDragged);
			prev2.after(ev.target);
		}
		//if not just append to the box it belongs
		else{
			let prev1 = ev.target.previousSibling || ev.target;
			prev1.after(pokeDragged);
		}
	}
	ev.target.classList.remove('over');
}

function handleDragEnter(ev) {
	ev.target.classList.add('over');
}

function handleDragLeave(ev) {
	ev.target.classList.remove('over');
}

function SpeedBorderSetsChange(ev){
	var monImgs = document.getElementsByClassName("left-side");
	if (ev.target.checked){
		for (let monImg of monImgs){
			monImg.classList.remove("mon-speed-none")
		}
	}else{
		for (let monImg of monImgs){
			monImg.classList.add("mon-speed-none")
		}
	}
}

function ColorCodeSetsChange(ev){
	var monImgs = document.getElementsByClassName("left-side");
	if (ev.target.checked){
		for (let monImg of monImgs){
			monImg.classList.remove("mon-dmg-none")
		}
	}else{
		for (let monImg of monImgs){
			monImg.classList.add("mon-dmg-none")
		}
	}
}

/* although those two function could be factorised in one, i may think about more in depth 
functionality laters that may involve two separate functions, i will remove this comment if i do*/
function switchIconSingle(){
	document.getElementById("monDouble").toggleAttribute("hidden")
}

function switchIconDouble(){
	document.getElementById("monDouble").toggleAttribute("hidden")
}


$(document).ready(function () {
	var params = new URLSearchParams(window.location.search);
	var g = GENERATION[params.get('gen')] || 9;
	if ($("#champions").prop("checked")) {
		/* eslint-disable */
		g = 0;
		gen = 0;
		GENERATION = calc.Generations.get(gen);
		/* eslint-enable */
		pokedex = calc.SPECIES[gen];
		setdex = SETDEX[gen];
		typeChart = calc.TYPE_CHART[gen];
		moves = calc.MOVES[gen];
		items = calc.ITEMS[gen];
		abilities = calc.ABILITIES[gen];
		clearField();
		$("#importedSets").prop("checked", false);
		loadDefaultLists();
		$("input:radio[name='format']").change();
		var typeOptions = getSelectOptions(Object.keys(typeChart));
		$("select.type1, select.move-type").find("option").remove().end().append(typeOptions);
		$("select.type2").find("option").remove().end().append("<option value=\"\">(none)</option>" + typeOptions);
		var moveOptions = getSelectOptions(Object.keys(moves), true);
		$("select.move-selector").find("option").remove().end().append(moveOptions);
		var abilityOptions = getSelectOptions(abilities, true);
		$("select.ability").find("option").remove().end().append("<option value=\"\">(other)</option>" + abilityOptions);
		var itemOptions = getSelectOptions(items, true);
		$("select.item").find("option").remove().end().append("<option value=\"\">(none)</option>" + itemOptions);

		$(".set-selector").val(getFirstValidSetOption().id);
		$(".set-selector").change();
	}
	$("#gen" + g).prop("checked", true);
	$("#gen" + g).change();
	$("#percentage").prop("checked", true);
	$("#percentage").change();
	$("#singles-format").prop("checked", true);
	$("#singles-format").change();
	$("#default-level-100").prop("checked", true);
	$("#default-level-100").change();
	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
	$(".terrain-trigger").bind("change keyup", getTerrainEffects);
	$("#previous-trainer").click(previousTrainer);
	$("#next-trainer").click(nextTrainer);
	$("#reset-trainer").click(resetTrainer)
	$('#show-cc').click(showColorCodes);
	$('#hide-cc').click(hideColorCodes);
	$('#refr-cc').click(refreshColorCode);
	$('#info-cc').click(toggleInfoColorCode);
	$('#trash-pok').click(TrashPokemon);
	$('#cc-spe-border').change(SpeedBorderSetsChange);
	$('#cc-ohko-color').change(ColorCodeSetsChange);
	$('#cc-spe-border')[0].checked=true;
	$('#cc-ohko-color')[0].checked=true;
	$('#singles-format').click(switchIconDouble);
	$('#doubles-format').click(switchIconSingle);
	for (let dropzone of document.getElementsByClassName("dropzone")){
		dropzone.ondragenter=handleDragEnter;
		dropzone.ondragleave=handleDragLeave;
		dropzone.ondrop=drop;
		dropzone.ondragover=allowDrop;
	}

	var BATTLE_NOTES_VISIBLE_KEY = "battle-notes-visible";
	var BATTLE_NOTES_TEXT_KEY = "battle-notes-text";
	var battleNotesToggle = document.getElementById("battle-notes-toggle");
	var battleNotesPanel = document.getElementById("battle-notes-panel");
	var battleNotesTextarea = document.getElementById("battle-notes-textarea");
	function syncBattleNotesVisibility() {
		if (!battleNotesToggle || !battleNotesPanel) return;
		var on = battleNotesToggle.checked;
		battleNotesPanel.hidden = !on;
		battleNotesPanel.setAttribute("aria-hidden", on ? "false" : "true");
		localStorage.setItem(BATTLE_NOTES_VISIBLE_KEY, on ? "1" : "0");
	}
	if (battleNotesToggle && battleNotesPanel) {
		battleNotesToggle.checked = localStorage.getItem(BATTLE_NOTES_VISIBLE_KEY) === "1";
		syncBattleNotesVisibility();
		battleNotesToggle.addEventListener("change", syncBattleNotesVisibility);
	}
	if (battleNotesTextarea) {
		var savedNotes = localStorage.getItem(BATTLE_NOTES_TEXT_KEY);
		if (savedNotes !== null && savedNotes !== "") {
			battleNotesTextarea.value = savedNotes;
		}
		battleNotesTextarea.addEventListener(
			"input",
			function () {
				localStorage.setItem(BATTLE_NOTES_TEXT_KEY, battleNotesTextarea.value);
			},
			{ passive: true }
		);
	}

	loadDefaultLists();
	$(".move-selector").select2({
		dropdownAutoWidth: true,
		matcher: function (term, text) {
			// 2nd condition is for Hidden Power
			return text.toUpperCase().indexOf(term.toUpperCase()) === 0 || text.toUpperCase().indexOf(" " + term.toUpperCase()) >= 0;
		}
	});
	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
	$(".terrain-trigger").bind("change keyup", getTerrainEffects);

	//select last trainer
	var last = localStorage.getItem("lasttimetrainer");
	if (last != null && last !== "") {
		var t = parseInt(last, 10);
		if (!isNaN(t)) selectTrainer(t);
	}
});

/* Click-to-copy function */
$("#mainResult").click(function () {
	navigator.clipboard.writeText($("#mainResult").text()).then(function () {
		document.getElementById('tooltipText').style.visibility = 'visible';
		setTimeout(function () {
			document.getElementById('tooltipText').style.visibility = 'hidden';
		}, 1500);
	});
});
