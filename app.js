/**
 * GeoRose - Geological Data Visualizer (Rose Diagram & QAP Ternary Plotter)
 * Core JavaScript Logic
 */

// ==========================================
// STATE MANAGEMENT
// ==========================================

// Rose Diagram State
let measurements = [];
let plotConfig = {
    binSize: 10,             // degrees (5, 10, 15, or 20)
    mode: 'bidirectional',   // 'bidirectional' or 'unidirectional'
    gridType: 'frequency',   // 'frequency' or 'percentage'
    showMeanVector: true,    // boolean
    theme: 'basalt'          // 'basalt', 'magma', 'emerald', 'sandstone'
};

// QAP Ternary Plotter State
let qapSamples = [];
let qapConfig = {
    rawMode: false           // input is raw weights/counts vs pre-normalized percentages
};

// Active Tab State
let activeTab = 'rose';      // 'rose' or 'qap'

// ==========================================
// DOM ELEMENTS REFERENCE
// ==========================================

// Tab Elements
const tabLinks = document.querySelectorAll('.tab-link');
const tabPanels = document.querySelectorAll('.tab-content-panel');

// Shared Theme Buttons
const themeBtns = document.querySelectorAll('.theme-btn');

// --- Rose Diagram Elements ---
const singleForm = document.getElementById('single-entry-form');
const strikeInput = document.getElementById('strike-input');
const dipInput = document.getElementById('dip-input');
const typeInput = document.getElementById('type-input');
const notesInput = document.getElementById('notes-input');
const bulkInput = document.getElementById('bulk-input');
const importBtn = document.getElementById('import-btn');

const binSizeSelect = document.getElementById('bin-size');
const plotModeSelect = document.getElementById('plot-mode');
const gridTypeSelect = document.getElementById('grid-type');
const meanVectorToggle = document.getElementById('mean-vector-toggle');

const roseContainer = document.getElementById('rose-diagram-container');
const tooltip = document.getElementById('chart-tooltip');

// Rose Stats Elements
const statN = document.getElementById('stat-n');
const statMean = document.getElementById('stat-mean');
const statR = document.getElementById('stat-r');
const statRBar = document.getElementById('stat-r-bar');
const statSD = document.getElementById('stat-sd');
const statMode = document.getElementById('stat-mode');

// Rose Table & Actions
const measurementsBody = document.getElementById('measurements-body');
const clearAllBtn = document.getElementById('clear-all-btn');
const loadSampleBtn = document.getElementById('load-sample-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportSvgBtn = document.getElementById('export-svg-btn');
const exportPngBtn = document.getElementById('export-png-btn');

// --- QAP Ternary Elements ---
const qapForm = document.getElementById('qap-entry-form');
const qapNameInput = document.getElementById('qap-name-input');
const qInput = document.getElementById('q-input');
const aInput = document.getElementById('a-input');
const pInput = document.getElementById('p-input');
const qapNotesInput = document.getElementById('qap-notes-input');
const qapRawToggle = document.getElementById('qap-raw-toggle');

const qapContainer = document.getElementById('qap-diagram-container');

// QAP Stats Elements
const qapStatN = document.getElementById('qap-stat-n');
const qapStatDominant = document.getElementById('qap-stat-dominant');
const qapBreakdownList = document.getElementById('qap-breakdown-list');

// QAP Table & Actions
const qapBody = document.getElementById('qap-body');
const qapClearAllBtn = document.getElementById('qap-clear-all-btn');
const qapLoadSampleBtn = document.getElementById('qap-load-sample-btn');
const qapExportCsvBtn = document.getElementById('qap-export-csv-btn');
const qapExportSvgBtn = document.getElementById('qap-export-svg-btn');
const qapExportPngBtn = document.getElementById('qap-export-png-btn');


// ==========================================
// INITIALIZATION & TAB SWITCHER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching Listeners
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // 2. Setup Theme Switchers
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.getAttribute('data-theme');
            setTheme(theme);
        });
    });

    // 3. Rose Diagram Form & Controls Listeners
    singleForm.addEventListener('submit', handleSingleSubmit);
    importBtn.addEventListener('click', handleBulkImport);
    clearAllBtn.addEventListener('click', clearAllData);
    loadSampleBtn.addEventListener('click', loadDemoDataset);
    exportCsvBtn.addEventListener('click', exportToCSV);
    exportSvgBtn.addEventListener('click', exportToSVG);
    exportPngBtn.addEventListener('click', exportToPNG);

    binSizeSelect.addEventListener('change', (e) => {
        plotConfig.binSize = parseInt(e.target.value);
        updateRoseApp();
    });

    plotModeSelect.addEventListener('change', (e) => {
        plotConfig.mode = e.target.value;
        const label = document.getElementById('strike-label');
        if (plotConfig.mode === 'unidirectional') {
            label.textContent = "Direction / Strike (0-360°)";
        } else {
            label.textContent = "Strike (Azimuth: 0-360°)";
        }
        updateRoseApp();
    });

    gridTypeSelect.addEventListener('change', (e) => {
        plotConfig.gridType = e.target.value;
        updateRoseApp();
    });

    meanVectorToggle.addEventListener('change', (e) => {
        plotConfig.showMeanVector = e.target.checked;
        updateRoseApp();
    });

    // 4. QAP Ternary Form & Controls Listeners
    qapForm.addEventListener('submit', handleQapSubmit);
    qapClearAllBtn.addEventListener('click', clearAllQapData);
    qapLoadSampleBtn.addEventListener('click', loadQapDemoDataset);
    qapExportCsvBtn.addEventListener('click', exportQapToCSV);
    qapExportSvgBtn.addEventListener('click', exportQapToSVG);
    qapExportPngBtn.addEventListener('click', exportQapToPNG);
    
    qapRawToggle.addEventListener('change', (e) => {
        qapConfig.rawMode = e.target.checked;
        // Adjust inputs placeholders
        if (qapConfig.rawMode) {
            qInput.placeholder = "e.g. 150 (grams/counts)";
            aInput.placeholder = "e.g. 200";
            pInput.placeholder = "e.g. 80";
        } else {
            qInput.placeholder = "e.g. 35 (%)";
            aInput.placeholder = "e.g. 45";
            pInput.placeholder = "e.g. 20";
        }
    });

    // 5. Load Cached Data
    loadFromLocalStorage();
    
    // 6. Initial Render of both apps
    updateRoseApp();
    updateQapApp();
});

// Tab Switcher
function switchTab(tabId) {
    activeTab = tabId;
    
    // Toggle active link class
    tabLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Toggle tab panels
    tabPanels.forEach(panel => {
        if (panel.id === `${tabId}-tab-content`) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });

    // Redraw the active chart to make sure sizes and transitions align perfectly
    if (tabId === 'rose') {
        drawRoseDiagram();
    } else {
        drawQapDiagram();
    }
    
    saveToLocalStorage();
}

// Set App Theme
function setTheme(theme) {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    plotConfig.theme = theme;
    
    themeBtns.forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    saveToLocalStorage();
    // Redraw both diagrams to apply theme styling color variables
    drawRoseDiagram();
    drawQapDiagram();
}

// ==========================================
// STATE PERSISTENCE (LOCAL STORAGE)
// ==========================================

function saveToLocalStorage() {
    localStorage.setItem('georose_active_tab', activeTab);
    localStorage.setItem('georose_measurements', JSON.stringify(measurements));
    localStorage.setItem('georose_config', JSON.stringify(plotConfig));
    localStorage.setItem('geoqap_samples', JSON.stringify(qapSamples));
    localStorage.setItem('geoqap_config', JSON.stringify(qapConfig));
}

