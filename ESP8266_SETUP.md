# ESP8266 Hardware Setup Guide - AMPIFY

## 📡 Hardware Connection Guide

### Required Components:
- ESP8266 (NodeMCU/Wemos D1 Mini)
- ACS712 Current Sensor (5A/20A/30A module)
- Voltage Divider (for 5V measurement)
- DS18B20 Temperature Sensor (optional)
- Load (device to monitor)
- Power supply (5V)

### Wiring Diagram:

```
ESP8266 Connections:
├── A0 (Analog) ──► ACS712 OUT (Current Sensor)
├── D2 (GPIO4)  ──► DS18B20 DATA (Temperature)
├── D5 (GPIO14) ──► Voltage Divider Output
├── GND ────────► Common Ground
└── 3.3V ───────► Sensor VCC (if needed)

Load Connection:
Power Source ──► ACS712 IN ──► Load ──► ACS712 OUT ──► Ground
```

### Pin Configuration:
| Component | ESP8266 Pin | GPIO | Purpose |
|-----------|-------------|------|---------|
| Current Sensor | A0 | ADC | Analog current reading |
| Temperature | D2 | GPIO4 | OneWire temperature |
| Voltage Divider | D5 | GPIO14 | Voltage measurement |
| Serial TX | TX | GPIO1 | USB communication |
| Serial RX | RX | GPIO3 | USB communication |

## 🔌 WiFi Setup

### Option 1: Direct WiFi Connection (Recommended for Demo)

1. **ESP8266 creates WiFi Access Point**
2. **Your laptop connects to ESP8266 WiFi**
3. **Access dashboard at**: `http://192.168.4.1:3000`

### Option 2: Connect to Existing WiFi

1. **ESP8266 connects to your WiFi**
2. **Find ESP8266 IP address** (check router or serial monitor)
3. **Access dashboard at**: `http://<ESP8266-IP>:3000`

## 📝 ESP8266 Arduino Code

Save this as `ampify_monitor.ino`:

```cpp
#include <ESP8266WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// WiFi Configuration
const char* ssid = "AMPIFY-Monitor";  // AP mode SSID
const char* password = "ampify123";   // AP mode password

// Pin Definitions
#define CURRENT_PIN A0        // ACS712 current sensor
#define VOLTAGE_PIN 14        // D5 - Voltage divider
#define TEMP_PIN 4            // D2 - DS18B20 temperature

// Sensor Calibration
#define ACS712_SENSITIVITY 0.185  // 5A module: 185mV/A
#define ACS712_ZERO_CURRENT 2.5   // Zero current voltage (2.5V)
#define VOLTAGE_DIVIDER_RATIO 5.0 // R1/(R1+R2) for 5V measurement

// Temperature sensor
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// Variables
float current = 0.0;
float voltage = 0.0;
float temperature = 25.0;
bool loadOn = false;
unsigned long startTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Start WiFi Access Point
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  
  Serial.println("\n=== AMPIFY Monitor Started ===");
  Serial.print("WiFi AP: ");
  Serial.println(ssid);
  Serial.print("Password: ");
  Serial.println(password);
  Serial.print("IP Address: ");
  Serial.println(IP);
  Serial.println("Connect to this WiFi and open dashboard");
  Serial.println("=============================\n");
  
  // Initialize temperature sensor
  tempSensor.begin();
  
  startTime = millis();
}

void loop() {
  // Read Current (ACS712)
  int rawCurrent = analogRead(CURRENT_PIN);
  float voltage_adc = (rawCurrent / 1024.0) * 3.3;  // ESP8266 ADC is 0-3.3V
  current = abs((voltage_adc - ACS712_ZERO_CURRENT) / ACS712_SENSITIVITY);
  
  // Read Voltage (Voltage Divider)
  int rawVoltage = analogRead(VOLTAGE_PIN);
  voltage = (rawVoltage / 1024.0) * 3.3 * VOLTAGE_DIVIDER_RATIO;
  
  // Read Temperature
  tempSensor.requestTemperatures();
  temperature = tempSensor.getTempCByIndex(0);
  if (temperature == DEVICE_DISCONNECTED_C) {
    temperature = 25.0;  // Default if sensor not connected
  }
  
  // Determine load status (ON if current > 1.5A)
  loadOn = (current > 1.5);
  
  // Calculate uptime
  unsigned long uptime = (millis() - startTime) / 1000;
  
  // Send data in JSON format via Serial
  Serial.print("{");
  Serial.print("\"current\":");
  Serial.print(current, 2);
  Serial.print(",\"voltage\":");
  Serial.print(voltage, 2);
  Serial.print(",\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"load\":");
  Serial.print(loadOn ? "true" : "false");
  Serial.print(",\"overcurrent\":");
  Serial.print(current > 2.5 ? "true" : "false");
  Serial.print(",\"uptime\":");
  Serial.print(uptime);
  Serial.println("}");
  
  delay(1000);  // Send data every second
}
```

