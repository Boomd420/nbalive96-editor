let globalArrayBuffer = null;
let dataView = null;
let uint8Array = null;

const PLAYER_CONFIG = {
    baseOffset: 0x4000, // Standard PC roster offset
    recordSize: 64,     // 64 bytes per player record
    totalPlayers: 470   // Full database matching NBALIVE96OGROS.CSV
};

// File Ingestion Handler
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('fileNameDisplay').textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        globalArrayBuffer = e.target.result;
        dataView = new DataView(globalArrayBuffer);
        uint8Array = new Uint8Array(globalArrayBuffer);
        
        initEditorWorkspace();
    };
    reader.readAsArrayBuffer(file);
});

function initEditorWorkspace() {
    document.getElementById('editorWorkspace').style.display = 'block';
    renderPlayerTable();
}

// Render Table Data for all 470 players
function renderPlayerTable() {
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';

    for (let i = 0; i < PLAYER_CONFIG.totalPlayers; i++) {
        const offset = PLAYER_CONFIG.baseOffset + (i * PLAYER_CONFIG.recordSize);
        if (offset + PLAYER_CONFIG.recordSize > globalArrayBuffer.byteLength) break;

        // Field offsets derived from roster structure & CSV reference
        const firstName = readNullTerminatedString(offset + 0x00, 15);
        const lastName = readNullTerminatedString(offset + 0x0F, 15);
        const jersey = dataView.getUint8(offset + 0x1E);
        const position = dataView.getUint8(offset + 0x1F);
        const height = dataView.getUint8(offset + 0x20);
        const weight = dataView.getUint8(offset + 0x21);
        const speed = dataView.getUint8(offset + 0x24);
        const overall = dataView.getUint8(offset + 0x25);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i}</td>
            <td><input type="text" value="${firstName}" data-index="${i}" data-field="firstName" style="width:90px;"></td>
            <td><input type="text" value="${lastName}" data-index="${i}" data-field="lastName" style="width:90px;"></td>
            <td><input type="number" value="${position}" data-index="${i}" data-field="position" min="0" max="5" style="width:50px;"></td>
            <td><input type="number" value="${jersey}" data-index="${i}" data-field="jersey" min="0" max="99" style="width:50px;"></td>
            <td><input type="number" value="${height}" data-index="${i}" data-field="height" min="0" max="255" style="width:50px;"></td>
            <td><input type="number" value="${weight}" data-index="${i}" data-field="weight" min="0" max="255" style="width:60px;"></td>
            <td><input type="number" value="${speed}" data-index="${i}" data-field="speed" min="0" max="99" style="width:50px;"></td>
            <td><input type="number" value="${overall}" data-index="${i}" data-field="overall" min="0" max="99" style="width:50px;"></td>
        `;
        tbody.appendChild(tr);
    }

    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', handleAttributeChange);
    });
}

function handleAttributeChange(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    const value = e.target.value;
    const offset = PLAYER_CONFIG.baseOffset + (index * PLAYER_CONFIG.recordSize);

    if (field === 'firstName') {
        writeNullTerminatedString(offset + 0x00, value, 15);
    } else if (field === 'lastName') {
        writeNullTerminatedString(offset + 0x0F, value, 15);
    } else if (field === 'jersey') {
        dataView.setUint8(offset + 0x1E, parseInt(value) || 0);
    } else if (field === 'position') {
        dataView.setUint8(offset + 0x1F, parseInt(value) || 0);
    } else if (field === 'height') {
        dataView.setUint8(offset + 0x20, parseInt(value) || 0);
    } else if (field === 'weight') {
        dataView.setUint8(offset + 0x21, parseInt(value) || 0);
    } else if (field === 'speed') {
        dataView.setUint8(offset + 0x24, parseInt(value) || 0);
    } else if (field === 'overall') {
        dataView.setUint8(offset + 0x25, parseInt(value) || 0);
    }
}

// Helpers
function readNullTerminatedString(offset, maxLength) {
    const slice = uint8Array.subarray(offset, offset + maxLength);
    const terminator = slice.indexOf(0x00);
    const validBytes = terminator !== -1 ? slice.subarray(0, terminator) : slice;
    return new TextDecoder("windows-1252").decode(validBytes);
}

function writeNullTerminatedString(offset, str, maxLength) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    for (let i = 0; i < maxLength; i++) {
        if (i < encoded.length && i < maxLength - 1) {
            uint8Array[offset + i] = encoded[i];
        } else {
            uint8Array[offset + i] = 0x00;
        }
    }
}

function recalculateAndPatchChecksum() {
    if (!globalArrayBuffer) return;
    let checksum = 0;
    const startOffset = 0x0800; 
    const endOffset = globalArrayBuffer.byteLength;

    for (let i = startOffset; i < endOffset; i++) {
        checksum = (checksum + uint8Array[i]) >>> 0;
    }
    dataView.setUint32(0x0767, checksum, true);
}

// Save & Download Action
document.getElementById('saveBtn').addEventListener('click', () => {
    recalculateAndPatchChecksum();

    const blob = new Blob([globalArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "roster_edited.bin";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});
