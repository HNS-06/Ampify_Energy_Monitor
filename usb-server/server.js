const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
const axios = require('axios');

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
            // console.log('Recv chunk:', JSON.stringify(raw)); // Raw debug

            buffer += raw;

            // Try to find a JSON object in the buffer
            // Simple split by newline or closing brace logic if data is streamed

            const lines = buffer.split(/[\r\n]+/);
            // Keep the last part which might be incomplete
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                // console.log('Processing line:', line);

                try {
                    if (!line.trim().startsWith('{')) continue; // Skip logs

                    const parsed = JSON.parse(line);
                    // console.log('Valid JSON:', parsed);

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

// Simulation loop for demo/dev mode with DRAMATIC scenarios
let simulationCycle = 0;
let healthDegradation = 0;

setInterval(() => {
    // Only simulate if port is not established OR if no data received for 2s
    const lastUpdate = latestData.timestamp || 0;
    const isStale = (Date.now() - lastUpdate) > 2000;

    if (!port || !port.isOpen || isStale) {
        simulationCycle++;

        // Create different scenarios based on cycle
        let current, voltage, temperature;

        // Every 15 seconds, create an ANOMALY SPIKE
        if (simulationCycle % 15 === 0) {
            console.log('🚨 SIMULATING ANOMALY SPIKE!');
            current = 2.8 + Math.random() * 0.5;  // Overcurrent spike!
            voltage = 4.5 + Math.random() * 0.3;  // Voltage drop!
            temperature = 29 + Math.random() * 3; // Temperature surge!
            healthDegradation += 5; // Degrade health
        }
        // Every 10 seconds, create DEGRADED CONDITIONS
        else if (simulationCycle % 10 === 0) {
            console.log('⚠️ SIMULATING DEGRADED CONDITIONS');
            current = 2.5 + Math.random() * 0.2;
            voltage = 4.7 + Math.random() * 0.4;
            temperature = 27.5 + Math.random() * 1.5;
            healthDegradation += 2;
        }
        // Normal operation with slight variations
        else {
            current = 2.2 + Math.random() * 0.3;
            voltage = 4.9 + Math.random() * 0.3;
            temperature = 25.5 + Math.random() * 1.5;
            // Slowly recover health
            if (healthDegradation > 0) healthDegradation -= 0.5;
        }

        // Every 30 seconds, inject a CRITICAL FAULT
        if (simulationCycle % 30 === 0) {
            console.log('💥 SIMULATING CRITICAL FAULT!');
            current = 3.2; // Severe overcurrent
            voltage = 4.2; // Severe undervoltage
            temperature = 32; // Overheating
            healthDegradation = 50; // Major health hit
        }

        // Apply health degradation to values
        const degradationFactor = healthDegradation / 100;
        voltage -= degradationFactor * 0.5;
        current += degradationFactor * 0.3;
        temperature += degradationFactor * 2;

        latestData = {
            current: Math.max(0, current),
            voltage: Math.max(4.0, Math.min(5.5, voltage)),
            load: current > 1.5,
            overcurrent: current > 2.4,
            uptime: process.uptime(),
            temperature: Math.max(20, Math.min(35, temperature)),
            timestamp: Date.now()
        };

        // Reset cycle and degradation periodically
        if (simulationCycle > 60) {
            simulationCycle = 0;
            healthDegradation = 0;
            console.log('🔄 SIMULATION RESET - Back to normal operation');
        }
    }
}, 1000);

// API Endpoint with ML integration
app.get('/api/data', async (req, res) => {
    try {
        // Try to get ML analysis
        let mlAnalysis = null;
        try {
            const mlResponse = await axios.post('http://localhost:5000/analyze', latestData, {
                timeout: 1000
            });
            mlAnalysis = mlResponse.data;
        } catch (mlError) {
            console.warn('ML service unavailable, returning data without predictions');
        }

        // Combine sensor data with ML predictions
        const response = {
            ...latestData,
            ml: mlAnalysis
        };

        res.json(response);
    } catch (error) {
        console.error('Error in /api/data:', error.message);
        res.json(latestData); // Fallback to basic data
    }
});

app.listen(PORT, () => {
    console.log(`USB Bridge Server running on http://localhost:${PORT}`);
});