## 🚀 Quick Start Steps

### 1. Upload Code to ESP8266

```bash
# Using Arduino IDE:
1. Open Arduino IDE
2. Install ESP8266 board support
3. Select Board: "NodeMCU 1.0" or "WeMos D1 R1"
4. Select Port: COM port of ESP8266
5. Upload the code
```

### 2. Connect Hardware

```
1. Connect current sensor to A0
2. Connect temperature sensor to D2
3. Connect voltage divider to D5
4. Connect load through current sensor
5. Power on ESP8266
```

### 3. Connect to ESP8266 WiFi

```
1. Open WiFi settings on your laptop
2. Connect to: "AMPIFY-Monitor"
3. Password: "ampify123"
4. Wait for connection
```

### 4. Start Backend Server

```bash
# Terminal 1: Start backend
cd F:\Projects\Ampify\usb-server
node server.js

# Terminal 2: Start ML service
cd F:\Projects\Ampify\ml-service
py app.py

# Terminal 3: Start Telegram bot
cd F:\Projects\Ampify\telegram-bot
node bot.js

# Terminal 4: Start frontend
cd F:\Projects\Ampify\build-template\src\frontend
npm start
```

### 5. Open Dashboard

```
Open browser: http://localhost:3000
```

## 📊 Expected Dashboard Display

When load is connected and ON:
```
Current: 2.0-2.5A (varies with load)
Voltage: ~5.0V
Temperature: 25-30°C
Load Status: 🟢 ON
Overcurrent: False (unless >2.5A)
Health: 95-100%
```

## 🔧 Troubleshooting

### No Data Showing?
1. Check serial monitor (115200 baud)
2. Verify ESP8266 is sending JSON data
3. Check COM port in backend server
4. Restart backend server

### WiFi Not Connecting?
1. Check SSID: "AMPIFY-Monitor"
2. Check password: "ampify123"
3. Restart ESP8266
4. Check ESP8266 is in AP mode

### Current Reading Wrong?
1. Calibrate ACS712_ZERO_CURRENT (measure with no load)
2. Adjust ACS712_SENSITIVITY for your module
3. Check sensor connections

### Load Shows OFF?
1. Check if current > 1.5A
2. Verify load is actually drawing current
3. Check current sensor wiring

## 📱 Telegram Alerts

Once connected:
1. Open Telegram
2. Search: @Amipifymonitor_bot
3. Send: `/start`
4. You'll receive alerts when:
   - Overcurrent detected (>2.5A)
   - Anomalies occur
   - Health degrades
   - Critical faults happen

## 🎯 Calibration Tips

### Current Sensor Calibration:
```cpp
// Measure voltage at A0 with NO load
// Adjust ACS712_ZERO_CURRENT to match
#define ACS712_ZERO_CURRENT 2.5  // Adjust this value
```

### Voltage Calibration:
```cpp
// Measure actual voltage with multimeter
// Adjust VOLTAGE_DIVIDER_RATIO
#define VOLTAGE_DIVIDER_RATIO 5.0  // Adjust this value
```

### Temperature Calibration:
```cpp
// If temperature reads incorrectly:
temperature = tempSensor.getTempCByIndex(0) + OFFSET;
#define OFFSET 0.0  // Adjust offset
```

## 🔐 Security Notes

For production use:
1. Change WiFi password
2. Use WPA2 encryption
3. Add authentication to dashboard
4. Use HTTPS for web access

## 📝 Serial Monitor Output

Expected output:
```
=== AMPIFY Monitor Started ===
WiFi AP: AMPIFY-Monitor
Password: ampify123
IP Address: 192.168.4.1
Connect to this WiFi and open dashboard
=============================

{"current":2.15,"voltage":5.02,"temperature":26.3,"load":true,"overcurrent":false,"uptime":10}
{"current":2.18,"voltage":5.01,"temperature":26.4,"load":true,"overcurrent":false,"uptime":11}
{"current":2.20,"voltage":5.03,"temperature":26.5,"load":true,"overcurrent":false,"uptime":12}
```

## ✅ Ready to Demo!

Your system is now ready for wireless monitoring:
- ✅ ESP8266 creates WiFi hotspot
- ✅ Real sensor data transmitted
- ✅ Dashboard shows live metrics
- ✅ Telegram alerts active
- ✅ ML predictions working
- ✅ Load status displayed

**Connect your load and watch the dashboard come alive!** 🎉
