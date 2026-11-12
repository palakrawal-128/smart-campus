const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let alertHistory = [];

app.post('/api/sos', (req, res) => {
    const { studentId, studentName, latitude, longitude, timestamp } = req.body;
    const newAlert = {
        id: alertHistory.length + 1,
        studentId,
        studentName,
        location: { latitude, longitude },
        time: timestamp || new Date().toISOString(),
        status: 'ACTIVE_EMERGENCY'
    };
    alertHistory.unshift(newAlert);
    console.log(`EMERGENCY: ${studentName} pressed SOS at [${latitude}, ${longitude}]`);
    res.status(200).json({ success: true, message: "Alert dispatched to campus security!" });
});

app.get('/api/alerts', (req, res) => {
    res.json(alertHistory);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));