function loadFromLocalStorage() {
    const savedTab = localStorage.getItem('georose_active_tab');
    const savedMeasures = localStorage.getItem('georose_measurements');
    const savedConfig = localStorage.getItem('georose_config');
    const savedQapSamples = localStorage.getItem('geoqap_samples');
    const savedQapConfig = localStorage.getItem('geoqap_config');
    
    if (savedMeasures) {
        measurements = JSON.parse(savedMeasures);
    }
    
    if (savedConfig) {
        plotConfig = JSON.parse(savedConfig);
        binSizeSelect.value = plotConfig.binSize;
        plotModeSelect.value = plotConfig.mode;
        gridTypeSelect.value = plotConfig.gridType;
        meanVectorToggle.checked = plotConfig.showMeanVector;
        setTheme(plotConfig.theme);
    }

    if (savedQapSamples) {
        qapSamples = JSON.parse(savedQapSamples);
    }

    if (savedQapConfig) {
        qapConfig = JSON.parse(savedQapConfig);
        qapRawToggle.checked = qapConfig.rawMode;
        // trigger change event to adjust placeholders
        qapRawToggle.dispatchEvent(new Event('change'));
    }

    if (savedTab) {
        switchTab(savedTab);
    }
}


// ==========================================
// --- ROSE DIAGRAM SECTION CODE ---
// ==========================================

function updateRoseApp() {
    saveToLocalStorage();
    renderRoseTable();
    calculateCircularStatistics();
    drawRoseDiagram();
}

// Parse strike inputs (handles Azimuth and Quadrant)
function parseStrike(rawStr) {
    let cleaned = rawStr.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return null;

    // 1. Check Quadrant format: N/S [angle] E/W (e.g. N45E, S30.5W, N12W)
    const quadRegex = /^([NS])(\d{1,2}(?:\.\d+)?)([EW])$/;
    const quadMatch = cleaned.match(quadRegex);
    
    if (quadMatch) {
        const start = quadMatch[1];
        const angle = parseFloat(quadMatch[2]);
        const end = quadMatch[3];
        
        if (angle < 0 || angle > 90) return null;
        
        let azimuth = 0;
        if (start === 'N' && end === 'E') {
            azimuth = angle;
        } else if (start === 'S' && end === 'E') {
            azimuth = 180 - angle;
        } else if (start === 'S' && end === 'W') {
            azimuth = 180 + angle;
        } else if (start === 'N' && end === 'W') {
            azimuth = 360 - angle;
        }
        
        return (azimuth + 360) % 360;
    }

    // 2. Check Azimuth numeric format (e.g. 045, 270, 360)
    if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
        let val = parseFloat(cleaned);
        return (val % 360 + 360) % 360;
    }

    return null;
}

// Format azimuth to Quadrant notation (e.g. 045 -> N45E)
function formatToQuadrant(azimuth) {
    const angle = (azimuth + 360) % 360;
    let quadStr = "";
    
    if (angle >= 0 && angle < 90) {
        quadStr = `N${angle.toFixed(1)}E`;
    } else if (angle >= 90 && angle < 180) {
        quadStr = `S${(180 - angle).toFixed(1)}E`;
    } else if (angle >= 180 && angle < 270) {
        quadStr = `S${(angle - 180).toFixed(1)}W`;
    } else if (angle >= 270 && angle < 360) {
        quadStr = `N${(360 - angle).toFixed(1)}W`;
    }
    
    return quadStr.replace('.0', '');
}

// Format Azimuth for display (e.g., 45 -> 045)
function formatToAzimuth(azimuth) {
    const rounded = Math.round(azimuth * 10) / 10;
    let roundedStr = rounded.toString();
    
    let parts = roundedStr.split('.');
    parts[0] = parts[0].padStart(3, '0');
    return parts.join('.');
}

// Handle Single Strike Submit
function handleSingleSubmit(e) {
    e.preventDefault();
    
    const strikeText = strikeInput.value;
    const dipText = dipInput.value;
    const type = typeInput.value;
    const notes = notesInput.value;
    
    const azimuth = parseStrike(strikeText);
    
    if (azimuth === null) {
        alert("Invalid strike format. Please enter a number (0-360) or a quadrant string (e.g., N45E, S30W).");
        return;
    }
    
    let dipVal = dipText ? parseInt(dipText) : null;
    if (dipVal !== null && (dipVal < 0 || dipVal > 90)) {
        alert("Dip angle must be between 0° and 90°.");
        return;
    }
    
    const newMeasure = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        rawInput: strikeText,
        azimuth: azimuth,
        quadrant: formatToQuadrant(azimuth),
        dip: dipVal,
        type: type,
        notes: notes || '-'
    };
    
    measurements.push(newMeasure);
    
    strikeInput.value = '';
    dipInput.value = '';
    notesInput.value = '';
    strikeInput.focus();
    
    updateRoseApp();
}

// Handle Bulk Import
function handleBulkImport() {
    const rawData = bulkInput.value;
    if (!rawData.trim()) {
        alert("Please paste some strike values first.");
        return;
    }
    
    const tokens = rawData.split(/[\n,;]/);
    let importCount = 0;
    let failCount = 0;
    
    tokens.forEach(token => {
        const cleanedToken = token.trim();
        if (!cleanedToken) return;
        
        const azimuth = parseStrike(cleanedToken);
        if (azimuth !== null) {
            measurements.push({
                id: Date.now() + Math.random().toString(36).substr(2, 5) + importCount,
                rawInput: cleanedToken,
                azimuth: azimuth,
                quadrant: formatToQuadrant(azimuth),
                dip: null,
                type: 'Joint',
                notes: 'Bulk Import'
            });
            importCount++;
        } else {
            failCount++;
        }
    });
    
    bulkInput.value = '';
    
    if (failCount > 0) {
        alert(`Successfully imported ${importCount} strikes. ${failCount} entries could not be parsed.`);
    }
    
    updateRoseApp();
}

function deleteMeasurement(id) {
    measurements = measurements.filter(m => m.id !== id);
    updateRoseApp();
}

function clearAllData() {
    if (confirm("Are you sure you want to clear all measurements? This cannot be undone.")) {
        measurements = [];
        updateRoseApp();
    }
}

function loadDemoDataset() {
    const demoStrikes = [
        { raw: "042", type: "Joint", dip: 75, notes: "Set A" },
        { raw: "045", type: "Joint", dip: 80, notes: "Set A" },
        { raw: "038", type: "Joint", dip: 85, notes: "Set A" },
        { raw: "050", type: "Joint", dip: 72, notes: "Set A" },
        { raw: "044", type: "Joint", dip: 78, notes: "Set A" },
        { raw: "035", type: "Joint", dip: 80, notes: "Set A" },
        { raw: "N42E", type: "Joint", dip: 82, notes: "Set A" },
        { raw: "N48E", type: "Joint", dip: 75, notes: "Set A" },
        { raw: "041", type: "Joint", dip: 80, notes: "Set A" },
        { raw: "046", type: "Joint", dip: 83, notes: "Set A" },
        { raw: "135", type: "Joint", dip: 85, notes: "Set B" },
        { raw: "140", type: "Joint", dip: 88, notes: "Set B" },
        { raw: "130", type: "Joint", dip: 82, notes: "Set B" },
        { raw: "138", type: "Joint", dip: 80, notes: "Set B" },
        { raw: "145", type: "Joint", dip: 75, notes: "Set B" },
        { raw: "132", type: "Joint", dip: 87, notes: "Set B" },
        { raw: "S44E", type: "Joint", dip: 84, notes: "Set B" },
        { raw: "S40E", type: "Joint", dip: 82, notes: "Set B" },
        { raw: "005", type: "Joint", dip: 45, notes: "Minor Set" },
        { raw: "185", type: "Joint", dip: 40, notes: "Minor Set" },
        { raw: "275", type: "Fault", dip: 60, notes: "Main Fault" },
        { raw: "095", type: "Fault", dip: 62, notes: "Fault parallel" }
    ];
    
    measurements = demoStrikes.map((d, index) => {
        const azimuth = parseStrike(d.raw);
        return {
            id: 'demo-' + index,
            rawInput: d.raw,
            azimuth: azimuth,
            quadrant: formatToQuadrant(azimuth),
            dip: d.dip,
            type: d.type,
            notes: d.notes
        };
    });
    
    plotConfig.mode = 'bidirectional';
    plotModeSelect.value = 'bidirectional';
    
    updateRoseApp();
}

