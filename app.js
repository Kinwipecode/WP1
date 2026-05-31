/**
 * Dimensionierungshilfe - Online App
 * JavaScript für Tabs, Berechnungen, Auto-Save, Import/Export
 */

// ==========================================
// TAB NAVIGATION
// ==========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        saveToStorage();
    });
});

// ==========================================
// LOCALSTORAGE: AUTO-SAVE & LOAD
// ==========================================
const STORAGE_KEY = 'dimensionierungshilfe_data';

function saveToStorage() {
    const data = collectAllData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        applyAllData(data);
    } catch (e) {
        console.error('Fehler beim Laden:', e);
    }
}

function collectAllData() {
    const data = {};
    
    // Alle Inputs sammeln
    document.querySelectorAll('input').forEach(input => {
        if (input.id) data[input.id] = input.value;
    });
    
    // Alle editierbaren Tabellenzellen sammeln
    document.querySelectorAll('td[contenteditable="true"]').forEach((cell, index) => {
        data[`cell_${index}`] = cell.innerText;
    });
    
    // Aktiver Tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) data._activeTab = activeTab.dataset.tab;
    
    return data;
}

function applyAllData(data) {
    // Inputs wiederherstellen
    Object.keys(data).forEach(key => {
        if (key.startsWith('_')) return;
        if (key.startsWith('cell_')) return;
        const el = document.getElementById(key);
        if (el) el.value = data[key];
    });
    
    // Tabellenzellen wiederherstellen
    document.querySelectorAll('td[contenteditable="true"]').forEach((cell, index) => {
        const key = `cell_${index}`;
        if (data[key] !== undefined) cell.innerText = data[key];
    });
    
    // Aktiver Tab
    if (data._activeTab) {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        const btn = document.querySelector(`.tab-btn[data-tab="${data._activeTab}"]`);
        if (btn) {
            btn.classList.add('active');
            document.getElementById(data._activeTab).classList.add('active');
        }
    }
    
    // Farben für geänderte Werte aktualisieren
    document.querySelectorAll('.input-field').forEach(field => {
        checkValueChanged(field);
    });
}

// Auto-Save bei jeder Änderung
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TD') {
        saveToStorage();
    }
});

document.addEventListener('blur', (e) => {
    if (e.target.tagName === 'TD' && e.target.isContentEditable) {
        saveToStorage();
    }
}, true);

// ==========================================
// BERECHNUNGEN
// ==========================================

// --- SPEICHER BERECHNUNGEN ---
function berechneSpeicher() {
    // Variante 1
    const v1_phiWP = parseFloat(document.getElementById('v1_phiWP').value) || 0;
    const v1_c = parseFloat(document.getElementById('v1_c').value) || 0;
    const v1_t = parseFloat(document.getElementById('v1_t').value) || 0;
    const v1_delta = parseFloat(document.getElementById('v1_delta').value) || 0;
    const v1_rho = parseFloat(document.getElementById('v1_rho').value) || 0;
    const v1_teil = parseFloat(document.getElementById('v1_teil').value) || 1;
    const v1_n = parseFloat(document.getElementById('v1_n').value) || 1;
    
    const v1_volumen = (v1_phiWP * v1_t) / (v1_c * v1_delta * v1_rho * v1_teil * v1_n);
    document.getElementById('v1_volumen').textContent = v1_volumen.toFixed(2) + ' m³';
    document.getElementById('v1_liter').textContent = Math.round(v1_volumen * 1000) + ' Ltr.';
    
    // Variante 2
    const v2_phiWP = parseFloat(document.getElementById('v2_phiWP').value) || 0;
    const v2_c = parseFloat(document.getElementById('v2_c').value) || 0;
    const v2_t = parseFloat(document.getElementById('v2_t').value) || 0;
    const v2_delta = parseFloat(document.getElementById('v2_delta').value) || 0;
    const v2_rho = parseFloat(document.getElementById('v2_rho').value) || 0;
    
    const v2_volumen = (v2_phiWP * 0.5 * v2_t) / (v2_c * v2_delta * v2_rho);
    document.getElementById('v2_volumen').textContent = v2_volumen.toFixed(2) + ' m³';
    document.getElementById('v2_liter').textContent = Math.round(v2_volumen * 1000) + ' Ltr.';
    
    // Aufladezeit Variante 2
    const speicher_inhalt = parseFloat(document.getElementById('speicher_inhalt').value) || 0;
    const aufzeit = (speicher_inhalt * v2_c * v2_delta) / (v2_phiWP * 0.5 * 60);
    document.getElementById('v2_aufzeit').textContent = aufzeit.toFixed(1) + ' min';
}

