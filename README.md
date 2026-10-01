# TIMES GLOBAL - Datacenter Operations Logbook

A modern, responsive web application for logging and reporting datacenter operations including temperature, humidity, power, and UPS readings.

## 🎯 Features

- **Modern UI/UX** with gradient backgrounds, smooth animations, and card-based layout
- **Fully Responsive** - optimized for desktop, tablet, and mobile (mobile-first design)
- **Auto-save** to browser's localStorage (works offline)
- **File-based Storage** - JSON file storage, no database required
- **Real-time validation** and user feedback with visual indicators
- **Secure delete** with password protection (configurable)
- **Printable Reports** - detailed report viewer with print-optimized layout
- **PWA Ready** - can be installed on mobile devices
- **Accessible** - keyboard navigation and screen reader support
- **Fast & Lightweight** - total size < 100KB

## 📱 Responsive Breakpoints

- **Desktop**: > 768px - Full layout with side-by-side elements
- **Tablet**: 481px - 768px - Condensed layout
- **Mobile**: ≤ 480px - Single column, stacked elements

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
# or
node server.js
```

### 3. Open Browser
Navigate to: **http://localhost:3000**

**⚠️ Important**: Do NOT open `index.html` directly or use Live Server. Always access through the Node.js server at `localhost:3000` for API functionality.

## 📁 Project Structure

```
loogbook-new/
├── server.js          # Express backend with file/MySQL storage
├── package.json       # Dependencies (mysql2 optional)
├── manifest.json      # PWA manifest
├── README.md          # This file
├── public/
│   ├── index.html     # Main form page
│   ├── report.html    # Report viewer
│   ├── style.css      # Enhanced responsive styles
│   └── script.js      # Frontend logic with auto-save
└── record/            # Data storage (auto-created)
    └── logs.json      # All logged data in JSON format
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `DELETE_PASSWORD` | admin123 | Password for deleting logs |

Set via `.env` file or command line:
```bash
# Windows CMD
set DELETE_PASSWORD=yourpassword && node server.js

# PowerShell
$env:DELETE_PASSWORD="yourpassword"; node server.js

# Linux/Mac
DELETE_PASSWORD=yourpassword node server.js
```

### Switching to MySQL (Optional)

1. Install mysql2: `npm install mysql2`
2. Update `server.js` to use MySQL connection (original code available in git history)
3. Create database and table using `schema.sql`

## 📝 Form Sections

1. **Date & Time** - Date picker + 7 pre-defined time slots
2. **Main Power & UPS** - Gen A/B, Main DB A/B, UPS A/B readings
3. **PAC Readings** - 7 PAC units (ON/OFF, temperature, humidity)
4. **PDU Current** - Racks A-E (15 each) with Amps/kW toggle
5. **Sensors** - 5 Temp/Humidity sensors + 2 containment temps
6. **Submit** - Reporter name, Submit/Clear/History buttons

## 🔐 Security Features

- XSS protection with HTML escaping
- Input sanitization (max 500 characters)
- Rate limiting (100 requests/minute by default)
- Password-protected delete
- Security headers (HSTS, XSS-Protection, etc.)

## 🛠️ API Endpoints

### POST `/api/submit`
Submit a new log entry.

### GET `/api/history`
Get last 50 logs (with metadata only).

### GET `/api/log/:id`
Get full log data by ID.

### DELETE `/api/log/:id`
Delete a log (requires password in request body).

## 🎨 UI/UX Enhancements

- **Auto-save indicator** - Green toast notification when form autosaves
- **Loading states** - Submit button shows progress
- **Success feedback** - Green checkmark after successful submission
- **Confirmation dialogs** - Before destructive actions
- **Smooth animations** - Transitions, hover effects, and modal animations
- **Visual hierarchy** - Clear section headers with accent colors
- **Form validation** - Required field checks before submission
- **Better time selection** - Circular buttons with active state
- **Extended input labels** - Include units (°C, %, etc.)
- **Placeholder text** - Example values in inputs

## ♿ Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels where appropriate
- High contrast mode compatible
- Reduced motion support for animations
- Focus indicators visible
- Screen reader friendly

## 🖨️ Printing

- Click "Print Report" in report view
- Auto-hides UI controls
- Optimized layout for paper
- Clean typography

## 🔧 Development

### Making Changes

1. **Frontend**: Edit files in `public/`
2. **Backend**: Edit `server.js`
3. **Styles**: Modify `public/style.css`
4. Restart server: `Ctrl+C` then `node server.js`

### Debugging

- Check browser console for frontend errors
- Check server console for backend errors
- Network tab in DevTools shows API calls
- `record/logs.json` contains all saved data
- Auto-save cache in localStorage (clear with Clear button)

### Adding New Form Fields

1. Add field name to `ALLOWED_FIELDS` array in `server.js`
2. Add input element to appropriate section in `index.html` or `script.js`
3. Update `report.html` parsing logic to display new field
4. Test thoroughly

## 🐛 Troubleshooting

### "Server error" on submit
- Ensure server is running on **port 3000**
- Access via **http://localhost:3000** (not `file://` or Live Server)
- Check server console for error details
- Verify `record/` folder exists and is writable

### "Too many requests" (429 error)
- Rate limit is 100 requests/minute by default
- Wait a minute or restart server
- Increase `RATE_LIMIT` in `server.js` if needed

### Delete button not working
- Verify `DELETE_PASSWORD` matches (default: `admin123`)
- Check server console for auth errors
- Ensure accessing via server, not Live Server

### Data not persisting
- Check `record/logs.json` exists and is writable
- Check file permissions on `record/` folder
- Verify server has write access
- Check browser console for localStorage issues

### Form inputs not showing
- Clear browser cache (Ctrl+F5)
- Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
- Check script.js loaded correctly

## 📊 Data Storage

Data stored in `record/logs.json` as array of objects:

```json
[
  {
    "id": 1,
    "log_date": "2026-03-01",
    "log_time": "14:00",
    "reported_person": "John Doe",
    "log_data": {
      "gen_a_fuel": "75",
      "sensor_1_temp": "23",
      "sensor_1_humid": "45"
    },
    "created_at": "2026-03-01T10:30:00.000Z"
  }
]
```

Backup: Simply copy the `logs.json` file.

## 📱 PWA Installation

1. Open app in browser (Chrome/Edge recommended)
2. Click install icon in address bar (or "Add to Home Screen")
3. App will work offline (except for form submission)
4. Opens in standalone window without browser UI

## 🎯 Performance

- **Lightweight**: < 100KB total (excluding node_modules)
- **Fast load**: Static assets served efficiently
- **Offline capable**: Form data cached in localStorage
- **Optimized**: Minimal DOM manipulation, debounced auto-save

## 📄 License

ISC

---

**Version**: 2.0 | **Last Updated**: March 2026  
**Developer**: Times Global Team  
**Support**: Check server console for debugging information
