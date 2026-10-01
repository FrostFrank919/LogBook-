const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8800;

app.use(cors());
app.use(bodyParser.json({ limit: '500kb' }));

const RECORD_DIR = path.join(__dirname, 'record');
const DATA_FILE = path.join(RECORD_DIR, 'logs.json');

const validateFieldName = (key) => {
    const patterns = [
        /^gen_[a-z]+_(fuel|hours|load)$/i,
        /^maindb_[a-z]+_(current_[ryb]|ry|yb|br)$/i,
        /^ups_[a-z0-9]+_(voltage|output|load)_[ryb]$/i,
        /^pac_\d+_(status|temp|humid)$/i,
        /^sensor_\d+_(temp|humid)$/i,
        /^containment_\d+_temp$/i,
        /^rack_[A-Z]\d+_(unit|pdua|pdub)$/i
    ];
    return patterns.some(pattern => pattern.test(key));
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>'";&`]/g, '').trim().substring(0, 500);
};

if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR, { recursive: true });
}

const loadLogs = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (err) { console.error(err); }
    return [];
};

const saveLogs = (logs) => fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2));

app.post('/api/submit', (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    
    let { log_date, log_time, reported_person, form_data } = req.body;
    if (!log_date || !log_time || !reported_person) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    log_date = sanitizeInput(log_date);
    log_time = sanitizeInput(log_time);
    reported_person = sanitizeInput(reported_person);

    const sanitizedFormData = {};
    if (form_data && typeof form_data === 'object') {
        for (const key of Object.keys(form_data)) {
            if (!validateFieldName(key)) continue;
            const value = form_data[key];
            if (typeof value === 'string' && value.length > 0) {
                if (key.endsWith('_unit') && value === 'Amps') continue;
                sanitizedFormData[key] = sanitizeInput(value);
            }
        }
    }

    try {
        const logs = loadLogs();
        const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
        logs.push({ id: newId, log_date, log_time, reported_person, log_data: sanitizedFormData, created_at: new Date().toISOString() });
        saveLogs(logs);
        res.status(200).json({ message: 'Log submitted successfully!', id: newId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save log', details: err.message });
    }
});

app.get('/api/history', (req, res) => {
    try {
        const logs = loadLogs();
        const history = logs.map(log => ({
            id: log.id, log_date: log.log_date, log_time: log.log_time,
            reported_person: log.reported_person, created_at: log.created_at
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});


        

app.get('/api/log/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid ID' });
    
    try {
        const log = loadLogs().find(l => l.id === id);
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.status(200).json(log);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch log' });
    }
});

app.delete('/api/log/:id', (req, res) => {
    const { password } = req.body;
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid ID' });

    const deletePassword = process.env.DELETE_PASSWORD || 'admin123';
    if (!password || password !== deletePassword) return res.status(401).json({ error: 'Invalid password' });

    try {
        const logs = loadLogs();
        const index = logs.findIndex(l => l.id === id);
        if (index === -1) return res.status(404).json({ error: 'Log not found' });
        logs.splice(index, 1);
        saveLogs(logs);
        res.status(200).json({ message: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete log' });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data storage: ${DATA_FILE}`);
});
