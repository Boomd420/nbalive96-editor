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
    const abilitiesContainer = document.getElementById('abilitiesContainer');

    // Application State
    let fileBuffer = null;
    let fileName = '';
    
    // Standard NBA Live '96 Ability Names (matching typical VB6 control array)
    const abilityNames = [
        "Speed", "Quickness", "Passing", "Dribbling", 
        "Rebounding", "Stealing", "Blocking", "Slam Dunk", 
        "Inside Shoot", "Outside Shoot", "Free Throw", "Stamina"
    ];

    // Initialize Ability Inputs in UI
    function initAbilityInputs() {
        abilitiesContainer.innerHTML = '';
        abilityNames.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = 'ability-field';
            div.innerHTML = `
                <label>${name}</label>
                <input type="number" id="ability_${index}" min="0" max="99" disabled>
            `;
            abilitiesContainer.appendChild(div);
        });
    }
    
    initAbilityInputs();

    // Trigger file picker
    btnOpen.addEventListener('click', () => {
        romFileInput.click();
    });

    // Handle file load
    romFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        fileName = file.name;
        const reader = new FileReader();

        reader.onload = function(e) {
            fileBuffer = e.target.result;
            statusText.textContent = `Status: Loaded ${fileName} (${fileBuffer.byteLength} bytes)`;
            
            // Enable UI controls
            btnSave.disabled = false;
            cTeam.disabled = false;
            
            parseROMStructure();
        };

        reader.onerror = function(err) {
            console.error("Error reading file:", err);
            statusText.textContent = "Status: Error reading file.";
        };

        reader.readAsArrayBuffer(file);
    });

    // Placeholder ROM Parser logic mapping VB6 structures
    function parseROMStructure() {
        cTeam.innerHTML = '<option value="">-- Select Team --</option>';
        
        const sampleTeams = [
            "Atlanta Hawks", "Boston Celtics", "Charlotte Hornets", "Chicago Bulls", 
            "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons",
            "Golden State Warriors", "Houston Rockets", "Indiana Pacers", "Los Angeles Clippers",
            "Los Angeles Lakers", "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves",
            "New York Knicks", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
            "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Seattle SuperSonics",
            "Utah Jazz", "Washington Bullets", "Vancouver Grizzlies", "Toronto Raptors"
        ];

        sampleTeams.forEach((team, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = team;
            cTeam.appendChild(opt);
        });
    }

    // Team selection handler
    cTeam.addEventListener('change', (e) => {
        const teamId = e.target.value;
        cPlayer.innerHTML = '<option value="">-- Select Player --</option>';
        
        if (teamId === "") {
            cPlayer.disabled = true;
            clearPlayerForm();
            return;
        }

        cPlayer.disabled = false;
        
        const samplePlayers = [
            { id: 1, first: "Star", last: "Player", num: 23, pos: "G", height: "6'6\"", weight: 215, school: "College" },
            { id: 2, first: "Starting", last: "Forward", num: 33, pos: "F", height: "6'8\"", weight: 225, school: "University" },
            { id: 3, first: "Center", last: "Anchor", num: 34, pos: "C", height: "7'1\"", weight: 260, school: "State" }
        ];

        samplePlayers.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.last}, ${p.first} (#${p.num} - ${p.pos})`;
            cPlayer.appendChild(opt);
        });
    });

    // Player selection handler
    cPlayer.addEventListener('change', (e) => {
        const playerId = e.target.value;
        if (playerId === "") {
            clearPlayerForm();
            return;
        }

        enablePlayerForm(true);
        txtFirstName.value = "Michael";
        txtLastName.value = "Jordan";
        txtNumber.value = 23;
        txtPosition.value = "SG";
        txtHeight.value = "6'6\"";
        txtWeight.value = 215;
        txtSchool.value = "North Carolina";

        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = Math.floor(Math.random() * 20) + 80;
        }
    });

    function clearPlayerForm() {
        enablePlayerForm(false);
        txtFirstName.value = "";
        txtLastName.value = "";
        txtNumber.value = "";
        txtPosition.value = "";
        txtHeight.value = "";
        txtWeight.value = "";
        txtSchool.value = "";
        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.value = "";
        }
    }

    function enablePlayerForm(enable) {
        txtFirstName.disabled = !enable;
        txtLastName.disabled = !enable;
        txtNumber.disabled = !enable;
        txtPosition.disabled = !enable;
        txtHeight.disabled = !enable;
        txtWeight.disabled = !enable;
        txtSchool.disabled = !enable;
        for (let i = 0; i < abilityNames.length; i++) {
            const input = document.getElementById(`ability_${i}`);
            if (input) input.disabled = !enable;
        }
    }

    // Save ROM back to file
    btnSave.addEventListener('click', () => {
        if (!fileBuffer) return;

        const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `modified_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusText.textContent = `Status: Successfully exported modified_${fileName}`;
    });
});
