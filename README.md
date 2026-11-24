# 🔒 Arduino-Based Smart Door Lock and Security Monitoring System

A complete, modern, full-stack IoT security dashboard and micro-controller integration project built for engineering demonstrations, smart home security monitoring, and hardware control.

---

## 🌟 Key Features

1. **Cyberpunk IoT Dashboard**: Dark navy / charcoal UI with electric cyan glow accents, responsive grid, glassmorphism cards, and status visualizers.
2. **Interactive Door Lock Control**: Animated deadbolt lock ring, real-time lock/unlock toggle, emergency lockdown trigger, and configurable auto-relock timer.
3. **4x4 Matrix Keypad Terminal**: Virtual keypad with masked digital LED display, tactile Web Audio API sound synthesis (key clicks, granted chime, denied buzz, siren alarm).
4. **MFRC522 RFID Scanner Simulator**: Contactless RFID card swipe simulator with master UID verification.
5. **Security Access Audit Trail**: Live event ticker, filterable & searchable log table (by method, status, date), with CSV export capability.
6. **Chart.js Security Analytics**: 24-hour activity line chart, authentication method doughnut chart, and weekly access verdict bar chart.
7. **User & Access Management**: Add/remove authorized users, assign PIN codes, RFID card UIDs, and generate temporary One-Time Passcodes (OTP).
8. **ESP32 Arduino C++ Firmware Hub**: Includes production C++ code (`arduino/esp32_smart_door_lock.ino`), circuit wiring pinouts, and Bill of Materials (BOM).
9. **Zero-Dependency Python Backend**: Lightweight HTTP server + REST API (`server.py`) for out-of-the-box local testing.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio**: Web Audio API (Synthesizer for keypad tones, servo click, and sirens)
- **Charts**: Chart.js 4.x
- **Icons**: FontAwesome 6
- **Database**: Firebase Firestore / LocalStorage Fallback Storage Engine
- **Backend & Hardware Gateway**: Python HTTP & REST API / ESP32 C++ Arduino WebServer

---

## 🔌 Hardware Circuit Pinout (ESP32)

| Component | Component Pin | ESP32 Pin | Function |
| :--- | :--- | :--- | :--- |
| **Servo Motor (Deadbolt)** | Signal (Yellow/Orange) | **GPIO 13** | PWM Deadbolt Lock Actuator |
| **MFRC522 RFID** | SDA / SS | **GPIO 5** | SPI Slave Select |
| **MFRC522 RFID** | RST | **GPIO 0** | Reset Pin |
| **MFRC522 RFID** | SCK / MOSI / MISO | **GPIO 18 / 23 / 19** | Hardware SPI Pins |
| **4x4 Keypad** | Row Pins 1-4 | **GPIO 32, 33, 25, 26** | Matrix Rows |
| **4x4 Keypad** | Column Pins 1-4 | **GPIO 17, 16, 4, 15** | Matrix Columns |
| **LCD 1602 (I2C)** | SDA / SCL | **GPIO 21 / 22** | Status Display |
| **Active Buzzer** | Positive (+) | **GPIO 12** | Audio Alerts |
| **Red LED** | Anode (+) | **GPIO 27** | Locked Indicator |
| **Green LED** | Anode (+) | **GPIO 14** | Unlocked Indicator |

---

## 🚀 Quick Setup & Run Instructions

### Option 1: Launching with Python Server (Recommended)

1. Open PowerShell / Command Prompt.
2. Navigate to the project directory:
   ```bash
   cd "C:\Users\Mohammad Kaif\.gemini\antigravity\scratch\smart-door-lock"
   ```
3. Run the Python backend server:
   ```bash
   python server.py
   ```
4. Open your browser and visit: `http://localhost:8080`

### Option 2: Running Standalone Static Web Page

- Simply double-click `index.html` to open it in any web browser! The built-in LocalStorage fallback engine allows you to test PINs, scan RFID cards, view analytics, and manage users immediately.

---

## 📡 REST API Reference

The project provides the following HTTP endpoints (available when running `server.py` or on the ESP32):

- `GET /api/status`: Returns current lock state (`LOCKED` or `UNLOCKED`)
- `POST /api/door`: Triggers lock or unlock action
  ```json
  { "action": "unlock", "user": "Dr. Mohammad Kaif" }
  ```
- `POST /api/v1/door/log`: Webhook receiver for ESP32 hardware telemetry logs
  ```json
  { "user": "RFID Card (A1B2C3D4)", "status": "Granted" }
  ```

---

## 📜 Default Access Credentials for Testing

- **Master PIN Code**: `1234`
- **Secondary PIN Code**: `5678`
- **Master RFID Tag UID**: `A1B2C3D4`
- **Guest PIN Code**: `9999`
