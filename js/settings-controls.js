SETTINGS = {
    starter_type: "Grass",
};

function saveSettings() {
    localStorage.settings = JSON.stringify(SETTINGS);
}

$(document).ready(function() {
    if (!localStorage.settings) {
        saveSettings();
    }
    SETTINGS = {...SETTINGS, ...JSON.parse(localStorage.settings)};
    saveSettings();
    setStarters();

    $(`#${SETTINGS.starter_type.toLowerCase()}:radio[name='starter']`).prop("checked", true).change();
    $(`#${prefersDarkTheme ? "dark" : "light"}:radio[name='theme']`).prop("checked", true).change();

    $("input:radio[name='starter']").change(function () {
    	SETTINGS.starter_type = $(this).val();
    	setStarters();
        saveSettings();
    });
    $("input:radio[name='theme']").change(function () {
        setDarkTheme($(this).val() == "Dark");
    });
        saveSettings();
});

function setStarters() {
	switch (SETTINGS.starter) {
		case "Grass":
			RIVAL_STARTER_1 = "Charmander";
			RIVAL_STARTER_2 = "Charmeleon";
			RIVAL_STARTER_3 = "Charizard";
			RIVAL_STARTER_MEGA_1 = "Mega Charizard X";
			RIVAL_STARTER_MEGA_2 = "Mega Charizard Y";
			break;
	}
}
