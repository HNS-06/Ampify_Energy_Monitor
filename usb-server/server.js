const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 4000;
const TELEGRAM_BOT_URL = 'http://localhost:5001'; // Telegram bot service

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

        // RARE: Overcurrent spike every 2.5 minutes (150 seconds)
        if (simulationCycle % 150 === 0) {
            console.log('🚨 OVERCURRENT SPIKE!');
            current = 2.55 + Math.random() * 0.25;  // 2.55-2.8A (overcurrent)
            voltage = 4.6 + Math.random() * 0.3;
            temperature = 27.5 + Math.random() * 1.5;
            healthDegradation += 5;
        }
        // OCCASIONAL: Near-threshold (every 60 seconds, but not on overcurrent cycles)
        else if (simulationCycle % 60 === 0 && simulationCycle % 150 !== 0 && simulationCycle % 300 !== 0) {
            console.log('⚠️ NEAR THRESHOLD');
            current = 2.35 + Math.random() * 0.15;  // 2.35-2.5A (close but usually safe)
            voltage = 4.8 + Math.random() * 0.2;
            temperature = 26.5 + Math.random() * 1;
            healthDegradation += 1;
        }
        // NORMAL OPERATION (80% of the time)
        else {
            // Realistic normal operation: 2.0-2.5A
            current = 2.0 + Math.random() * 0.5;  // Random between 2.0-2.5A
            voltage = 4.9 + Math.random() * 0.2;   // 4.9-5.1V (normal)
            temperature = 25 + Math.random() * 1.5; // 25-26.5°C (normal)

            // Gradual health recovery during normal operation
            if (healthDegradation > 0) {
                healthDegradation -= 0.2;
            }
        }

        // VERY RARE: Critical fault every 5 minutes (300 seconds)
        if (simulationCycle % 300 === 0) {
            console.log('💥 CRITICAL FAULT - SEVERE OVERCURRENT!');
            current = 2.8 + Math.random() * 0.2; // Severe: 2.8-3.0A
            voltage = 4.3 + Math.random() * 0.2;
            temperature = 30 + Math.random() * 2;
            healthDegradation += 15;
        }

        // Apply health degradation (very subtle effect)
        const degradationFactor = healthDegradation / 100;
        voltage -= degradationFactor * 0.2;
        current += degradationFactor * 0.1;
        temperature += degradationFactor * 0.5;

        latestData = {
            current: Math.max(0, current),
            voltage: Math.max(4.0, Math.min(5.5, voltage)),
            load: current > 1.5,
            overcurrent: current > 2.5,  // Changed threshold to 2.5A
            uptime: process.uptime(),
            temperature: Math.max(20, Math.min(35, temperature)),
            timestamp: Date.now()
        };

        // Reset cycle and recover health gradually
        if (simulationCycle > 600) {  // Every 10 minutes
            simulationCycle = 0;
            healthDegradation = Math.max(0, healthDegradation - 10);
            console.log('🔄 SIMULATION CYCLE RESET - Health recovery');
        }
    }
}, 1000);

// Cache for ML analysis (updated in background)
let cachedMLAnalysis = null;

// Background ML analysis (non-blocking)
setInterval(async () => {
    try {
        const mlResponse = await axios.post('http://localhost:5000/analyze', latestData, {
            timeout: 500
        });
        cachedMLAnalysis = mlResponse.data;

        // Forward alerts to Telegram bot
        if (cachedMLAnalysis && cachedMLAnalysis.alerts && cachedMLAnalysis.alerts.length > 0) {
            cachedMLAnalysis.alerts.forEach(alert => {
                sendTelegramAlert(alert).catch(err => {
                    // Silently fail if bot is not running
                });
            });
        }
    } catch (mlError) {
        // Silently fail, keep using cached data
    }
}, 2000); // Update ML every 2 seconds

// Function to send alerts to Telegram bot
async function sendTelegramAlert(alert) {
    try {
        await axios.post(`${TELEGRAM_BOT_URL}/alert`, alert, {
            timeout: 1000
        });
    } catch (error) {
        // Bot service not available
    }
}

// API Endpoint - INSTANT response with cached ML data
app.get('/api/data', (req, res) => {
    // Return immediately with cached ML data
    const response = {
        ...latestData,
        ml: cachedMLAnalysis
    };
    res.json(response);
});

app.listen(PORT, () => {
    console.log(`USB Bridge Server running on http://localhost:${PORT}`);
});
