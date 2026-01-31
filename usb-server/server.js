const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Store latest data
let latestData = {
    current: 0,
    voltage: 5.0, // Default 5V system
    load: false,
    overcurrent: false,
    uptime: 0,
    temperature: 25.0
};

let port = null;

// Function to initialize serial connection
async function initSerial() {
    try {
        const ports = await SerialPort.list();
        console.log('Available ports:', ports.map(p => p.path).join(', '));

        // Try to find a likely candidate (CH340, CP210x, or just the first non-system one)
        // Adjust logic as needed. For now, try the first one that looks like a USB serial device.
        const targetPortInfo = ports.find(p => p.manufacturer && (p.manufacturer.includes('Silicon') || p.manufacturer.includes('wch.cn') || p.manufacturer.includes('FTDI'))) || ports[0];

        if (!targetPortInfo) {
            console.log('No serial ports found. Waiting...');
            return;
        }

        console.log(`Attempting to connect to ${targetPortInfo.path}...`);

        port = new SerialPort({
            path: targetPortInfo.path,
            baudRate: 115200 // Standard ESP8266 baud rate
        });

        // RAW DATA HANDLING TO DEBUG
        // const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        // Enable DTR/RTS to reset/wake ESP8266
        // DTR/RTS setup moved to 'open' event to ensure port is ready


        let buffer = '';

        port.on('data', (chunk) => {
            const raw = chunk.toString();
            console.log('Recv chunk:', JSON.stringify(raw)); // Raw debug

            buffer += raw;

            // Try to find a JSON object in the buffer
            // Simple split by newline or closing brace logic if data is streamed

            const lines = buffer.split(/[\r\n]+/);
            // Keep the last part which might be incomplete
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                console.log('Processing line:', line);

                try {
                    if (!line.trim().startsWith('{')) continue; // Skip logs

                    const parsed = JSON.parse(line);
                    console.log('Valid JSON:', parsed);

                    latestData = { ...latestData, ...parsed, timestamp: Date.now() };
                    if (!parsed.uptime) latestData.uptime = process.uptime();
                } catch (e) {
                    console.log('Parse fail:', e.message);
                }
            }
        });

        port.on('open', () => {
            console.log('Serial port opened');
            // Enable DTR/RTS to reset/wake ESP8266
            port.set({ dtr: false, rts: false });
            setTimeout(() => {
                if (port) port.set({ dtr: true, rts: true });
            }, 100);
        });

        port.on('error', (err) => {
            console.error('Serial port error:', err.message);
            port = null;
            setTimeout(initSerial, 5000); // Retry after 5s
        });

        port.on('close', () => {
            console.log('Serial port closed');
            port = null;
            setTimeout(initSerial, 5000); // Retry after 5s
        });

    } catch (err) {
        console.error('Failed to list ports:', err);
        setTimeout(initSerial, 5000);
    }
}

// Start connection
initSerial();

// Simulation loop for demo/dev mode when no device is connected
setInterval(() => {
    // Only simulate if port is not established OR if no data received for 2s
    const lastUpdate = latestData.timestamp || 0;
    const isStale = (Date.now() - lastUpdate) > 2000;

    if (!port || !port.isOpen || isStale) {
        // Mock varying data around 5V / 2.3A
        const voltageNoise = (Math.random() - 0.5) * 0.2; // +/- 0.1V
        const currentNoise = (Math.random() - 0.5) * 0.1; // +/- 0.05A
        const tempNoise = (Math.random() - 0.5) * 0.5;   // +/- 0.25C

        latestData = {
            current: Math.max(0, 2.3 + currentNoise), // Base ~2.3A
            voltage: 5.0 + voltageNoise,             // Base ~5.0V
            load: true,                              // Simulate load active
            overcurrent: false,
            uptime: process.uptime(),
            temperature: 26.0 + tempNoise,
            timestamp: Date.now()
        };
    }
}, 1000);

// API Endpoint
app.get('/api/data', (req, res) => {
    res.json(latestData);
});

app.listen(PORT, () => {
    console.log(`USB Bridge Server running on http://localhost:${PORT}`);
});