// --- WÄRMEPUMPE BERECHNUNGEN ---
function berechneWP() {
    const qhgeb = parseFloat(document.getElementById('wp_qhgeb').value) || 0;
    const qhluft = parseFloat(document.getElementById('wp_qhluft').value) || 0;
    const qhww = parseFloat(document.getElementById('wp_qhww').value) || 0;
    
    // Sperrzeit Tag aus Dropdown berechnen
    const sperrSelect = document.getElementById('wp_sperr');
    const sperrValue = sperrSelect.value; // z.B. "2 x 2 h"
    const sperrTag = berechneSperrzeitTag(sperrValue);
    document.getElementById('wp_sperr_tag').value = sperrTag;
    
    const personen = parseFloat(document.getElementById('wp_personen').value) || 0;
    const zuschlag_pp = parseFloat(document.getElementById('wp_zuschlag_pp').value) || 0;
    
    const heizleistung = qhgeb + qhluft + qhww;
    
    const faktor = 24 / (24 - sperrTag);
    document.getElementById('wp_faktor').textContent = faktor.toFixed(2);
    
    const heiz_sperr = heizleistung * faktor;
    document.getElementById('wp_heiz_sperr').textContent = heiz_sperr.toFixed(2) + ' kW';
    document.getElementById('wp_heiz_sperr_calc').textContent = 
        heizleistung.toFixed(1) + ' x ' + faktor.toFixed(2) + ' = ' + heiz_sperr.toFixed(2) + ' kW';
    
    const bww = personen * zuschlag_pp;
    document.getElementById('wp_bww').textContent = bww.toFixed(2) + ' kW';
    document.getElementById('wp_bww_calc').textContent = 
        personen + ' x ' + zuschlag_pp + ' = ' + bww.toFixed(2) + ' kW';
    
    const qwp = heiz_sperr + bww;
    document.getElementById('wp_qh').textContent = heiz_sperr.toFixed(2) + ' kW';
    document.getElementById('wp_qww').textContent = bww.toFixed(2) + ' kW';
    document.getElementById('wp_qwp').textContent = qwp.toFixed(2) + ' kW';
}

function berechneSperrzeitTag(sperrValue) {
    // Format: "1 x 2 h" -> 1 * 2 = 2
    // Format: "2 x 2 h" -> 2 * 2 = 4
    // Format: "3 x 2 h" -> 3 * 2 = 6
    const match = sperrValue.match(/(\d+)\s*x\s*(\d+)/);
    if (match) {
        return parseInt(match[1]) * parseInt(match[2]);
    }
    return 4; // Default
}

// --- ERDSONDE BERECHNUNGEN ---
function berechneErdsonde() {
    const phiWP = parseFloat(document.getElementById('es_phiWP').value) || 0;
    const delta = parseFloat(document.getElementById('es_delta').value) || 0;
    const mmax = parseFloat(document.getElementById('es_mmax').value) || 1;
    
    const mges = phiWP / delta;
    document.getElementById('es_mges').textContent = Math.round(mges) + ' m';
    
    const anzahl = Math.ceil(mges / mmax);
    document.getElementById('es_anzahl').textContent = anzahl + ' Stk.';
    
    const mex = Math.ceil((mges / anzahl) / 5) * 5;
    document.getElementById('es_mex').textContent = mex + ' m';
    
    document.getElementById('es_total').textContent = anzahl + ' x ' + mex + ' m';
}

// Event Listener für Berechnungen
document.querySelectorAll('#speicher input, #wp input, #erdsonde input').forEach(input => {
    input.addEventListener('input', () => {
        berechneSpeicher();
        berechneWP();
        berechneErdsonde();
    });
});

// Dropdown für Sperrzeiten
document.getElementById('wp_sperr').addEventListener('change', () => {
    berechneWP();
});

// ==========================================
// ZURÜCKSETZEN
// ==========================================
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Möchten Sie wirklich alle Daten zurücksetzen?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
});

// ==========================================
// AUF LAUFWERK SPEICHERN (mit File System Access API)
// ==========================================
document.getElementById('saveDiskBtn').addEventListener('click', async () => {
    try {
        // File System Access API verwenden für "Save As" Dialog
        const handle = await window.showSaveFilePicker({
            suggestedName: 'Dimensionierung_Ergebnisse.json',
            types: [{
                description: 'JSON Dateien',
                accept: { 'application/json': ['.json'] }
            }]
        });
        
        const data = collectAllData();
        const json = JSON.stringify(data, null, 2);
        
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        
        showToast('✅ Datei erfolgreich gespeichert!');
    } catch (err) {
        // Abbruch durch Benutzer oder API nicht verfügbar
        if (err.name !== 'AbortError') {
            console.error('Speicherfehler:', err);
            // Fallback auf herkömmlichen Download
            fallbackSave();
        }
    }
});

function fallbackSave() {
    const data = collectAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dimensionierung_Ergebnisse.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ Datei heruntergeladen!');
}

