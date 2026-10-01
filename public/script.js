// XSS Protection - Escape HTML to prevent script injection
const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Collapsible Section Toggle
window.toggleSection = function(sectionId) {
    const fieldset = document.getElementById(sectionId);
    const content = fieldset.querySelector('.fieldset-content');
    const head = fieldset.querySelector('.sheet-head');

    const opening = content.classList.contains('collapsed');
    content.classList.toggle('collapsed', !opening);
    fieldset.classList.toggle('open', opening);
    if (head) head.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (window.updateMeters) window.updateMeters();
};

// Quick nav - always open the section, then scroll to it
window.quickNav = function(sectionId, event) {
    if (event) event.preventDefault();

    const fieldset = document.getElementById(sectionId);
    const content = fieldset.querySelector('.fieldset-content');
    const head = fieldset.querySelector('.sheet-head');

    content.classList.remove('collapsed');
    fieldset.classList.add('open');
    if (head) head.setAttribute('aria-expanded', 'true');

    setTimeout(() => {
        fieldset.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

// PDU rack rows - tab switching
window.showRack = function(letter) {
    ['a', 'b', 'c', 'd', 'e'].forEach(r => {
        const section = document.getElementById(`rack-${r}-section`);
        if (section) section.style.display = r === letter ? 'block' : 'none';
    });
    document.querySelectorAll('.rack-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.rack === letter);
    });
};

// Auto-save indicator
let autoSaveTimeout;
const showAutoSaveIndicator = () => {
    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'autosave-toast';
        document.body.appendChild(indicator);
    }
    indicator.textContent = 'Auto-saved';
    indicator.classList.add('show');
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
};

// Duty clock in the panel rail
const startClock = () => {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl) return;
    const tick = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
        }
    };
    tick();
    setInterval(tick, 1000);
};

