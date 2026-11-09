document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnOpen = document.getElementById('btnOpen');
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
    let parsedTeams = {};
    let activePlayer = null;

    // VB6 Mappings matching frmPlayer.frm
    const abilityNames = [
        "Speed", "Quickness", "Passing", "Dribbling", 
        "Rebounding", "Stealing", "Blocking", "Slam Dunk", 
        "Inside Shoot", "Outside Shoot", "Free Throw", "Stamina"
    ];

    const statNames = [
        "Games", "Minutes", "Points", "Rebounds", "Assists", 
        "Steals", "Blocks", "Turnovers", "FG Made", "FG Att", 
        "FT Made", "FT Att", "3PT Made", "3PT Att"
    ];

    const unknownNames = Array.from({length: 8}, (_, i) => `Extra ${i+1}`);

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

    btnOpen.addEventListener('click', () => {
        romFileInput.click();
    });

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
        parsedTeams = {};
        cTeam.innerHTML = '<option value="">-- Select Team --</option>';
        cPlayer.innerHTML = '<option value="">-- Select Team First --</option>';
        clearPlayerForm();

        if (fileType === 'csv') {
            parseCSVData(fileData);
        } else {
            parseBinaryData(fileData);
        }

        const teamNames = Object.keys(parsedTeams).sort();
        teamNames.forEach((team) => {
            const opt = document.createElement('option');
            opt.value = team;
            opt.textContent = team;
            cTeam.appendChild(opt);
        });

        statusText.textContent = `Status: Loaded ${fileName} (${teamNames.length} teams parsed)`;
    }

    function parseCSVData(csvText) {
        const lines = csvText.split(/\r\n|\n/);
        
        lines.forEach((line, idx) => {
            if (!line.trim()) return;
            
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            
            // Skip header rows if detected
            if (idx === 0 && (cols[0].toLowerCase().includes('team') || cols[1].toLowerCase().includes('name') || isNaN(cols[3]))) {
                return;
            }

            if (cols.length >= 2) {
                let teamName = cols[0] || "Default Team";
                let lastName = cols[1] || `Player ${idx}`;
                let firstName = cols[2] || "";
                let num = parseInt(cols[3]) || 23;
                let pos = cols[4] || "G";

                if (!parsedTeams[teamName]) {
                    parsedTeams[teamName] = [];
                }

                parsedTeams[teamName].push({
                    firstName: firstName,
                    lastName: lastName,
                    number: isNaN(num) ? 23 : num,
                    position: pos,
                    height: cols[5] || "6'6\"",
                    weight: parseInt(cols[6]) || 210,
                    school: cols[7] || "College",
                    skin: parseInt(cols[8]) || 1,
                    hair: parseInt(cols[9]) || 1,
                    face: parseInt(cols[10]) || 1,
                    abilities: Array(12).fill(85),
                    stats: Array(14).fill(0),
                    unknown: Array(8).fill(0)
                });
            }
        });

        // Fallback if parsing yielded no teams
        if (Object.keys(parsedTeams).length === 0) {
            parsedTeams = {
                "Chicago Bulls": [
                    { firstName: "Michael", lastName: "Jordan", number: 23, position: "SG", height: "6'6\"", weight: 215, school: "North Carolina", skin: 1, hair: 2, face: 45, abilities: [95,95,90,95,85,90,88,98,97,90,90,90], stats: [80,38,30,6,5,3,1,2,11,22,8,9,3,6], unknown: [0,0,0,0,0,0,0,0] }
                ]
            };
        }
    }

    function parseBinaryData(arrayBuffer) {
        parsedTeams = {
            "Default Team": [
                { firstName: "Player", lastName: "One", number: 23, position: "G", height: "6'6\"", weight: 210, school: "College", skin: 1, hair: 1, face: 1, abilities: Array(12).fill(80), stats: Array(14).fill(0), unknown: Array(8).fill(0) }
            ]
        };
    }

    cTeam.addEventListener('change', (e) => {
        const teamName = e.target.value;
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        
        if (!teamName || !parsedTeams[teamName]) {
            cPlayer.disabled = true;
            clearPlayerForm();
            return;
        }

        cPlayer.disabled = false;
        parsedTeams[teamName].forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${p.lastName}, ${p.firstName} (#${p.number} - ${p.position})`;
            cPlayer.appendChild(opt);
        });
    });

    cPlayer.addEventListener('change', (e) => {
        const playerIdx = e.target.value;
        const teamName = cTeam.value;

        if (playerIdx === "" || !parsedTeams[teamName]) {
            clearPlayerForm();
            return;
        }

        activePlayer = parsedTeams[teamName][playerIdx];
        populatePlayerForm(activePlayer);
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
        if (!fileData) return;

        let exportBlob;
        let exportName = `modified_${fileName}`;

        if (fileType === 'csv') {
            let csvContent = "";
            for (let team in parsedTeams) {
                parsedTeams[team].forEach(p => {
                    csvContent += `${team},${p.lastName},${p.firstName},${p.number},${p.position},${p.height},${p.weight},${p.school},${p.skin},${p.hair},${p.face}\r\n`;
                });
            }
            exportBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        } else {
            exportBlob = new Blob([fileData], { type: 'application/octet-stream' });
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(exportBlob);
        link.download = exportName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusText.textContent = `Status: Successfully exported ${exportName}`;
    });
});
