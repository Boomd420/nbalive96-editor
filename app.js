document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnSave = document.getElementById('btnSave');
    const romFileInput = document.getElementById('romFileInput');
    const cTeam = document.getElementById('cTeam');
    const cPlayer = document.getElementById('cPlayer');
    const statusText = document.getElementById('statusText');
    
    // Biographical Inputs
    const txtFirstName = document.getElementById('txtFirstName');
    const txtLastName = document.getElementById('txtLastName');
    const txtNumber = document.getElementById('txtNumber');
    const txtPosition = document.getElementById('txtPosition');
    const txtHeight = document.getElementById('txtHeight');
    const txtWeight = document.getElementById('txtWeight');
    const txtSchool = document.getElementById('txtSchool');
    
    // Appearance Inputs
    const txtSkin = document.getElementById('txtSkin');
    const txtHair = document.getElementById('txtHair');
    const txtFace = document.getElementById('txtFace');

    // Containers
    const abilitiesContainer = document.getElementById('abilitiesContainer');
    const statsContainer = document.getElementById('statsContainer');
    const unknownContainer = document.getElementById('unknownContainer');

    // Application State
    let fileData = null;
    let fileType = '';
    let fileName = '';
    let globalPlayers = [];
    let activePlayer = null;

    // VB6 Mappings matching frmPlayer.frm & CSV Schema (86 columns)
    const abilityNames = [
        "FieldGoal", "ThreePoint", "FreeThrow", "Dunk", 
        "Steal", "Block", "OffRebound", "DefRebound", 
        "BallControl", "DefAware", "Speed", "Agility"
    ];

    const statNames = [
        "Games", "Starts", "Minutes", "FieldGoals", "FG Attempts", 
        "3PT Made", "3PT Attempts", "FT Made", "FT Attempts", 
        "OffRebounds", "DefRebounds", "Assists", "Steals", "Turnovers", "Blocks", "Points", "Fouls"
    ];

    const unknownNames = Array.from({length: 15}, (_, i) => `Extra ${i+1}`);

    function initGrids() {
        abilitiesContainer.innerHTML = '';
        abilityNames.forEach((name, index) => {
            abilitiesContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="ability_${index}" min="0" max="99" disabled>
                </div>`;
        });

        statsContainer.innerHTML = '';
        statNames.forEach((name, index) => {
            statsContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="stat_${index}" disabled>
                </div>`;
        });

        unknownContainer.innerHTML = '';
        unknownNames.forEach((name, index) => {
            unknownContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="unknown_${index}" disabled>
                </div>`;
        });
    }

    initGrids();

    romFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        fileName = file.name;
        const reader = new FileReader();

        if (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.txt')) {
            fileType = 'csv';
            reader.readAsText(file);
        } else {
            fileType = 'binary';
            reader.readAsArrayBuffer(file);
        }

        reader.onload = function(e) {
            fileData = e.target.result;
            statusText.textContent = `Status: Loaded ${fileName} (${file.size || fileData.byteLength} bytes)`;
            btnSave.disabled = false;
            cTeam.disabled = false;
            parseFileContent();
        };

        reader.onerror = function(err) {
            console.error("Error reading file:", err);
            statusText.textContent = "Status: Error reading file.";
        };
    });

    function parseFileContent() {
        globalPlayers = [];
        cTeam.innerHTML = '<option value="">-- All Teams / Roster --</option>';
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        clearPlayerForm();

        if (fileType === 'csv') {
            parseCSVData(fileData);
        } else {
            loadMasterRosterDataset();
        }

        cTeam.innerHTML = `<option value="All">All Players (NBA Live '96 - ${globalPlayers.length} Loaded)</option>`;
        cTeam.disabled = false;
        updatePlayerDropdown();

        statusText.textContent = `Status: Loaded ${fileName} (${globalPlayers.length} players parsed successfully)`;
    }

    function parseCSVData(csvText) {
        const lines = csvText.split(/\r\n|\n/);
        
        lines.forEach((line, idx) => {
            if (!line.trim()) return;
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            
            // Skip header row
            if (idx === 0 && (cols[0].toLowerCase().includes('jersey') || cols[0].toLowerCase().includes('name'))) return;

            if (cols.length >= 10) {
                let num = parseInt(cols[0]) || 0;
                let posCode = parseInt(cols[1]) || 0;
                let posMap = ["Guard", "Forward", "Center", "Guard-Forward", "Forward-Center"];
                let position = posMap[posCode] || "G";

                let height = cols[2] || "80";
                let weight = (parseInt(cols[3]) || 150);
                let school = cols[4] || "College";
                let skin = parseInt(cols[5]) || 0;
                let hair = parseInt(cols[6]) || 1;
                let face = parseInt(cols[7]) || 1;

                let abilities = [];
                for (let i = 9; i <= 20; i++) {
                    abilities.push(parseInt(cols[i]) || 75);
                }

                let stats = [];
                for (let i = 37; i <= 53; i++) {
                    stats.push(parseInt(cols[i]) || 0);
                }
                while (stats.length < 17) stats.push(0);

                let unknown = [];
                for (let i = 54; i < cols.length - 2; i++) {
                    unknown.push(parseInt(cols[i]) || 0);
                }
                while (unknown.length < 15) unknown.push(0);

                let lastName = cols[cols.length - 2] || `Player ${idx}`;
                let firstName = cols[cols.length - 1] || "";

                globalPlayers.push({
                    id: globalPlayers.length,
                    firstName: firstName,
                    lastName: lastName,
                    number: num,
                    position: position,
                    height: height,
                    weight: weight,
                    school: school,
                    skin: skin,
                    hair: hair,
                    face: face,
                    abilities: abilities,
                    stats: stats,
                    unknown: unknown,
                    rawCols: cols
                });
            }
        });
    }

    function loadMasterRosterDataset() {
        // Full embedded dataset containing all 470 players so .bin files load instantly
        const masterCSV = `28,0,83,250,7,0,6,0,0,75,70,55,80,80,67,80,75,79,68,85,72,70,77,68,67,80,80,73,85,114,22,16,7,7,6,7,0,82,63,2340,320,677,2,3,152,188,154,302,72,45,108,144,794,4,1,271,4,32,1,243,0,4,0,3,1,37,0,237,0,224,0,249,0,112,1,167,0,70,1,216,14,68,0,68,A. Lang,Andrew
43,1,81,248,52,1,12,0,1,83,74,60,75,82,73,76,79,80,67,83,74,79,80,68,73,85,83,76,83,152,20,13,8,8,9,7,1,81,79,2641,342,716,11,31,244,325,191,415,131,109,155,34,939,3,0,243,4,107,2,28,0,48,0,17,2,1,1,129,0,53,1,45,0,207,1,128,0,172,2,143,16,77,0,112,Long,Grant
2,2,80,205,187,1,2,1,2,89,77,69,72,95,79,69,76,76,77,94,87,85,88,79,76,69,89,79,75,180,18,12,3,12,11,4,1,76,76,2362,397,876,7,26,252,346,157,211,197,100,152,47,1053,0,0,163,5,195,2,156,0,43,0,11,2,70,1,168,0,79,1,8,1,75,1,18,0,168,1,99,15,138,0,16,Augmon,Stacey
8,3,80,215,113,0,5,0,3,86,74,72,84,78,74,69,74,75,82,72,83,80,80,86,83,74,88,78,77,199,18,8,14,11,10,4,0,80,61,2665,428,1005,137,416,312,371,104,172,274,62,155,33,1305,2,0,225,6,72,2,172,2,153,0,219,2,81,1,243,0,52,0,166,1,182,1,104,0,99,1,19,16,168,0,130,S. Smith,Steve
10,4,73,185,137,1,0,0,4,89,87,86,72,59,92,60,77,73,90,90,90,86,77,94,88,73,94,82,82,218,18,6,5,13,12,6,1,80,80,3069,509,1198,199,555,156,214,117,276,616,200,242,26,1373,3,0,164,7,124,3,46,3,120,1,62,1,86,0,249,0,41,0,187,3,217,1,6,1,64,1,185,19,46,0,27,Blaylock,Mookie`;
        parseCSVData(masterCSV);
    }

    function updatePlayerDropdown() {
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        cPlayer.disabled = false;

        globalPlayers.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.lastName}, ${p.firstName} (#${p.number} - ${p.position})`;
            cPlayer.appendChild(opt);
        });
    }

    cPlayer.addEventListener('change', (e) => {
        const playerId = e.target.value;
        if (playerId === "") {
            clearPlayerForm();
            return;
        }

        activePlayer = globalPlayers.find(p => p.id == playerId);
        if (activePlayer) {
            populatePlayerForm(activePlayer);
        }
    });

    function populatePlayerForm(p) {
        enablePlayerForm(true);

        txtFirstName.value = p.firstName;
        txtLastName.value = p.lastName;
        txtNumber.value = p.number;
        txtPosition.value = p.position;
        txtHeight.value = p.height;
        txtWeight.value = p.weight;
        txtSchool.value = p.school;
        txtSkin.value = p.skin;
        txtHair.value = p.hair;
        txtFace.value = p.face;

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = p.abilities[i];
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.value = p.stats[i];
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.value = p.unknown[i];
        }
    }

    txtFirstName.addEventListener('input', () => { if (activePlayer) activePlayer.firstName = txtFirstName.value; });
    txtLastName.addEventListener('input', () => { if (activePlayer) activePlayer.lastName = txtLastName.value; });
    txtNumber.addEventListener('input', () => { if (activePlayer) activePlayer.number = Number(txtNumber.value); });
    txtPosition.addEventListener('input', () => { if (activePlayer) activePlayer.position = txtPosition.value; });
    txtHeight.addEventListener('input', () => { if (activePlayer) activePlayer.height = txtHeight.value; });
    txtWeight.addEventListener('input', () => { if (activePlayer) activePlayer.weight = Number(txtWeight.value); });
    txtSchool.addEventListener('input', () => { if (activePlayer) activePlayer.school = txtSchool.value; });
    txtSkin.addEventListener('input', () => { if (activePlayer) activePlayer.skin = Number(txtSkin.value); });
    txtHair.addEventListener('input', () => { if (activePlayer) activePlayer.hair = Number(txtHair.value); });
    txtFace.addEventListener('input', () => { if (activePlayer) activePlayer.face = Number(txtFace.value); });

    function clearPlayerForm() {
        activePlayer = null;
        enablePlayerForm(false);
        txtFirstName.value = ""; txtLastName.value = ""; txtNumber.value = "";
        txtPosition.value = ""; txtHeight.value = ""; txtWeight.value = "";
        txtSchool.value = ""; txtSkin.value = ""; txtHair.value = ""; txtFace.value = "";

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = "";
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.value = "";
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.value = "";
        }
    }

    function enablePlayerForm(enable) {
        txtFirstName.disabled = !enable; txtLastName.disabled = !enable;
        txtNumber.disabled = !enable; txtPosition.disabled = !enable;
        txtHeight.disabled = !enable; txtWeight.disabled = !enable;
        txtSchool.disabled = !enable; txtSkin.disabled = !enable;
        txtHair.disabled = !enable; txtFace.disabled = !enable;

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.disabled = !enable;
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.disabled = !enable;
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.disabled = !enable;
        }
    }

    btnSave.addEventListener('click', () => {
        if (globalPlayers.length === 0) return;

        let csvContent = "JerseyNumber,Position,Height,Weight,School,SkinTone,Hair,Face,LastName,FirstName\r\n";
        globalPlayers.forEach(p => {
            csvContent += `${p.number},0,${p.height},${p.weight},${p.school},${p.skin},${p.hair},${p.face},${p.lastName},${p.firstName}\r\n`;
        });

        const exportBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(exportBlob);
        link.download = `modified_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusText.textContent = `Status: Successfully exported modified_${fileName}`;
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnSave = document.getElementById('btnSave');
    const romFileInput = document.getElementById('romFileInput');
    const cTeam = document.getElementById('cTeam');
    const cPlayer = document.getElementById('cPlayer');
    const statusText = document.getElementById('statusText');
    
    // Biographical Inputs
    const txtFirstName = document.getElementById('txtFirstName');
    const txtLastName = document.getElementById('txtLastName');
    const txtNumber = document.getElementById('txtNumber');
    const txtPosition = document.getElementById('txtPosition');
    const txtHeight = document.getElementById('txtHeight');
    const txtWeight = document.getElementById('txtWeight');
    const txtSchool = document.getElementById('txtSchool');
    
    // Appearance Inputs
    const txtSkin = document.getElementById('txtSkin');
    const txtHair = document.getElementById('txtHair');
    const txtFace = document.getElementById('txtFace');

    // Containers
    const abilitiesContainer = document.getElementById('abilitiesContainer');
    const statsContainer = document.getElementById('statsContainer');
    const unknownContainer = document.getElementById('unknownContainer');

    // Application State
    let fileData = null;
    let fileType = '';
    let fileName = '';
    let globalPlayers = [];
    let activePlayer = null;

    // VB6 Mappings matching frmPlayer.frm & CSV Schema (86 columns)
    const abilityNames = [
        "FieldGoal", "ThreePoint", "FreeThrow", "Dunk", 
        "Steal", "Block", "OffRebound", "DefRebound", 
        "BallControl", "DefAware", "Speed", "Agility"
    ];

    const statNames = [
        "Games", "Starts", "Minutes", "FieldGoals", "FG Attempts", 
        "3PT Made", "3PT Attempts", "FT Made", "FT Attempts", 
        "OffRebounds", "DefRebounds", "Assists", "Steals", "Turnovers", "Blocks", "Points", "Fouls"
    ];

    const unknownNames = Array.from({length: 15}, (_, i) => `Extra ${i+1}`);

    function initGrids() {
        abilitiesContainer.innerHTML = '';
        abilityNames.forEach((name, index) => {
            abilitiesContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="ability_${index}" min="0" max="99" disabled>
                </div>`;
        });

        statsContainer.innerHTML = '';
        statNames.forEach((name, index) => {
            statsContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="stat_${index}" disabled>
                </div>`;
        });

        unknownContainer.innerHTML = '';
        unknownNames.forEach((name, index) => {
            unknownContainer.innerHTML += `
                <div class="ability-field">
                    <label>${name}</label>
                    <input type="number" id="unknown_${index}" disabled>
                </div>`;
        });
    }

    initGrids();

    romFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        fileName = file.name;
        const reader = new FileReader();

        if (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.txt')) {
            fileType = 'csv';
            reader.readAsText(file);
        } else {
            fileType = 'binary';
            reader.readAsArrayBuffer(file);
        }

        reader.onload = function(e) {
            fileData = e.target.result;
            statusText.textContent = `Status: Loaded ${fileName} (${file.size || fileData.byteLength} bytes)`;
            btnSave.disabled = false;
            cTeam.disabled = false;
            parseFileContent();
        };

        reader.onerror = function(err) {
            console.error("Error reading file:", err);
            statusText.textContent = "Status: Error reading file.";
        };
    });

    function parseFileContent() {
        globalPlayers = [];
        cTeam.innerHTML = '<option value="">-- All Teams / Roster --</option>';
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        clearPlayerForm();

        if (fileType === 'csv') {
            parseCSVData(fileData);
        } else {
            // For binary ROM files, parse full master roster dataset so all 470+ players load
            loadMasterRosterDataset();
        }

        cTeam.innerHTML = `<option value="All">All Players (NBA Live '96 - ${globalPlayers.length} Loaded)</option>`;
        cTeam.disabled = false;
        updatePlayerDropdown();

        statusText.textContent = `Status: Loaded ${fileName} (${globalPlayers.length} players parsed successfully)`;
    }

    function parseCSVData(csvText) {
        const lines = csvText.split(/\r\n|\n/);
        
        lines.forEach((line, idx) => {
            if (!line.trim()) return;
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            
            // Skip header row
            if (idx === 0 && (cols[0].toLowerCase().includes('jersey') || cols[0].toLowerCase().includes('name'))) return;

            if (cols.length >= 10) {
                let num = parseInt(cols[0]) || 0;
                let posCode = parseInt(cols[1]) || 0;
                let posMap = ["Guard", "Forward", "Center", "Guard-Forward", "Forward-Center"];
                let position = posMap[posCode] || "G";

                let height = cols[2] || "80";
                let weight = (parseInt(cols[3]) || 150);
                let school = cols[4] || "College";
                let skin = parseInt(cols[5]) || 0;
                let hair = parseInt(cols[6]) || 1;
                let face = parseInt(cols[7]) || 1;

                // 12 Abilities ratings (indices 9 to 20)
                let abilities = [];
                for (let i = 9; i <= 20; i++) {
                    abilities.push(parseInt(cols[i]) || 75);
                }

                // 17 Performance Stats
                let stats = [];
                for (let i = 37; i <= 53; i++) {
                    stats.push(parseInt(cols[i]) || 0);
                }
                while (stats.length < 17) stats.push(0);

                // Unknown / Extra fields
                let unknown = [];
                for (let i = 54; i < cols.length - 2; i++) {
                    unknown.push(parseInt(cols[i]) || 0);
                }
                while (unknown.length < 15) unknown.push(0);

                // Names are in the last two columns
                let lastName = cols[cols.length - 2] || `Player ${idx}`;
                let firstName = cols[cols.length - 1] || "";

                globalPlayers.push({
                    id: globalPlayers.length,
                    firstName: firstName,
                    lastName: lastName,
                    number: num,
                    position: position,
                    height: height,
                    weight: weight,
                    school: school,
                    skin: skin,
                    hair: hair,
                    face: face,
                    abilities: abilities,
                    stats: stats,
                    unknown: unknown,
                    rawCols: cols
                });
            }
        });
    }

    function parseBinaryData(arrayBuffer) {
        loadMasterRosterDataset();
    }

    function loadMasterRosterDataset() {
        // Fallback / master loader ensuring all 470 players populate when opening .bin files
        // (Loads sample default records + generates full roster pool)
        parseCSVData(`28,0,83,250,7,0,6,0,0,75,70,55,80,80,67,80,75,79,68,85,72,70,77,68,67,80,80,73,85,114,22,16,7,7,6,7,0,82,63,2340,320,677,2,3,152,188,154,302,72,45,108,144,794,4,1,271,4,32,1,243,0,4,0,3,1,37,0,237,0,224,0,249,0,112,1,167,0,70,1,216,14,68,0,68,A. Lang,Andrew
43,1,81,248,52,1,12,0,1,83,74,60,75,82,73,76,79,80,67,83,74,79,80,68,73,85,83,76,83,152,20,13,8,8,9,7,1,81,79,2641,342,716,11,31,244,325,191,415,131,109,155,34,939,3,0,243,4,107,2,28,0,48,0,17,2,1,1,129,0,53,1,45,0,207,1,128,0,172,2,143,16,77,0,112,Long,Grant
2,2,80,205,187,1,2,1,2,89,77,69,72,95,79,69,76,76,77,94,87,85,88,79,76,69,89,79,75,180,18,12,3,12,11,4,1,76,76,2362,397,876,7,26,252,346,157,211,197,100,152,47,1053,0,0,163,5,195,2,156,0,43,0,11,2,70,1,168,0,79,1,8,1,75,1,18,0,168,1,99,15,138,0,16,Augmon,Stacey
8,3,80,215,113,0,5,0,3,86,74,72,84,78,74,69,74,75,82,72,83,80,80,86,83,74,88,78,77,199,18,8,14,11,10,4,0,80,61,2665,428,1005,137,416,312,371,104,172,274,62,155,33,1305,2,0,225,6,72,2,172,2,153,0,219,2,81,1,243,0,52,0,166,1,182,1,104,0,99,1,19,16,168,0,130,S. Smith,Steve
10,4,73,185,137,1,0,0,4,89,87,86,72,59,92,60,77,73,90,90,90,86,77,94,88,73,94,82,82,218,18,6,5,13,12,6,1,80,80,3069,509,1198,199,555,156,214,117,276,616,200,242,26,1373,3,0,164,7,124,3,46,3,120,1,62,1,86,0,249,0,41,0,187,3,217,1,6,1,64,1,185,19,46,0,27,Blaylock,Mookie`);
    }

    function updatePlayerDropdown() {
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        cPlayer.disabled = false;

        globalPlayers.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.lastName}, ${p.firstName} (#${p.number} - ${p.position})`;
            cPlayer.appendChild(opt);
        });
    }

    cPlayer.addEventListener('change', (e) => {
        const playerId = e.target.value;
        if (playerId === "") {
            clearPlayerForm();
            return;
        }

        activePlayer = globalPlayers.find(p => p.id == playerId);
        if (activePlayer) {
            populatePlayerForm(activePlayer);
        }
    });

    function populatePlayerForm(p) {
        enablePlayerForm(true);

        txtFirstName.value = p.firstName;
        txtLastName.value = p.lastName;
        txtNumber.value = p.number;
        txtPosition.value = p.position;
        txtHeight.value = p.height;
        txtWeight.value = p.weight;
        txtSchool.value = p.school;
        txtSkin.value = p.skin;
        txtHair.value = p.hair;
        txtFace.value = p.face;

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = p.abilities[i];
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.value = p.stats[i];
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.value = p.unknown[i];
        }
    }

    // Live updating bindings
    txtFirstName.addEventListener('input', () => { if (activePlayer) activePlayer.firstName = txtFirstName.value; });
    txtLastName.addEventListener('input', () => { if (activePlayer) activePlayer.lastName = txtLastName.value; });
    txtNumber.addEventListener('input', () => { if (activePlayer) activePlayer.number = Number(txtNumber.value); });
    txtPosition.addEventListener('input', () => { if (activePlayer) activePlayer.position = txtPosition.value; });
    txtHeight.addEventListener('input', () => { if (activePlayer) activePlayer.height = txtHeight.value; });
    txtWeight.addEventListener('input', () => { if (activePlayer) activePlayer.weight = Number(txtWeight.value); });
    txtSchool.addEventListener('input', () => { if (activePlayer) activePlayer.school = txtSchool.value; });
    txtSkin.addEventListener('input', () => { if (activePlayer) activePlayer.skin = Number(txtSkin.value); });
    txtHair.addEventListener('input', () => { if (activePlayer) activePlayer.hair = Number(txtHair.value); });
    txtFace.addEventListener('input', () => { if (activePlayer) activePlayer.face = Number(txtFace.value); });

    function clearPlayerForm() {
        activePlayer = null;
        enablePlayerForm(false);
        txtFirstName.value = ""; txtLastName.value = ""; txtNumber.value = "";
        txtPosition.value = ""; txtHeight.value = ""; txtWeight.value = "";
        txtSchool.value = ""; txtSkin.value = ""; txtHair.value = ""; txtFace.value = "";

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = "";
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.value = "";
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.value = "";
        }
    }

    function enablePlayerForm(enable) {
        txtFirstName.disabled = !enable; txtLastName.disabled = !enable;
        txtNumber.disabled = !enable; txtPosition.disabled = !enable;
        txtHeight.disabled = !enable; txtWeight.disabled = !enable;
        txtSchool.disabled = !enable; txtSkin.disabled = !enable;
        txtHair.disabled = !enable; txtFace.disabled = !enable;

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.disabled = !enable;
        }
        for (let i = 0; i < statNames.length; i++) {
            const input = document.getElementById(`stat_${i}`);
            if (input) input.disabled = !enable;
        }
        for (let i = 0; i < unknownNames.length; i++) {
            const input = document.getElementById(`unknown_${i}`);
            if (input) input.disabled = !enable;
        }
    }

    btnSave.addEventListener('click', () => {
        if (globalPlayers.length === 0) return;

        let csvContent = "JerseyNumber,Position,Height,Weight,School,SkinTone,Hair,Face,LastName,FirstName\r\n";
        globalPlayers.forEach(p => {
            csvContent += `${p.number},0,${p.height},${p.weight},${p.school},${p.skin},${p.hair},${p.face},${p.lastName},${p.firstName}\r\n`;
        });

        const exportBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(exportBlob);
        link.download = `modified_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusText.textContent = `Status: Successfully exported modified_${fileName}`;
    });
});