// Section completion meters - lamp + count per section, mirrored in the rail nav
// and the sticky action bar (whole-form reading count)
window.updateMeters = function() {
    let grandFilled = 0;

    document.querySelectorAll('#logbookForm fieldset[data-meter]').forEach(fs => {
        const scope = fs.querySelector('.fieldset-content');
        if (!scope) return;

        let total = 0;
        let filled = 0;
        scope.querySelectorAll('input, select').forEach(input => {
            if (input.type === 'hidden') return;
            if (input.name && input.name.endsWith('_unit')) return;
            const pacFields = input.closest('.pac-fields');
            if (pacFields && pacFields.style.display === 'none') return;
            total++;
            if (input.value && String(input.value).trim() !== '') filled++;
        });
        grandFilled += filled;

        const state = (total > 0 && filled >= total) ? 'lamp-full' : (filled > 0 ? 'lamp-part' : 'lamp-off');

        const count = fs.querySelector('.sheet-count');
        if (count) count.textContent = filled + ' of ' + total;

        const lamp = fs.querySelector('.sheet-lamp');
        if (lamp) {
            lamp.classList.remove('lamp-off', 'lamp-part', 'lamp-full');
            lamp.classList.add(state);
        }

        const dot = document.querySelector('.nav-dot[data-nav="' + fs.dataset.nav + '"]');
        if (dot) {
            dot.classList.remove('lamp-off', 'lamp-part', 'lamp-full');
            dot.classList.add(state);
        }
    });

    const barCount = document.getElementById('bar-count');
    if (barCount) barCount.textContent = String(grandFilled).padStart(3, '0') + ' readings';

    const barLamp = document.querySelector('.bar-lamp');
    if (barLamp) {
        barLamp.classList.remove('lamp-part', 'lamp-full');
        if (grandFilled > 0) barLamp.classList.add('lamp-full');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const CACHE_KEY = 'logbook_cache';
    const form = document.getElementById('logbookForm');
    const timeInput = document.getElementById('log_time');

    // Cache functions
    const saveCache = () => {
        const formData = new FormData(form);
        const data = {
            log_date: document.getElementById('log_date').value,
            log_time: timeInput.value,
            reported_person: document.getElementById('reported_person').value,
            formData: {}
        };
        formData.forEach((value, key) => {
            if (value.trim() !== '') {
                data.formData[key] = value;
            }
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        showAutoSaveIndicator();
    };

    // Expose saveCache globally for inline event handlers
    window.saveCache = saveCache;

    const setRoundStatus = (text) => {
        const status = document.getElementById('round-status');
        if (status) status.textContent = text;
    };

    const loadCache = () => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;

        try {
            const data = JSON.parse(cached);
            if (data.log_date) document.getElementById('log_date').value = data.log_date;
            if (data.log_time) timeInput.value = data.log_time;
            if (data.reported_person) document.getElementById('reported_person').value = data.reported_person;

            if (data.log_time) {
                document.querySelectorAll('.time-btn').forEach(btn => {
                    if (btn.getAttribute('data-time') === data.log_time) {
                        btn.classList.add('active');
                    }
                });
                setRoundStatus(data.log_time);
            }

            if (data.formData) {
                Object.keys(data.formData).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) input.value = data.formData[key];
                });
            }
        } catch (e) {
            console.error('Error loading cache:', e);
        }
    };

    const clearCache = () => {
        localStorage.removeItem(CACHE_KEY);
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) indicator.remove();
    };

    // Auto-save on input changes with debounce
    let saveTimeout;
    form.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveCache, 500);
        if (window.updateMeters) window.updateMeters();
    });
    form.addEventListener('change', () => {
        clearTimeout(saveTimeout);
        saveCache();
        if (window.updateMeters) window.updateMeters();
    });

    // Round time selection
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            timeInput.value = btn.getAttribute('data-time');
            setRoundStatus(btn.getAttribute('data-time'));
            btn.blur(); // Remove focus for better UX
            saveCache();
        });

        // Keyboard accessibility
        btn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Keyboard support for collapsible section headers (buttons handle Enter/Space natively)
    document.querySelectorAll('#logbookForm .sheet-head').forEach(head => {
        if (head.tagName !== 'BUTTON') {
            head.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    head.click();
                }
            });
        }
    });

    let configCounts = JSON.parse(localStorage.getItem('logbook_counts')) || {
        pac: 7,
        rack: 15,
        sensor: 5,
        containment: 2,
        ups: 2
    };

    window.adjustCount = function(type, delta) {
        if (configCounts[type] + delta >= 0) {
            configCounts[type] += delta;
            localStorage.setItem('logbook_counts', JSON.stringify(configCounts));
            renderDynamicSections();
            loadCache();
            if (window.updateMeters) window.updateMeters();
        }
    };

    // Make togglePacFields available globally
    window.togglePacFields = function(id) {
        const statusEl = document.querySelector(`[name="pac_${id}_status"]`);
        if (!statusEl) return;
        const status = statusEl.value;
        const fields = document.getElementById(`pac-fields-${id}`);
        if (!fields) return;
        if (status === 'OFF' || status === '') {
            fields.style.display = 'none';
            // Clear values when OFF
            document.querySelectorAll(`#pac-fields-${id} input`).forEach(input => {
                input.value = '';
            });
        } else {
            fields.style.display = 'block';
        }
        saveCache();
        if (window.updateMeters) window.updateMeters();
    };

    const renderDynamicSections = () => {
        // UPS
        const upsContainer = document.getElementById('ups-container');
        if (upsContainer) {
            upsContainer.innerHTML = '';
            for (let i = 1; i <= configCounts.ups; i++) {
                const letter = String.fromCharCode(64 + i); // 1 = A, 2 = B, etc
                const letterLow = letter.toLowerCase();
                upsContainer.innerHTML += `
                    <div class="unit">
                        <div class="unit-head"><span class="unit-name">UPS #${letter}</span><span class="unit-tag">3 × 3 phases</span></div>
                        <div class="phase-grid">
                            <span class="pg-rowlabel pg-corner"></span>
                            <span class="pg-head"><span class="phase-chip phase-r">R</span></span>
                            <span class="pg-head"><span class="phase-chip phase-y">Y</span></span>
                            <span class="pg-head"><span class="phase-chip phase-b">B</span></span>
                            <span class="pg-rowlabel">Voltage</span>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_voltage_r" inputmode="decimal" aria-label="UPS ${letter} voltage phase R"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_voltage_y" inputmode="decimal" aria-label="UPS ${letter} voltage phase Y"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_voltage_b" inputmode="decimal" aria-label="UPS ${letter} voltage phase B"></div>
                            <span class="pg-rowlabel">Output kVA</span>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_output_r" inputmode="decimal" aria-label="UPS ${letter} output phase R"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_output_y" inputmode="decimal" aria-label="UPS ${letter} output phase Y"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_output_b" inputmode="decimal" aria-label="UPS ${letter} output phase B"></div>
                            <span class="pg-rowlabel">Load A</span>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_load_r" inputmode="decimal" aria-label="UPS ${letter} load phase R"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_load_y" inputmode="decimal" aria-label="UPS ${letter} load phase Y"></div>
                            <div class="input-group"><input type="number" step="any" name="ups_${letterLow}_load_b" inputmode="decimal" aria-label="UPS ${letter} load phase B"></div>
                        </div>
                    </div>`;
            }
        }

        // PAC
        const pacContainer = document.getElementById('pac-container');
        if (pacContainer) {
            pacContainer.innerHTML = '';
            for (let i = 1; i <= configCounts.pac; i++) {
                pacContainer.innerHTML += `
                    <div class="unit pac-unit">
                        <div class="unit-head">
                            <span class="unit-name">PAC ${String(i).padStart(2, '0')}</span>
                            <select name="pac_${i}_status" class="pac-status" data-pac="${i}" onchange="togglePacFields(${i})" aria-label="PAC ${i} status">
                                <option value="">-- Status --</option>
                                <option value="ON">ON</option>
                                <option value="OFF">OFF</option>
                            </select>
                        </div>
                        <div class="pac-fields" id="pac-fields-${i}" style="display:none;">
                            <div class="two-col">
                                <div class="f-stack"><span class="f-label">Temp °C</span><div class="input-group"><input type="number" step="any" inputmode="decimal" name="pac_${i}_temp" placeholder="22.5"></div></div>
                                <div class="f-stack"><span class="f-label">Humidity %</span><div class="input-group"><input type="number" step="any" inputmode="decimal" name="pac_${i}_humid" placeholder="45"></div></div>
                            </div>
                        </div>
                    </div>`;
            }
        }

        // PDU Racks
        const generateRacks = (prefix, count, containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            let rows = '';
            for (let i = 1; i <= count; i++) {
                rows += `
                    <div class="rack-item">
                        <span class="rack-no">${prefix}${i}</span>
                        <div class="input-group"><input type="number" step="any" inputmode="decimal" name="rack_${prefix}${i}_pdua" onchange="saveCache()" aria-label="Rack ${prefix}${i} PDU A" placeholder="A"></div>
                        <div class="input-group"><input type="number" step="any" inputmode="decimal" name="rack_${prefix}${i}_pdub" onchange="saveCache()" aria-label="Rack ${prefix}${i} PDU B" placeholder="B"></div>
                        <div class="rack-unit-wrap"><select name="rack_${prefix}${i}_unit" onchange="saveCache()" aria-label="Unit for rack ${prefix}${i}">
                            <option value="Amps" selected>Amps</option>
                            <option value="kW">kW</option>
                        </select></div>
                    </div>`;
            }
            container.innerHTML = `<div class="rack-list">${rows}</div>`;
        };
        generateRacks('A', configCounts.rack, 'rack-a-container');
        generateRacks('B', configCounts.rack, 'rack-b-container');
        generateRacks('C', configCounts.rack, 'rack-c-container');
        generateRacks('D', configCounts.rack, 'rack-d-container');
        generateRacks('E', configCounts.rack, 'rack-e-container');

        // Sensors
        const sensorContainer = document.getElementById('sensor-container');
        if (sensorContainer) {
            sensorContainer.innerHTML = '';
            for (let i = 1; i <= configCounts.sensor; i++) {
                sensorContainer.innerHTML += `
                    <div class="unit">
                        <div class="unit-head"><span class="unit-name">Sensor ${String(i).padStart(2, '0')}</span><span class="unit-tag">T · RH</span></div>
                        <div class="two-col">
                            <div class="f-stack"><span class="f-label">Temp °C</span><div class="input-group"><input type="number" step="any" inputmode="decimal" name="sensor_${i}_temp" placeholder="23" onchange="saveCache()"></div></div>
                            <div class="f-stack"><span class="f-label">Humidity %</span><div class="input-group"><input type="number" step="any" inputmode="decimal" name="sensor_${i}_humid" placeholder="50" onchange="saveCache()"></div></div>
                        </div>
                    </div>`;
            }
            for (let i = 1; i <= configCounts.containment; i++) {
                sensorContainer.innerHTML += `
                    <div class="unit">
                        <div class="unit-head"><span class="unit-name">Containment ${String(i).padStart(2, '0')}</span><span class="unit-tag">T</span></div>
                        <div class="f-stack"><span class="f-label">Temp °C</span><div class="input-group"><input type="number" step="any" inputmode="decimal" name="containment_${i}_temp" placeholder="25" onchange="saveCache()"></div></div>
                    </div>`;
            }
        }
        
        // Setup blur and input validation events on dynamically generated inputs
        if (typeof validateInput === 'function') {
            form.querySelectorAll('input, select').forEach(input => {
                input.removeEventListener('blur', validateInputWrapper);
                input.addEventListener('blur', validateInputWrapper);
                input.removeEventListener('input', validateInputOnInputWrapper);
                input.addEventListener('input', validateInputOnInputWrapper);
            });
        }
    };

    let validateInputWrapper = function() { if(typeof validateInput === 'function') validateInput(this); };
    let validateInputOnInputWrapper = function() { 
        if (this.classList.contains('invalid') && typeof validateInput === 'function') { validateInput(this); }
    };

    // 4. Input validation with visual feedback (bound after generation so every input is covered)
    const validateInput = (input) => {
        const value = input.value.trim();
        const type = input.type;
        const name = input.name || '';

        // Skip validation for optional fields without values
        if (!value && !name.includes('required')) return;

        let isValid = true;
        let message = '';

        // Number field validation
        if (type === 'number') {
            if (value) {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    isValid = false;
                    message = 'Please enter a valid number';
                } else {
                    // Range validation for specific fields
                    if (name.includes('fuel') && (num < 0 || num > 100)) {
                        isValid = false;
                        message = 'Fuel must be 0-100%';
                    } else if (name.includes('temp') && (num < -20 || num > 60)) {
                        isValid = false;
                        message = 'Temperature out of range';
                    } else if (name.includes('humid') && (num < 0 || num > 100)) {
                        isValid = false;
                        message = 'Humidity must be 0-100%';
                    } else if (name.includes('voltage') && (num < 0 || num > 500)) {
                        isValid = false;
                        message = 'Voltage out of range';
                    } else if (name.includes('current') && (num < 0 || num > 1000)) {
                        isValid = false;
                        message = 'Current out of range';
                    }
                }
            }
        }

        // Apply visual feedback
        const parent = input.closest('.input-group');
        if (parent) {
            let warning = parent.querySelector('.input-warning');
            if (!warning && !isValid) {
                warning = document.createElement('div');
                warning.className = 'input-warning';
                parent.appendChild(warning);
            }
            if (warning) warning.textContent = message;
        }

        if (value) {
            input.classList.toggle('valid', isValid);
            input.classList.toggle('invalid', !isValid);
        } else {
            input.classList.remove('valid', 'invalid');
        }

        return isValid;
    };

    // Initialize dynamic sections and then load cache
    renderDynamicSections();
    loadCache();
    if (window.updateMeters) window.updateMeters();

    // 5. Form Submission (in-form button + sticky action-bar button stay in sync)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const buttons = [...document.querySelectorAll('.btn-submit, .bar-submit')];
        const setButtons = (text, extra) => {
            buttons.forEach(btn => {
                btn.textContent = text;
                btn.classList.add('loading');
                if (extra) btn.classList.add(extra);
                btn.disabled = true;
            });
        };
        const resetButtons = () => {
            buttons.forEach(btn => {
                btn.textContent = 'Record Round';
                btn.classList.remove('loading', 'success');
                btn.disabled = false;
            });
        };
        setButtons('Submitting…');

        if (!timeInput.value) {
            alert('Please select a round time first.');
            resetButtons();
            return;
        }

        const reportedPerson = document.getElementById('reported_person');
        if (!reportedPerson.value.trim()) {
            alert('Please enter the reported person name.');
            reportedPerson.focus();
            resetButtons();
            return;
        }

        const formData = new FormData(e.target);
        const logData = {};
        let filledFields = 0;
        formData.forEach((value, key) => {
            if (value.trim() !== '') {
                logData[key] = value;
                filledFields++;
            }
        });
        if (filledFields === 0) {
            alert('Enter at least one reading before submitting.');
            resetButtons();
            return;
        }

        const payload = {
            log_date: document.getElementById('log_date').value,
            log_time: timeInput.value,
            reported_person: reportedPerson.value.trim(),
            form_data: logData
        };

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                // Show success state on both buttons
                setButtons('✓ Submitted!', 'success');
                setTimeout(() => {
                    try {
                        e.target.reset();
                        clearTime();
                        clearCache();
                        resetButtons();
                        if (window.updateMeters) window.updateMeters();
                    } catch (err) {
                        console.error('Error resetting after submit:', err);
                        resetButtons();
                    }
                }, 1500);
            } else {
                alert('Error: ' + (result.error || 'Failed to submit log'));
                resetButtons();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Please try again.');
            resetButtons();
        }
    });

    // Set today's date only if not in cache
    if (!document.getElementById('log_date').value) {
        document.getElementById('log_date').valueAsDate = new Date();
    }

    // Load cached data after all inputs exist, then light the meters
    loadCache();
    if (window.updateMeters) window.updateMeters();

    // Duty clock
    startClock();

    // Smooth scroll for keyboard navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Close history modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHistory();
        }
    });

    // Print optimization
    window.addEventListener('beforeprint', () => {
        document.querySelectorAll('.no-print').forEach(el => {
            el.style.display = 'none';
        });
    });

    window.addEventListener('afterprint', () => {
        document.querySelectorAll('.no-print').forEach(el => {
            el.style.display = '';
        });
    });
});