function renderRoseTable() {
    measurementsBody.innerHTML = '';
    
    if (measurements.length === 0) {
        measurementsBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table-msg">No data available. Add measurements above or load the demo dataset to begin.</td>
            </tr>
        `;
        return;
    }
    
    measurements.forEach((m, idx) => {
        const tr = document.createElement('tr');
        
        const tdIdx = document.createElement('td');
        tdIdx.textContent = idx + 1;
        
        const tdRaw = document.createElement('td');
        tdRaw.textContent = m.rawInput;
        
        const tdAzi = document.createElement('td');
        tdAzi.textContent = formatToAzimuth(m.azimuth) + '°';
        
        const tdQuad = document.createElement('td');
        tdQuad.textContent = m.quadrant;
        
        const tdDip = document.createElement('td');
        tdDip.textContent = m.dip !== null ? `${m.dip}°` : '-';
        
        const tdType = document.createElement('td');
        tdType.textContent = m.type;
        
        const tdNotes = document.createElement('td');
        tdNotes.textContent = m.notes;
        
        const tdAction = document.createElement('td');
        tdAction.className = 'actions-col';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;
        deleteBtn.addEventListener('click', () => deleteMeasurement(m.id));
        tdAction.appendChild(deleteBtn);
        
        tr.appendChild(tdIdx);
        tr.appendChild(tdRaw);
        tr.appendChild(tdAzi);
        tr.appendChild(tdQuad);
        tr.appendChild(tdDip);
        tr.appendChild(tdType);
        tr.appendChild(tdNotes);
        tr.appendChild(tdAction);
        
        measurementsBody.appendChild(tr);
    });
}

// Circular statistics calculation variables
let globalStats = {
    n: 0,
    meanDirection: null,
    rValue: 0,
    dispersion: null,
    dominantBin: '-'
};

function calculateCircularStatistics() {
    const N = measurements.length;
    globalStats.n = N;
    
    if (N === 0) {
        globalStats.meanDirection = null;
        globalStats.rValue = 0;
        globalStats.dispersion = null;
        globalStats.dominantBin = '-';
        
        statN.textContent = '0';
        statMean.textContent = '-';
        statR.textContent = '-';
        statRBar.style.width = '0%';
        statSD.textContent = '-';
        statMode.textContent = '-';
        return;
    }
    
    let sumCos = 0;
    let sumSin = 0;
    
    if (plotConfig.mode === 'unidirectional') {
        measurements.forEach(m => {
            const rad = m.azimuth * Math.PI / 180;
            sumCos += Math.cos(rad);
            sumSin += Math.sin(rad);
        });
        
        const meanCos = sumCos / N;
        const meanSin = sumSin / N;
        const R = Math.sqrt(meanCos * meanCos + meanSin * meanSin);
        globalStats.rValue = R;
        
        if (R > 0.0001) {
            let meanRad = Math.atan2(meanSin, meanCos);
            let meanDeg = meanRad * 180 / Math.PI;
            globalStats.meanDirection = (meanDeg + 360) % 360;
            
            const sdRad = Math.sqrt(-2 * Math.log(R));
            globalStats.dispersion = sdRad * 180 / Math.PI;
        } else {
            globalStats.meanDirection = null;
            globalStats.dispersion = null;
        }
        
    } else {
        measurements.forEach(m => {
            const doubledRad = (m.azimuth * 2) * Math.PI / 180;
            sumCos += Math.cos(doubledRad);
            sumSin += Math.sin(doubledRad);
        });
        
        const meanCos = sumCos / N;
        const meanSin = sumSin / N;
        const R = Math.sqrt(meanCos * meanCos + meanSin * meanSin);
        globalStats.rValue = R;
        
        if (R > 0.0001) {
            let meanRadDouble = Math.atan2(meanSin, meanCos);
            let meanDegDouble = meanRadDouble * 180 / Math.PI;
            meanDegDouble = (meanDegDouble + 360) % 360;
            
            const meanAngle1 = meanDegDouble / 2;
            globalStats.meanDirection = meanAngle1;
            
            const sdRad = 0.5 * Math.sqrt(-2 * Math.log(R));
            globalStats.dispersion = sdRad * 180 / Math.PI;
        } else {
            globalStats.meanDirection = null;
            globalStats.dispersion = null;
        }
    }
    
    // Find dominant bin (Mode)
    const binSize = plotConfig.binSize;
    const numBins = 360 / binSize;
    const binCounts = new Array(numBins).fill(0);
    
    measurements.forEach(m => {
        const azimuth = m.azimuth;
        const b1 = Math.floor(azimuth / binSize) % numBins;
        binCounts[b1]++;
        
        if (plotConfig.mode === 'bidirectional') {
            const b2 = Math.floor(((azimuth + 180) % 360) / binSize) % numBins;
            binCounts[b2]++;
        }
    });
    
    let maxBinIdx = 0;
    let maxBinCount = 0;
    
    for (let i = 0; i < numBins; i++) {
        if (binCounts[i] > maxBinCount) {
            maxBinCount = binCounts[i];
            maxBinIdx = i;
        }
    }
    
    if (maxBinCount > 0) {
        const startAng = maxBinIdx * binSize;
        const endAng = startAng + binSize;
        
        if (plotConfig.mode === 'unidirectional') {
            globalStats.dominantBin = `${startAng.toFixed(0)}° - ${endAng.toFixed(0)}° (Count: ${maxBinCount})`;
        } else {
            const oppositeStart = (startAng + 180) % 360;
            const oppositeEnd = (endAng + 180) % 360;
            globalStats.dominantBin = `${startAng.toFixed(0)}°-${endAng.toFixed(0)}° / ${oppositeStart.toFixed(0)}°-${oppositeEnd.toFixed(0)}° (Count: ${maxBinCount / 2})`;
        }
    } else {
        globalStats.dominantBin = '-';
    }
    
    // Update DOM
    statN.textContent = N;
    
    if (globalStats.meanDirection !== null) {
        if (plotConfig.mode === 'unidirectional') {
            statMean.textContent = `${formatToAzimuth(globalStats.meanDirection)}°`;
        } else {
            const counterpart = (globalStats.meanDirection + 180) % 360;
            statMean.textContent = `${formatToAzimuth(globalStats.meanDirection)}° / ${formatToAzimuth(counterpart)}°`;
        }
    } else {
        statMean.textContent = '-';
    }
    
    statR.textContent = globalStats.rValue.toFixed(3);
    statRBar.style.width = `${(globalStats.rValue * 100).toFixed(0)}%`;
    
    if (globalStats.dispersion !== null && !isNaN(globalStats.dispersion)) {
        statSD.textContent = `${globalStats.dispersion.toFixed(1)}°`;
    } else {
        statSD.textContent = '-';
    }
    
    statMode.textContent = globalStats.dominantBin;
}

function drawRoseDiagram() {
    roseContainer.innerHTML = '';
    
    const binSize = plotConfig.binSize;
    const numBins = 360 / binSize;
    const counts = new Array(numBins).fill(0);
    
    measurements.forEach(m => {
        const binIndex = Math.floor(m.azimuth / binSize) % numBins;
        counts[binIndex]++;
        
        if (plotConfig.mode === 'bidirectional') {
            const oppBinIndex = Math.floor(((m.azimuth + 180) % 360) / binSize) % numBins;
            counts[oppBinIndex]++;
        }
    });
    
    const totalPoints = measurements.length;
    const maxCount = Math.max(...counts, 1);
    
    const svgSize = 400;
    const center = svgSize / 2;
    const gridRadius = 160;
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);
    svg.setAttribute("class", "rose-svg");
    svg.setAttribute("id", "rose-svg-element");
    
    const outerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerRing.setAttribute("cx", center);
    outerRing.setAttribute("cy", center);
    outerRing.setAttribute("r", gridRadius);
    outerRing.setAttribute("class", "rose-compass-bg");
    svg.appendChild(outerRing);
    
    const numGridRings = 4;
    for (let i = 1; i <= numGridRings; i++) {
        const r = (gridRadius / numGridRings) * i;
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", center);
        ring.setAttribute("cy", center);
        ring.setAttribute("r", r);
        ring.setAttribute("class", "rose-grid-circle");
        svg.appendChild(ring);
        
        let labelValue = "";
        if (plotConfig.gridType === 'frequency') {
            const rawVal = (maxCount / numGridRings) * i;
            labelValue = Number(rawVal.toFixed(1)).toString();
        } else {
            if (totalPoints > 0) {
                const percentVal = ((maxCount / numGridRings) * i / (plotConfig.mode === 'bidirectional' ? totalPoints * 2 : totalPoints)) * 100;
                labelValue = `${percentVal.toFixed(0)}%`;
            } else {
                labelValue = "0%";
            }
        }
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", center);
        label.setAttribute("y", center - r + 8);
        label.setAttribute("class", "rose-grid-text");
        label.textContent = labelValue;
        svg.appendChild(label);
    }
    
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle - 90) * Math.PI / 180;
        const x1 = center;
        const y1 = center;
        const x2 = center + gridRadius * Math.cos(rad);
        const y2 = center + gridRadius * Math.sin(rad);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("class", "rose-grid-line");
        
        if (angle % 90 !== 0) {
            line.setAttribute("stroke-dasharray", "2,4");
        }
        svg.appendChild(line);
        
        if (angle % 30 === 0 && angle !== 0 && angle !== 90 && angle !== 180 && angle !== 270) {
            const textRad = (angle - 90) * Math.PI / 180;
            const tx = center + (gridRadius + 14) * Math.cos(textRad);
            const ty = center + (gridRadius + 14) * Math.sin(textRad);
            
            const numLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            numLabel.setAttribute("x", tx);
            numLabel.setAttribute("y", ty);
            numLabel.setAttribute("class", "rose-grid-text");
            numLabel.setAttribute("font-size", "7px");
            numLabel.textContent = `${angle}°`;
            svg.appendChild(numLabel);
        }
    }
    
    for (let i = 0; i < numBins; i++) {
        const count = counts[i];
        if (count === 0) continue;
        
        const startAngle = i * binSize;
        const endAngle = startAngle + binSize;
        const r = gridRadius * (count / maxCount);
        
        const radStart = (startAngle - 90) * Math.PI / 180;
        const radEnd = (endAngle - 90) * Math.PI / 180;
        
        const xStart = center + r * Math.cos(radStart);
        const yStart = center + r * Math.sin(radStart);
        const xEnd = center + r * Math.cos(radEnd);
        const yEnd = center + r * Math.sin(radEnd);
        
        const pathData = `
            M ${center} ${center}
            L ${xStart} ${yStart}
            A ${r} ${r} 0 0 1 ${xEnd} ${yEnd}
            Z
        `;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("class", "rose-slice");
        
        path.addEventListener('mousemove', (e) => {
            const pct = totalPoints > 0 ? (count / (plotConfig.mode === 'bidirectional' ? totalPoints * 2 : totalPoints)) * 100 : 0;
            const displayCount = plotConfig.mode === 'bidirectional' ? count / 2 : count;
            
            tooltip.classList.remove('hidden');
            tooltip.style.left = `${e.clientX}px`;
            tooltip.style.top = `${e.clientY}px`;
            
            if (plotConfig.mode === 'bidirectional') {
                const startOpp = (startAngle + 180) % 360;
                const endOpp = (endAngle + 180) % 360;
                tooltip.innerHTML = `
                    <strong>Sector:</strong> ${startAngle}°-${endAngle}° & ${startOpp}°-${endOpp}°<br/>
                    <strong>Count:</strong> ${displayCount}<br/>
                    <strong>Percentage:</strong> ${pct.toFixed(1)}%
                `;
            } else {
                tooltip.innerHTML = `
                    <strong>Sector:</strong> ${startAngle}°-${endAngle}°<br/>
                    <strong>Count:</strong> ${displayCount}<br/>
                    <strong>Percentage:</strong> ${pct.toFixed(1)}%
                `;
            }
        });
        
        path.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
        
        svg.appendChild(path);
    }
    
    const labels = [
        { text: 'N', angle: 0 },
        { text: 'E', angle: 90 },
        { text: 'S', angle: 180 },
        { text: 'W', angle: 270 }
    ];
    
    labels.forEach(l => {
        const rad = (l.angle - 90) * Math.PI / 180;
        const rOffset = gridRadius + 18;
        const x = center + rOffset * Math.cos(rad);
        const y = center + rOffset * Math.sin(rad);
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x);
        label.setAttribute("y", y);
        label.setAttribute("class", "rose-compass-label");
        label.textContent = l.text;
        svg.appendChild(label);
    });
    
    if (plotConfig.showMeanVector && globalStats.meanDirection !== null) {
        const vectorLen = gridRadius * globalStats.rValue;
        
        if (vectorLen > 2) {
            const radMean = (globalStats.meanDirection - 90) * Math.PI / 180;
            const meanX = center + vectorLen * Math.cos(radMean);
            const meanY = center + vectorLen * Math.sin(radMean);
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", center);
            line.setAttribute("y1", center);
            line.setAttribute("x2", meanX);
            line.setAttribute("y2", meanY);
            line.setAttribute("class", "rose-mean-vector");
            svg.appendChild(line);
            
            const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            head.setAttribute("cx", meanX);
            head.setAttribute("cy", meanY);
            head.setAttribute("r", "4");
            head.setAttribute("class", "rose-mean-vector-arrow");
            svg.appendChild(head);
            
            if (plotConfig.mode === 'bidirectional') {
                const radMeanOpp = (globalStats.meanDirection + 180 - 90) * Math.PI / 180;
                const meanXOpp = center + vectorLen * Math.cos(radMeanOpp);
                const meanYOpp = center + vectorLen * Math.sin(radMeanOpp);
                
                const lineOpp = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineOpp.setAttribute("x1", center);
                lineOpp.setAttribute("y1", center);
                lineOpp.setAttribute("x2", meanXOpp);
                lineOpp.setAttribute("y2", meanYOpp);
                lineOpp.setAttribute("class", "rose-mean-vector");
                svg.appendChild(lineOpp);
                
                const headOpp = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                headOpp.setAttribute("cx", meanXOpp);
                headOpp.setAttribute("cy", meanYOpp);
                headOpp.setAttribute("r", "4");
                headOpp.setAttribute("class", "rose-mean-vector-arrow");
                svg.appendChild(headOpp);
            }
        }
    }
    
    roseContainer.appendChild(svg);
}

// Rose diagram exports
function exportToCSV() {
    if (measurements.length === 0) {
        alert("No data to export.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Index,Raw Input,Strike Azimuth,Strike Quadrant,Dip,Type,Notes\n";
    measurements.forEach((m, idx) => {
        const row = [idx + 1, `"${m.rawInput}"`, m.azimuth, `"${m.quadrant}"`, m.dip !== null ? m.dip : "", `"${m.type}"`, `"${m.notes.replace(/"/g, '""')}"`].join(",");
        csvContent += row + "\n";
    });
    triggerDownload(csvContent, `georose_data_${Date.now()}.csv`);
}

