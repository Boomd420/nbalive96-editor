let globalArrayBuffer = null;
let dataView = null;
let uint8Array = null;

const PLAYER_CONFIG = {
    baseOffset: 0x4000, // Update to your exact verified roster offset
    recordSize: 64,     
    totalPlayers: 50    // Adjust based on your test file capacity
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

// Render Table Data
function renderPlayerTable() {
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';

    for (let i = 0; i < PLAYER_CONFIG.totalPlayers; i++) {
        const offset = PLAYER_CONFIG.baseOffset + (i * PLAYER_CONFIG.recordSize);
        if (offset + PLAYER_CONFIG.recordSize > globalArrayBuffer.byteLength) break;

        const firstName = readNullTerminatedString(offset + 0x00, 15);
        const lastName = readNullTerminatedString(offset + 0x0F, 15);
        const ratingInside = dataView.getUint8(offset + 0x20);
        const ratingOutside = dataView.getUint8(offset + 0x21);
        const jerseyNumber = dataView.getUint16(offset + 0x24, true);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i}</td>
            <td>${firstName}</td>
            <td>${lastName}</td>
            <td><input type="number" value="${ratingInside}" data-index="${i}" data-field="inside" min="0" max="99"></td>
            <td><input type="number" value="${ratingOutside}" data-index="${i}" data-field="outside" min="0" max="99"></td>
            <td><input type="number" value="${jerseyNumber}" data-index="${i}" data-field="jersey" min="0" max="99"></td>
        `;
        tbody.appendChild(tr);
    }

    // Attach change listeners to inputs
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', handleAttributeChange);
    });
}

function handleAttributeChange(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    const value = parseInt(e.target.value) || 0;
    
    const offset = PLAYER_CONFIG.baseOffset + (index * PLAYER_CONFIG.recordSize);

    if (field === 'inside') {
        dataView.setUint8(offset + 0x20, value);
    } else if (field === 'outside') {
        dataView.setUint8(offset + 0x21, value);
    } else if (field === 'jersey') {
        dataView.setUint16(offset + 0x24, value, true);
    }
}

// Helpers
function readNullTerminatedString(offset, maxLength) {
    const slice = uint8Array.subarray(offset, offset + maxLength);
    const terminator = slice.indexOf(0x00);
    const validBytes = terminator !== -1 ? slice.subarray(0, terminator) : slice;
    return new TextDecoder("windows-1252").decode(validBytes);
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