function clearTime() {
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('log_time').value = '';
    const status = document.getElementById('round-status');
    if (status) status.textContent = 'Select a round time';
}

async function viewHistory() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const logs = await response.json();

        const container = document.getElementById('history-container');

        // Store logs globally for filtering
        window.allLogs = logs;

        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="history-empty"><p>No rounds on record yet. Complete a round and tap Record Round.</p></div>';
        } else {
            // Add search and filter UI
            container.innerHTML = `
                <div class="search-box">
                    <input type="text" id="history-search" placeholder="Search by date, time, or person..." oninput="filterHistory()">
                </div>
                <div class="filter-group">
                    <select id="filter-date" onchange="filterHistory()">
                        <option value="">All Dates</option>
                    </select>
                    <select id="filter-person" onchange="filterHistory()">
                        <option value="">All Persons</option>
                    </select>
                </div>
                <div id="history-list"></div>
            `;

            // Populate filter dropdowns
            populateFilters(logs);

            // Initial render
            filterHistory();
        }

        document.getElementById('historyModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Error loading history: ' + error.message);
    }
}

function populateFilters(logs) {
    const dateSelect = document.getElementById('filter-date');
    const personSelect = document.getElementById('filter-person');

    const dates = [...new Set(logs.map(l => l.log_date))].sort().reverse();
    const persons = [...new Set(logs.map(l => l.reported_person))].sort();

    dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        dateSelect.appendChild(opt);
    });

    persons.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        personSelect.appendChild(opt);
    });
}