function exportToSVG() {
    const svgEl = document.getElementById("rose-svg-element");
    if (!svgEl) { alert("No diagram rendered."); return; }
    
    const computedStyles = getComputedStyle(document.body);
    const isSandstone = plotConfig.theme === 'sandstone';
    const canvasBgColor = isSandstone ? '#faf6f0' : '#0c0f13';
    const gridColor = computedStyles.getPropertyValue('--border-color').trim();
    const labelColor = computedStyles.getPropertyValue('--text-primary').trim();
    const mutedColor = computedStyles.getPropertyValue('--text-muted').trim();
    const sliceColor = computedStyles.getPropertyValue('--color-rose-slice').trim();
    const meanColor = computedStyles.getPropertyValue('--color-mean-vector').trim();
    
    const clone = svgEl.cloneNode(true);
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        svg { background: ${canvasBgColor}; font-family: sans-serif; }
        .rose-compass-bg { fill: transparent; }
        .rose-grid-circle { fill: none; stroke: ${gridColor}; stroke-width: 0.8; }
        .rose-grid-line { stroke: ${gridColor}; stroke-width: 0.8; }
        .rose-grid-text { font-size: 8px; fill: ${mutedColor}; text-anchor: middle; dominant-baseline: middle; }
        .rose-slice { fill: ${sliceColor}; stroke: ${canvasBgColor}; stroke-width: 0.5; }
        .rose-mean-vector { stroke: ${meanColor}; stroke-width: 2.5; }
        .rose-mean-vector-arrow { fill: ${meanColor}; }
        .rose-compass-label { font-size: 11px; font-weight: bold; fill: ${labelColor}; text-anchor: middle; dominant-baseline: middle; }
    `;
    clone.insertBefore(styleEl, clone.firstChild);
    
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `georose_diagram_${Date.now()}.svg`, true);
}

function exportToPNG() {
    const svgEl = document.getElementById("rose-svg-element");
    if (!svgEl) { alert("No diagram rendered."); return; }
    
    const computedStyles = getComputedStyle(document.body);
    const isSandstone = plotConfig.theme === 'sandstone';
    const canvasBgColor = isSandstone ? '#faf6f0' : '#0c0f13';
    const gridColor = computedStyles.getPropertyValue('--border-color').trim();
    const labelColor = computedStyles.getPropertyValue('--text-primary').trim();
    const mutedColor = computedStyles.getPropertyValue('--text-muted').trim();
    const sliceColor = computedStyles.getPropertyValue('--color-rose-slice').trim();
    const meanColor = computedStyles.getPropertyValue('--color-mean-vector').trim();

    const clone = svgEl.cloneNode(true);
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        svg { font-family: sans-serif; }
        .rose-compass-bg { fill: transparent; }
        .rose-grid-circle { fill: none; stroke: ${gridColor}; stroke-width: 0.8; }
        .rose-grid-line { stroke: ${gridColor}; stroke-width: 0.8; }
        .rose-grid-text { font-size: 8px; fill: ${mutedColor}; text-anchor: middle; dominant-baseline: middle; }
        .rose-slice { fill: ${sliceColor}; stroke: ${canvasBgColor}; stroke-width: 0.5; }
        .rose-mean-vector { stroke: ${meanColor}; stroke-width: 2.5; }
        .rose-mean-vector-arrow { fill: ${meanColor}; }
        .rose-compass-label { font-size: 11px; font-weight: bold; fill: ${labelColor}; text-anchor: middle; dominant-baseline: middle; }
    `;
    clone.insertBefore(styleEl, clone.firstChild);
    
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 3;
        canvas.width = 400 * scale;
        canvas.height = 400 * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        const pngURL = canvas.toDataURL("image/png");
        triggerDownload(pngURL, `georose_diagram_${Date.now()}.png`);
        URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
}