// ==========================================
// IMPORTIEREN
// ==========================================
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        applyAllData(data);
        saveToStorage();
        
        // Farben für geänderte Werte aktualisieren
        document.querySelectorAll('.input-field').forEach(field => {
            checkValueChanged(field);
        });
        
        // Berechnungen neu ausführen
        berechneSpeicher();
        berechneWP();
        berechneErdsonde();
        
        showToast('✅ Datei erfolgreich importiert!');
    } catch (err) {
        console.error('Importfehler:', err);
        showToast('❌ Fehler beim Importieren! Ungültige Datei.', true);
    }
    
    // Input zurücksetzen für erneuten Import
    e.target.value = '';
});

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.4s ease reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==========================================
// DRUCKEN
// ==========================================
document.getElementById('printBtn').addEventListener('click', () => {
    showPrintDialog();
});

function showPrintDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'print-dialog-overlay';
    overlay.innerHTML = `
        <div class="print-dialog">
            <h3>🖨️ Abschnitte zum Drucken wählen</h3>
            <div class="print-options">
                <div class="print-option">
                    <input type="checkbox" id="print-rohre" value="rohre" checked>
                    <label for="print-rohre">Rohre</label>
                </div>
                <div class="print-option">
                    <input type="checkbox" id="print-energie" value="energie" checked>
                    <label for="print-energie">Energie</label>
                </div>
                <div class="print-option">
                    <input type="checkbox" id="print-speicher" value="speicher" checked>
                    <label for="print-speicher">Speicher</label>
                </div>
                <div class="print-option">
                    <input type="checkbox" id="print-wp" value="wp" checked>
                    <label for="print-wp">Wärmepumpe</label>
                </div>
                <div class="print-option">
                    <input type="checkbox" id="print-erdsonde" value="erdsonde" checked>
                    <label for="print-erdsonde">Erdsonde</label>
                </div>
            </div>
            <div class="dialog-buttons">
                <button class="btn btn-secondary" id="printCancel">Abbrechen</button>
                <button class="btn btn-primary" id="printConfirm">Drucken</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('printCancel').addEventListener('click', () => {
        overlay.remove();
    });

    document.getElementById('printConfirm').addEventListener('click', () => {
        const selected = [];
        overlay.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            selected.push(cb.value);
        });
        overlay.remove();
        if (selected.length > 0) {
            executePrint(selected);
        } else {
            showToast('❌ Bitte mindestens einen Abschnitt wählen!', true);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function executePrint(sectionIds) {
    // Markiere gewählte Abschnitte für den Druck
    sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.classList.add('print-section');
    });

    // Drucken
    window.print();

    // Aufräumen nach dem Druck
    setTimeout(() => {
        document.querySelectorAll('.print-section').forEach(el => {
            el.classList.remove('print-section');
        });
    }, 1000);
}

// ==========================================
// TASTATUR-NAVIGATION
// ==========================================
document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.classList.contains('input-field')) return;

    const allFields = Array.from(document.querySelectorAll('.input-field'));
    const currentIndex = allFields.indexOf(activeEl);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    switch (e.key) {
        case 'ArrowRight':
            nextIndex = currentIndex + 1;
            e.preventDefault();
            break;
        case 'ArrowLeft':
            nextIndex = currentIndex - 1;
            e.preventDefault();
            break;
        case 'ArrowDown':
            // Nächste Zeile im Grid (ca. 4 Spalten)
            nextIndex = currentIndex + 4;
            e.preventDefault();
            break;
        case 'ArrowUp':
            // Vorherige Zeile im Grid
            nextIndex = currentIndex - 4;
            e.preventDefault();
            break;
        case 'Enter':
            nextIndex = currentIndex + 1;
            e.preventDefault();
            break;
    }

    if (nextIndex >= 0 && nextIndex < allFields.length) {
        allFields[nextIndex].focus();
        // Wenn das Feld im aktiven Tab ist, scrollen
        const nextTab = allFields[nextIndex].closest('.tab-content');
        if (nextTab && !nextTab.classList.contains('active')) {
            // Zum entsprechenden Tab wechseln
            const tabId = nextTab.id;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (btn) {
                btn.classList.add('active');
                nextTab.classList.add('active');
            }
        }
    }
});

// ==========================================
// STANDARDWERTE (GRAU vs. SCHWARZ)
// ==========================================
const defaultValues = {};

function initDefaultValues() {
    document.querySelectorAll('.input-field').forEach(field => {
        if (field.id) {
            defaultValues[field.id] = field.value;
            field.classList.add('default-value');
        }
    });
}

function checkValueChanged(field) {
    if (!field.id) return;
    const original = defaultValues[field.id];
    if (original !== undefined) {
        if (field.value === original) {
            field.classList.add('default-value');
        } else {
            field.classList.remove('default-value');
        }
    }
}

// Event Listener für alle Eingabefelder
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('input-field')) {
        checkValueChanged(e.target);
    }
});

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDefaultValues();
    loadFromStorage();
    berechneSpeicher();
    berechneWP();
    berechneErdsonde();
});