function filterHistory() {
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    const dateFilter = document.getElementById('filter-date').value;
    const personFilter = document.getElementById('filter-person').value;

    const filtered = window.allLogs.filter(log => {
        const matchesSearch = !searchTerm ||
            log.log_date.toLowerCase().includes(searchTerm) ||
            log.log_time.toLowerCase().includes(searchTerm) ||
            (log.reported_person && log.reported_person.toLowerCase().includes(searchTerm));

        const matchesDate = !dateFilter || log.log_date === dateFilter;
        const matchesPerson = !personFilter || log.reported_person === personFilter;

        return matchesSearch && matchesDate && matchesPerson;
    });

    renderHistoryList(filtered);
}

function renderHistoryList(logs) {
    const container = document.getElementById('history-list');

    if (logs.length === 0) {
        container.innerHTML = '<div class="history-empty"><p>No matching logs found.</p></div>';
        return;
    }

    container.innerHTML = logs.map(log => {
        const formattedDate = new Date(log.created_at).toLocaleString([], {
            day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
        return `
            <div class="history-item">
                <div class="history-header">
                    <span>${escapeHtml(log.log_date)}</span>
                    <span>${escapeHtml(log.log_time)}</span>
                    <span>${escapeHtml(log.reported_person)}</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto;">
                    <button class="btn-view-report" onclick="viewReport(${log.id})">Report</button>
                    <button class="btn-delete-report" onclick="deleteLog(${log.id})">Delete</button>
                </div>
                <small class="text-muted" style="flex-basis: 100%; font-size: 11px;">
                    Saved: ${formattedDate}
                </small>
            </div>`;
    }).join('');
}

function closeHistory() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function viewReport(id) {
    try {
        const response = await fetch(`/api/log/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch log');
        }
        const log = await response.json();

        const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;

        const params = new URLSearchParams({
            date: log.log_date,
            time: log.log_time,
            reported: log.reported_person,
            data: JSON.stringify(logData)
        });

        window.open(`/report.html?${params.toString()}`, '_blank');
    } catch (error) {
        console.error('Error loading report:', error);
        alert('Error loading report');
    }
}

async function deleteLog(id) {
    const password = prompt('Enter password to delete this log:');
    if (!password) return;

    if (!confirm('Delete this log? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/log/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || 'Failed to delete');
            return;
        }

        alert('Log deleted successfully.');
        viewHistory();
    } catch (error) {
        console.error('Error deleting log:', error);
        alert('Error deleting log: ' + error.message);
    }
}

// Add window resize handler for responsive adjustments
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Force reflow if needed
        document.body.style.minHeight = window.innerHeight + 'px';
    }, 100);
});

// Service Worker registration (optional, for offline capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    });
}