// ==========================================
// --- QAP TERNARY PLOTTER SECTION CODE ---
// ==========================================

function updateQapApp() {
    saveToLocalStorage();
    renderQapTable();
    calculateQapStatistics();
    drawQapDiagram();
}

// Streckeisen Classification Rules
function classifyQAP(q, a, p) {
    const sum = q + a + p;
    if (sum === 0) return "Unknown";
    
    // Normalize to 100% just in case
    const qNorm = (q / sum) * 100;
    const aNorm = (a / sum) * 100;
    const pNorm = (p / sum) * 100;
    
    // Plagioclase ratio as a percentage of total feldspars
    const pRatio = (aNorm + pNorm) === 0 ? 0 : (pNorm / (aNorm + pNorm)) * 100;
    
    if (qNorm >= 90) {
        return "Quartzolite";
    } else if (qNorm >= 60 && qNorm < 90) {
        return "Quartz-rich Granitoid";
    } else if (qNorm >= 20 && qNorm < 60) {
        // Granitoids
        if (pRatio < 10) return "Alkali Feldspar Granite";
        if (pRatio >= 10 && pRatio < 35) return "Syenogranite";
        if (pRatio >= 35 && pRatio < 65) return "Monzogranite";
        if (pRatio >= 65 && pRatio < 90) return "Granodiorite";
        return "Tonalite";
    } else if (qNorm >= 5 && qNorm < 20) {
        // Quartz-bearing Syenitoids & Dioritoids
        if (pRatio < 10) return "Quartz Alkali Feldspar Syenite";
        if (pRatio >= 10 && pRatio < 35) return "Quartz Syenite";
        if (pRatio >= 35 && pRatio < 65) return "Quartz Monzonite";
        if (pRatio >= 65 && pRatio < 90) return "Quartz Monzodiorite";
        return "Quartz Diorite / Gabbro";
    } else {
        // Saturated Syenitoids & Dioritoids (Q < 5%)
        if (pRatio < 10) return "Alkali Feldspar Syenite";
        if (pRatio >= 10 && pRatio < 35) return "Syenite";
        if (pRatio >= 35 && pRatio < 65) return "Monzonite";
        if (pRatio >= 65 && pRatio < 90) return "Monzodiorite / Monzogabbro";
        return "Diorite / Gabbro / Anorthosite";
    }
}

// Convert Ternary Coordinates to Cartesian Coordinates for SVG
function ternaryToCartesian(qVal, aVal, pVal) {
    const sum = qVal + aVal + pVal;
    if (sum === 0) return { x: 200, y: 223.33 }; // Default to centroid
    
    // Normalized values
    const q = qVal / sum;
    const a = aVal / sum;
    const p = pVal / sum;
    
    // Apex vertices coords:
    // Q = (200, 50)
    // A = (50, 310)
    // P = (350, 310)
    const x = q * 200 + a * 50 + p * 350;
    const y = q * 50 + a * 310 + p * 310;
    
    return { x, y };
}

