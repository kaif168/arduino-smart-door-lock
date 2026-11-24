/*
 * =================================================================================
 * Engineering Project: Arduino-Based Smart Door Lock & Security Monitoring System
 * Firmware: ESP32 Wi-Fi IoT Smart Lock Controller (C++ / Arduino IDE)
 * Author: Senior IoT & Full-Stack Developer
 * Components:
 *   - ESP32 Development Board (Wi-Fi + Microcontroller)
 *   - SG90 / MG996R Servo Motor (Deadbolt Lock Actuator)
 *   - MFRC522 RFID SPI Reader (Contactless Card Entry)
 *   - 4x4 Matrix Keypad (PIN Code Entry)
 *   - 16x2 I2C LCD Display (Local Status Messages)
 *   - Active Buzzer (Audio Alert Tones)
 *   - Green / Red LEDs (Lock Status Visualizers)
 * =================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- Wi-Fi & Web Server Credentials ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* cloudApiEndpoint = "http://192.168.1.100:8080/api/v1/door/log"; // Web Backend API

WebServer server(80);

// --- Pin Assignments ---
#define SERVO_PIN        13
#define BUZZER_PIN       12
#define LED_GREEN_PIN    14
#define LED_RED_PIN      27

#define SS_PIN           5   // MFRC522 RFID SS Pin
#define RST_PIN          0   // MFRC522 RFID Reset Pin

// --- Keypad Configuration (4x4 Matrix) ---
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {32, 33, 25, 26};
byte colPins[COLS] = {17, 16, 4, 15};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Hardware Objects ---
Servo doorServo;
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C Address 0x27

// --- System State Variables ---
bool isLocked = true;
String enteredPin = "";
const String MASTER_PIN = "1234";
const String MASTER_CARD_UID = "A1B2C3D4"; // Replace with your card UID

// --- Servo Angles ---
const int LOCK_ANGLE = 90;
const int UNLOCK_ANGLE = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 Initializing Smart Door Lock System...");

  // Setup I/O Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);

  // Setup LCD Display
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Door Lock");
  lcd.setCursor(0, 1);
  lcd.print("Booting IoT...");

  // Setup Servo Motor
  ESP32PWM::allocateTimer(0);
  doorServo.setPeriodHertz(50);
  doorServo.attach(SERVO_PIN, 500, 2400);

  // Initialize Lock in Sealed State
  applyLockState(true, "System Boot");

  // Setup SPI & RFID
  SPI.begin();
  rfid.PCD_Init();

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("IP: ");
    lcd.print(WiFi.localIP());
  } else {
    Serial.println("\n⚠️ Wi-Fi Offline. Running in Standalone Mode.");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Wi-Fi Offline");
  }

  // Define HTTP REST API Routes
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/door", HTTP_POST, handlePostDoorControl);
  server.begin();
  Serial.println("🌐 HTTP REST API Server Started");

  delay(2000);
  updateLcdStatus();
}

void loop() {
  // Handle Incoming HTTP API Requests
  server.handleClient();

  // Handle RFID Card Scans
  checkRfidScan();

  // Handle Matrix Keypad Input
  checkKeypadInput();
}

// --- Lock Actuator Functions ---
void applyLockState(bool lockState, String triggerSource) {
  isLocked = lockState;
  if (isLocked) {
    doorServo.write(LOCK_ANGLE);
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(LED_GREEN_PIN, LOW);
  } else {
    doorServo.write(UNLOCK_ANGLE);
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, LOW);
  }
  
  playToneBeep(isLocked ? 400 : 1200, 150);
  updateLcdStatus();
  sendTelemetryLog(triggerSource, isLocked ? "LOCKED" : "UNLOCKED");
}

void updateLcdStatus() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SECURITY SYSTEM");
  lcd.setCursor(0, 1);
  if (isLocked) {
    lcd.print("Status: [LOCKED]");
  } else {
    lcd.print("Status: [UNLOCKED]");
  }
}

// --- Keypad Handler ---
void checkKeypadInput() {
  char key = keypad.getKey();
  if (key != NO_KEY) {
    playToneBeep(800, 50);

    if (key == '#') { // Submit Key
      if (enteredPin == MASTER_PIN) {
        lcd.clear();
        lcd.print("ACCESS GRANTED");
        playSuccessMelody();
        applyLockState(!isLocked, "Keypad PIN");
      } else {
        lcd.clear();
        lcd.print("ACCESS DENIED!");
        playDeniedMelody();
        sendTelemetryLog("Keypad Invalid PIN", "DENIED");
      }
      enteredPin = "";
      delay(1500);
      updateLcdStatus();
    } else if (key == '*') { // Clear Key
      enteredPin = "";
      updateLcdStatus();
    } else {
      enteredPin += key;
      lcd.setCursor(0, 1);
      lcd.print("PIN: ");
      for (int i = 0; i < enteredPin.length(); i++) lcd.print("*");
    }
  }
}

// --- RFID Scanner Handler ---
void checkRfidScan() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    cardUid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  Serial.println("💳 Scanned RFID UID: " + cardUid);

  if (cardUid == MASTER_CARD_UID) {
    lcd.clear();
    lcd.print("CARD VERIFIED!");
    playSuccessMelody();
    applyLockState(!isLocked, "RFID Card (" + cardUid + ")");
  } else {
    lcd.clear();
    lcd.print("UNKNOWN CARD!");
    playDeniedMelody();
    sendTelemetryLog("Unregistered RFID " + cardUid, "DENIED");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);
  updateLcdStatus();
}

// --- REST API Endpoints ---
void handleGetStatus() {
  String json = "{\"status\":\"" + String(isLocked ? "LOCKED" : "UNLOCKED") + "\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  server.send(200, "application/json", json);
}

void handlePostDoorControl() {
  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\"error\":\"Body empty\"}");
    return;
  }
  String body = server.arg("plain");
  if (body.indexOf("unlock") >= 0) {
    applyLockState(false, "Web Remote REST API");
    server.send(200, "application/json", "{\"result\":\"unlocked\"}");
  } else if (body.indexOf("lock") >= 0) {
    applyLockState(true, "Web Remote REST API");
    server.send(200, "application/json", "{\"result\":\"locked\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"Invalid action\"}");
  }
}

// --- Audio Tones ---
void playToneBeep(int freq, int duration) {
  tone(BUZZER_PIN, freq, duration);
}

void playSuccessMelody() {
  tone(BUZZER_PIN, 1000, 100);
  delay(120);
  tone(BUZZER_PIN, 2000, 200);
}

void playDeniedMelody() {
  tone(BUZZER_PIN, 250, 200);
  delay(220);
  tone(BUZZER_PIN, 150, 300);
}

// --- Cloud Webhook Sync ---
void sendTelemetryLog(String method, String status) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(cloudApiEndpoint);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"user\":\"" + method + "\",\"status\":\"" + status + "\",\"timestamp\":\"" + String(millis()) + "\"}";
    http.POST(jsonPayload);
    http.end();
  }
}
