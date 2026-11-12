const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CAMPUS LOCATION CONFIG (Abhi Jabalpur/Bhopal demo coordinates hain, baad me apne college ke daal sakti hain)
const CAMPUS_CENTER = {
    latitude: 23.1815,   // Apne college ka Latitude yahan daalein
    longitude: 79.9864,  // Apne college ka Longitude yahan daalein
    radiusKm: 2.0        // 2 km ke andar = Inside Campus
};

// Haversine Formula: Do GPS points ke beech distance (km me) nikalne ke liye
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

let alertHistory = [];

// 1. Student SOS Endpoint
app.post('/api/sos', (req, res) => {
    const { studentName, rollNo, contact, category, latitude, longitude } = req.body;

    // Roll number basic check
    if (!rollNo || rollNo.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Invalid College Roll Number!' });
    }

    const distance = calculateDistanceKm(
        CAMPUS_CENTER.latitude,
        CAMPUS_CENTER.longitude,
        latitude,
        longitude
    );

    const isInsideCampus = distance <= CAMPUS_CENTER.radiusKm;

    const newAlert = {
        id: alertHistory.length + 1,
        studentName: studentName || 'Unknown Student',
        rollNo: rollNo.toUpperCase(),
        contact: contact || 'N/A',
        category: category || 'GENERAL',
        location: { latitude, longitude },
        distanceFromCampus: distance.toFixed(2),
        zone: isInsideCampus ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS',
        time: new Date().toLocaleTimeString() + ', ' + new Date().toLocaleDateString(),
        status: 'ACTIVE'
    };

    alertHistory.unshift(newAlert);
    console.log(`[${newAlert.zone}] ${newAlert.category} SOS from ${newAlert.studentName} (${distance.toFixed(2)} km)`);

    res.status(200).json({
        success: true,
        alertId: newAlert.id,
        isInsideCampus,
        distance: distance.toFixed(2)
    });
});

// 2. Single Alert Status Check (Student ke phone par live update dikhane ke liye)
app.get('/api/status/:id', (req, res) => {
    const alert = alertHistory.find(a => a.id === parseInt(req.params.id));
    if (!alert) return res.status(404).json({ status: 'NOT_FOUND' });
    res.json({ status: alert.status });
});

// 3. Guard Dashboard Alerts Fetch
app.get('/api/alerts', (req, res) => {
    res.json(alertHistory);
});

// 4. Guard Action: Dispatch Team ya Resolve
app.post('/api/action', (req, res) => {
    const { id, action } = req.body; // action = 'DISPATCHED' or 'RESOLVED'
    alertHistory = alertHistory.map(alert =>
        alert.id === id ? { ...alert, status: action } : alert
    );
    res.json({ success: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Smart Campus Server live on port ${PORT}`));