// Handle QAP Form Submission
function handleQapSubmit(e) {
    e.preventDefault();
    
    const sampleId = qapNameInput.value.trim();
    const qVal = parseFloat(qInput.value);
    const aVal = parseFloat(aInput.value);
    const pVal = parseFloat(pInput.value);
    const notes = qapNotesInput.value.trim() || "-";
    const isRaw = qapRawToggle.checked;
    
    if (isNaN(qVal) || isNaN(aVal) || isNaN(pVal) || qVal < 0 || aVal < 0 || pVal < 0) {
        alert("Mineral values must be positive numbers.");
        return;
    }
    
    const sum = qVal + aVal + pVal;
    if (sum === 0) {
        alert("At least one mineral component must be greater than 0.");
        return;
    }
    
    // If rawMode is off, validate if it sums approximately to 100%, and notify/normalize
    if (!isRaw && Math.abs(sum - 100) > 1.0) {
        // Normalizing anyway but letting user know
        console.log(`Normalizing inputs summing to ${sum} to 100%`);
    }
    
    // Normalize percentages
    const qNorm = (qVal / sum) * 100;
    const aNorm = (aVal / sum) * 100;
    const pNorm = (pVal / sum) * 100;
    const pRatio = (aNorm + pNorm) === 0 ? 0 : (pNorm / (aNorm + pNorm)) * 100;
    
    const classification = classifyQAP(qNorm, aNorm, pNorm);
    
    const newSample = {
        id: 'qap-' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: sampleId,
        rawQ: qVal,
        rawA: aVal,
        rawP: pVal,
        q: qNorm,
        a: aNorm,
        p: pNorm,
        pRatio: pRatio,
        classification: classification,
        notes: notes,
        isRaw: isRaw
    };
    
    qapSamples.push(newSample);
    
    // Reset Form
    qapNameInput.value = '';
    qInput.value = '';
    aInput.value = '';
    pInput.value = '';
    qapNotesInput.value = '';
    qapNameInput.focus();
    
    updateQapApp();
}

// Delete QAP Sample
function deleteQapSample(id) {
    qapSamples = qapSamples.filter(s => s.id !== id);
    updateQapApp();
}

// Clear all QAP Data
function clearAllQapData() {
    if (confirm("Are you sure you want to clear all QAP samples? This cannot be undone.")) {
        qapSamples = [];
        updateQapApp();
    }
}

// Load QAP Demo Dataset
function loadQapDemoDataset() {
    const demoSamples = [
        { name: "AFG-101", q: 35, a: 60, p: 5, notes: "K-Feldspar rich Granite, Pinkish" },
        { name: "SG-205", q: 30, a: 52, p: 18, notes: "Syenogranite, Loc B-2" },
        { name: "MG-12", q: 32, a: 34, p: 34, notes: "Monzogranite, Equigranular" },
        { name: "GD-03", q: 25, a: 20, p: 55, notes: "Granodiorite, Biotite-rich" },
        { name: "TL-5", q: 28, a: 6, p: 66, notes: "Tonalite, Foliated margin" },
        { name: "QS-12", q: 10, a: 65, p: 25, notes: "Quartz Syenite, Coarse" },
        { name: "QM-9", q: 12, a: 44, p: 44, notes: "Quartz Monzonite, Porphyritic" },
        { name: "QD-82", q: 10, a: 8, p: 82, notes: "Quartz Diorite, Loc C-4" },
        { name: "SY-14", q: 2, a: 78, p: 20, notes: "Alkali Feldspar Syenite" },
        { name: "MZ-4", q: 3, a: 48, p: 49, notes: "Monzonite, Loc A-8" },
        { name: "GAB-1", q: 1, a: 2, p: 97, notes: "Gabbro, Dark, Pyroxene-rich" },
        { name: "QZ-01", q: 93, a: 3, p: 4, notes: "Quartzolite, Quartz vein margin" }
    ];
    
    qapSamples = demoSamples.map((d, index) => {
        return {
            id: 'qap-demo-' + index,
            name: d.name,
            rawQ: d.q,
            rawA: d.a,
            rawP: d.p,
            q: d.q,
            a: d.a,
            p: d.p,
            pRatio: (d.a + d.p) === 0 ? 0 : (d.p / (d.a + d.p)) * 100,
            classification: classifyQAP(d.q, d.a, d.p),
            notes: d.notes,
            isRaw: false
        };
    });
    
    updateQapApp();
}

// Render QAP Database Table
function renderQapTable() {
    qapBody.innerHTML = '';
    
    if (qapSamples.length === 0) {
        qapBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table-msg">No rocks analyzed yet. Add compositions above or load the igneous demo dataset.</td>
            </tr>
        `;
        return;
    }
    
    qapSamples.forEach((s, idx) => {
        const tr = document.createElement('tr');
        
        const tdIdx = document.createElement('td');
        tdIdx.textContent = idx + 1;
        
        const tdName = document.createElement('td');
        tdName.textContent = s.name;
        
        const tdRaw = document.createElement('td');
        tdRaw.textContent = `Q:${s.rawQ.toFixed(1)} / A:${s.rawA.toFixed(1)} / P:${s.rawP.toFixed(1)}`;
        
        const tdNorm = document.createElement('td');
        tdNorm.textContent = `Q:${s.q.toFixed(1)}% / A:${s.a.toFixed(1)}% / P:${s.p.toFixed(1)}%`;
        
        const tdRatio = document.createElement('td');
        tdRatio.textContent = `${s.pRatio.toFixed(1)}%`;
        
        const tdClass = document.createElement('td');
        tdClass.textContent = s.classification;
        tdClass.className = 'text-accent';
        
        const tdNotes = document.createElement('td');
        tdNotes.textContent = s.notes;
        
        const tdAction = document.createElement('td');
        tdAction.className = 'actions-col';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;
        deleteBtn.addEventListener('click', () => deleteQapSample(s.id));
        tdAction.appendChild(deleteBtn);
        
        tr.appendChild(tdIdx);
        tr.appendChild(tdName);
        tr.appendChild(tdRaw);
        tr.appendChild(tdNorm);
        tr.appendChild(tdRatio);
        tr.appendChild(tdClass);
        tr.appendChild(tdNotes);
        tr.appendChild(tdAction);
        
        qapBody.appendChild(tr);
    });
}

// Calculate QAP sample statistics
function calculateQapStatistics() {
    const N = qapSamples.length;
    qapStatN.textContent = N;
    
    if (N === 0) {
        qapStatDominant.textContent = '-';
        qapBreakdownList.innerHTML = `<span class="empty-list-msg">No samples plotted yet.</span>`;
        return;
    }
    
    // Compute Counts per Classification
    const counts = {};
    qapSamples.forEach(s => {
        counts[s.classification] = (counts[s.classification] || 0) + 1;
    });
    
    // Dominant Classification
    let dominantName = "";
    let maxCount = 0;
    
    qapBreakdownList.innerHTML = '';
    
    // Sort classifications by counts descending
    const sortedClasses = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    
    sortedClasses.forEach(([name, count], index) => {
        if (index === 0) {
            dominantName = name;
            maxCount = count;
        }
        
        // Create Pill Badge
        const badge = document.createElement('span');
        badge.className = 'breakdown-badge';
        badge.innerHTML = `
            ${name} <span class="count-pill">${count}</span>
        `;
        qapBreakdownList.appendChild(badge);
    });
    
    qapStatDominant.textContent = `${dominantName} (${maxCount})`;
}

// Draw QAP Ternary Diagram SVG
function drawQapDiagram() {
    qapContainer.innerHTML = '';
    
    const svgSize = 400;
    
    // Create main SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);
    svg.setAttribute("class", "rose-svg");
    svg.setAttribute("id", "qap-svg-element");
    
    // Vertices coordinates:
    // Q = (200, 50)
    // A = (50, 310)
    // P = (350, 310)
    const vQ = { x: 200, y: 50 };
    const vA = { x: 50, y: 310 };
    const vP = { x: 350, y: 310 };
    
    // 1. Draw Background Triangle
    const bgTri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    bgTri.setAttribute("points", `${vQ.x},${vQ.y} ${vA.x},${vA.y} ${vP.x},${vP.y}`);
    bgTri.setAttribute("class", "ternary-bg");
    svg.appendChild(bgTri);
    
    // 2. Draw Subtle Ternary Grid Lines (every 20% interval)
    // We draw lines parallel to the three sides
    const gridIntervals = [0.2, 0.4, 0.6, 0.8];
    gridIntervals.forEach(val => {
        // Grid lines parallel to AP base (constant Q lines)
        const leftQ = interpolatePoints(vQ, vA, 1 - val);
        const rightQ = interpolatePoints(vQ, vP, 1 - val);
        drawGridLine(svg, leftQ, rightQ);
        
        // Grid lines parallel to QP side (constant A lines)
        const topA = interpolatePoints(vA, vQ, 1 - val);
        const bottomA = interpolatePoints(vA, vP, 1 - val);
        drawGridLine(svg, topA, bottomA);
        
        // Grid lines parallel to QA side (constant P lines)
        const topP = interpolatePoints(vP, vQ, 1 - val);
        const bottomP = interpolatePoints(vP, vA, 1 - val);
        drawGridLine(svg, topP, bottomP);
    });
    
    // 3. Draw Streckeisen Classifications Field Boundary Lines
    // Q = 90% horizontal boundary
    const leftQ90 = interpolatePoints(vQ, vA, 0.1);
    const rightQ90 = interpolatePoints(vQ, vP, 0.1);
    drawBoundaryLine(svg, leftQ90, rightQ90);
    
    // Q = 60% horizontal boundary
    const leftQ60 = interpolatePoints(vQ, vA, 0.4);
    const rightQ60 = interpolatePoints(vQ, vP, 0.4);
    drawBoundaryLine(svg, leftQ60, rightQ60);
    
    // Q = 20% horizontal boundary
    const leftQ20 = interpolatePoints(vQ, vA, 0.8);
    const rightQ20 = interpolatePoints(vQ, vP, 0.8);
    drawBoundaryLine(svg, leftQ20, rightQ20);
    
    // Q = 5% horizontal boundary
    const leftQ5 = interpolatePoints(vQ, vA, 0.95);
    const rightQ5 = interpolatePoints(vQ, vP, 0.95);
    drawBoundaryLine(svg, leftQ5, rightQ5);
    
    // Plagioclase ratio boundaries: P* = 10%, 35%, 50% (dashed), 65%, 90%
    // Converge at apex Q(200, 50) and hit base at Q=0 (y=310)
    // Points at base (Q=0):
    // P* = 10% -> x = 50 + 0.1 * 300 = 80
    // P* = 35% -> x = 50 + 0.35 * 300 = 155
    // P* = 50% -> x = 50 + 0.5 * 300 = 200
    // P* = 65% -> x = 50 + 0.65 * 300 = 245
    // P* = 90% -> x = 50 + 0.9 * 300 = 320
    
    const pRatios = [
        { ratio: 0.1, dashed: false },
        { ratio: 0.35, dashed: false },
        { ratio: 0.50, dashed: true }, // Syenogranite/Monzogranite splitter
        { ratio: 0.65, dashed: false },
        { ratio: 0.90, dashed: false }
    ];
    
    pRatios.forEach(r => {
        const xBase = 50 + r.ratio * 300;
        const basePoint = { x: xBase, y: 310 };
        // We draw up to the Q = 60% line, which is at y = 154
        const topPoint = interpolatePoints(vQ, basePoint, 0.4); // 40% distance from Q to base
        drawBoundaryLine(svg, basePoint, topPoint, r.dashed);
    });
    
    // 4. Draw Streckeisen Field Background Text Labels (watermarks)
    const fieldLabels = [
        { text: "Quartzolite", x: 200, y: 64 },
        { text: "Qtz-rich Granitoid", x: 200, y: 114 },
        { text: "Alkali Feld. Granite", x: 124, y: 205 },
        { text: "Syenogranite", x: 165, y: 205 },
        { text: "Monzogranite", x: 200, y: 205 },
        { text: "Granodiorite", x: 236, y: 205 },
        { text: "Tonalite", x: 278, y: 205 },
        { text: "Qtz Alk Syenite", x: 138, y: 277 },
        { text: "Qtz Syenite", x: 172, y: 277 },
        { text: "Qtz Monzonite", x: 200, y: 277 },
        { text: "Qtz Monzodiorite", x: 232, y: 277 },
        { text: "Qtz Diorite/Gabbro", x: 280, y: 277 },
        { text: "Alk Syenite", x: 142, y: 303 },
        { text: "Syenite", x: 172, y: 303 },
        { text: "Monzonite", x: 200, y: 303 },
        { text: "Monzodiorite", x: 232, y: 303 },
        { text: "Diorite/Gabbro", x: 282, y: 303 }
    ];
    
    fieldLabels.forEach(fl => {
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", fl.x);
        txt.setAttribute("y", fl.y);
        txt.setAttribute("class", "ternary-field-label");
        txt.textContent = fl.text;
        svg.appendChild(txt);
    });
    
    // 5. Draw Outer Triangle Borders (Thick lines)
    const border = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    border.setAttribute("points", `${vQ.x},${vQ.y} ${vA.x},${vA.y} ${vP.x},${vP.y}`);
    border.setAttribute("class", "ternary-border");
    svg.appendChild(border);
    
    // 6. Draw Corner Vertex Labels (Q, A, P)
    drawCornerLabel(svg, "Q", vQ.x, vQ.y - 12);
    drawCornerLabel(svg, "A", vA.x - 14, vA.y + 14);
    drawCornerLabel(svg, "P", vP.x + 14, vP.y + 14);
    
    // Write full mineral names next to corners as legend
    drawCornerLegend(svg, "(Quartz)", vQ.x, vQ.y - 2);
    drawCornerLegend(svg, "(Alkali Feldspar)", vA.x - 36, vA.y + 24);
    drawCornerLegend(svg, "(Plagioclase)", vP.x + 4, vP.y + 24);
    
    // 7. Plot Sample Data Points
    qapSamples.forEach(sample => {
        const pt = ternaryToCartesian(sample.q, sample.a, sample.p);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pt.x);
        circle.setAttribute("cy", pt.y);
        circle.setAttribute("r", "5.5");
        circle.setAttribute("class", "qap-point");
        
        // Add interactivity and tooltips
        circle.addEventListener('mousemove', (e) => {
            tooltip.classList.remove('hidden');
            tooltip.style.left = `${e.clientX}px`;
            tooltip.style.top = `${e.clientY}px`;
            tooltip.innerHTML = `
                <strong>Sample:</strong> ${sample.name}<br/>
                <strong>Class:</strong> ${sample.classification}<br/>
                <strong>Composition:</strong><br/>
                - Q (Quartz): ${sample.q.toFixed(1)}%<br/>
                - A (Alkali Feld.): ${sample.a.toFixed(1)}%<br/>
                - P (Plagioclase): ${sample.p.toFixed(1)}%<br/>
                - Plag. Ratio (P*): ${sample.pRatio.toFixed(1)}%<br/>
                <strong>Notes:</strong> ${sample.notes}
            `;
        });
        
        circle.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
        
        svg.appendChild(circle);
        
        // Text tag next to the dot (Sample ID label)
        const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelText.setAttribute("x", pt.x + 8);
        labelText.setAttribute("y", pt.y + 3);
        labelText.setAttribute("class", "qap-point-label");
        labelText.textContent = sample.name;
        svg.appendChild(labelText);
    });
    
    qapContainer.appendChild(svg);
}

// Helpers for Ternary Layout Calculations
function interpolatePoints(p1, p2, ratio) {
    return {
        x: p1.x + ratio * (p2.x - p1.x),
        y: p1.y + ratio * (p2.y - p1.y)
    };
}

function drawGridLine(svg, p1, p2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("class", "ternary-grid");
    svg.appendChild(line);
}

function drawBoundaryLine(svg, p1, p2, dashed = false) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("class", `ternary-field-boundary${dashed ? ' dashed' : ''}`);
    svg.appendChild(line);
}

function drawCornerLabel(svg, text, x, y) {
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x);
    lbl.setAttribute("y", y);
    lbl.setAttribute("class", "ternary-label-outer");
    lbl.setAttribute("text-anchor", "middle");
    lbl.textContent = text;
    svg.appendChild(lbl);
}

function drawCornerLegend(svg, text, x, y) {
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x);
    lbl.setAttribute("y", y);
    lbl.setAttribute("class", "ternary-label-legend");
    lbl.textContent = text;
    svg.appendChild(lbl);
}

// QAP data exports
function exportQapToCSV() {
    if (qapSamples.length === 0) {
        alert("No samples to export.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Index,Sample ID,Raw Q,Raw A,Raw P,Normalized Q (%),Normalized A (%),Normalized P (%),Plagioclase Ratio P* (%),Classification,Field Notes\n";
    
    qapSamples.forEach((s, idx) => {
        const row = [
            idx + 1,
            `"${s.name}"`,
            s.rawQ,
            s.rawA,
            s.rawP,
            s.q.toFixed(2),
            s.a.toFixed(2),
            s.p.toFixed(2),
            s.pRatio.toFixed(2),
            `"${s.classification}"`,
            `"${s.notes.replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
    });
    
    triggerDownload(csvContent, `geoqap_data_${Date.now()}.csv`);
}

function exportQapToSVG() {
    const svgEl = document.getElementById("qap-svg-element");
    if (!svgEl) { alert("No diagram rendered."); return; }
    
    const computedStyles = getComputedStyle(document.body);
    const isSandstone = plotConfig.theme === 'sandstone';
    const canvasBgColor = isSandstone ? '#faf6f0' : '#0c0f13';
    
    const gridColor = computedStyles.getPropertyValue('--border-color').trim();
    const labelColor = computedStyles.getPropertyValue('--text-primary').trim();
    const mutedColor = computedStyles.getPropertyValue('--text-muted').trim();
    const tBorder = computedStyles.getPropertyValue('--color-ternary-border').trim();
    const tGrid = computedStyles.getPropertyValue('--color-ternary-grid').trim();
    const accentColor = computedStyles.getPropertyValue('--text-accent').trim();
    
    const clone = svgEl.cloneNode(true);
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        svg { background: ${canvasBgColor}; font-family: sans-serif; }
        .ternary-bg { fill: rgba(0,0,0,0.1); }
        .ternary-border { fill: none; stroke: ${tBorder}; stroke-width: 2; }
        .ternary-grid { fill: none; stroke: ${tGrid}; stroke-width: 0.7; stroke-dasharray: 2,4; }
        .ternary-field-boundary { fill: none; stroke: ${tBorder}; stroke-width: 1.2; }
        .ternary-field-boundary.dashed { stroke-dasharray: 4,4; }
        .ternary-label-outer { font-size: 14px; font-weight: bold; fill: ${accentColor}; }
        .ternary-label-legend { font-size: 9px; font-weight: 600; fill: ${mutedColor}; }
        .ternary-field-label { font-size: 8px; font-weight: 600; fill: ${labelColor}; opacity: 0.95; text-anchor: middle; paint-order: stroke fill; stroke: ${canvasBgColor}; stroke-width: 3px; stroke-linejoin: round; }
        .qap-point-label { font-size: 8.5px; font-weight: bold; fill: ${labelColor}; paint-order: stroke fill; stroke: ${canvasBgColor}; stroke-width: 3px; stroke-linejoin: round; }
        .qap-point { fill: ${accentColor}; stroke: ${canvasBgColor}; stroke-width: 1; }
    `;
    clone.insertBefore(styleEl, clone.firstChild);
    
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `geoqap_diagram_${Date.now()}.svg`, true);
}

function exportQapToPNG() {
    const svgEl = document.getElementById("qap-svg-element");
    if (!svgEl) { alert("No diagram rendered."); return; }
    
    const computedStyles = getComputedStyle(document.body);
    const isSandstone = plotConfig.theme === 'sandstone';
    const canvasBgColor = isSandstone ? '#faf6f0' : '#0c0f13';
    
    const gridColor = computedStyles.getPropertyValue('--border-color').trim();
    const labelColor = computedStyles.getPropertyValue('--text-primary').trim();
    const mutedColor = computedStyles.getPropertyValue('--text-muted').trim();
    const tBorder = computedStyles.getPropertyValue('--color-ternary-border').trim();
    const tGrid = computedStyles.getPropertyValue('--color-ternary-grid').trim();
    const accentColor = computedStyles.getPropertyValue('--text-accent').trim();

    const clone = svgEl.cloneNode(true);
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        svg { font-family: sans-serif; }
        .ternary-bg { fill: rgba(0,0,0,0.1); }
        .ternary-border { fill: none; stroke: ${tBorder}; stroke-width: 2; }
        .ternary-grid { fill: none; stroke: ${tGrid}; stroke-width: 0.7; stroke-dasharray: 2,4; }
        .ternary-field-boundary { fill: none; stroke: ${tBorder}; stroke-width: 1.2; }
        .ternary-field-boundary.dashed { stroke-dasharray: 4,4; }
        .ternary-label-outer { font-size: 14px; font-weight: bold; fill: ${accentColor}; }
        .ternary-label-legend { font-size: 9px; font-weight: 600; fill: ${mutedColor}; }
        .ternary-field-label { font-size: 8px; font-weight: 600; fill: ${labelColor}; opacity: 0.95; text-anchor: middle; paint-order: stroke fill; stroke: ${canvasBgColor}; stroke-width: 3px; stroke-linejoin: round; }
        .qap-point-label { font-size: 8.5px; font-weight: bold; fill: ${labelColor}; paint-order: stroke fill; stroke: ${canvasBgColor}; stroke-width: 3px; stroke-linejoin: round; }
        .qap-point { fill: ${accentColor}; stroke: ${canvasBgColor}; stroke-width: 1; }
    `;
    clone.insertBefore(styleEl, clone.firstChild);
    
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 3;
        canvas.width = 400 * scale;
        canvas.height = 400 * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        const pngURL = canvas.toDataURL("image/png");
        triggerDownload(pngURL, `geoqap_diagram_${Date.now()}.png`);
        URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
}

// ==========================================
// SHARED DOWNLOADING UTILITY
// ==========================================
function triggerDownload(uri, filename, isBlobURL = false) {
    const link = document.createElement("a");
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (isBlobURL) {
        URL.revokeObjectURL(uri);
    }
}
