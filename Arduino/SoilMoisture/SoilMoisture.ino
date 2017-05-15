#include <ArduinoJson.h>

/*
  Soil moisture test measurements:
    Dry in the air: 999
    Both probe legs submerged in water: 233
    => Lower value means higher moisture
    
  Water level test measurements:
  
    Dry: 0
    Fully submerged in glass of water: 520 (about)
    Submerged just a few millimeters: 380 (about)
    => Scale is between 380 and 520
*/

const short MOISTURE_PROBE_VALUE_PIN = 0; // Soil Moisture Probe Pin, analogue pin 0
const short WATER_LEVEL_VALUE_PIN = 1; // Water Level Probe Pin, analogue pin 1
const short TEMPERATURE_VALUE_PIN = 2; // Temperature sensor, analogue pin 2
const short LIGHT_INTENSITY_VALUE_PIN = 3; // Light intensity sensor, analogue pin 3
const short MOISTURE_PROBE_POWER_PIN = 8; // Use a digital output pin to switch power on/off to the probe when needed
const short WATER_LEVEL_PROBE_POWER_PIN = 7; // Use a digital output pin to switch power on/off to the probe when needed
const short BLUE_LED_PIN = 11;
unsigned long moistureStartTime = millis();
unsigned long tempLightStartTime = millis();
const unsigned long MOISTURE_PROBE_INTERVAL = 10000; // Measurement interval in milliseconds
const unsigned long TEMP_LIGHT_PROBE_INTERVAL = 5000;
const float DRY_THRESHOLD = 500.0; // Values higher than or equal to this means it's time to water
const float WET_THRESHOLD = 350.0; // Values lower than or equal to this means no more watering is needed

void setup() {
  Serial.begin(9600);
  pinMode(MOISTURE_PROBE_POWER_PIN, OUTPUT);
  pinMode(WATER_LEVEL_PROBE_POWER_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
}

float measure(int probe) {
  float value = -1;
  
  switch (probe) { // 1 = moisture, 2 = water level, 3 = temp, 4 = light
    case 1:
      digitalWrite(MOISTURE_PROBE_POWER_PIN, HIGH);
      delay(1000);
      value = analogRead(MOISTURE_PROBE_VALUE_PIN);
      digitalWrite(MOISTURE_PROBE_POWER_PIN, LOW);      
      break;
    case 2:
      digitalWrite(WATER_LEVEL_PROBE_POWER_PIN, HIGH);
      delay(1000);
      value = analogRead(WATER_LEVEL_VALUE_PIN);
      digitalWrite(WATER_LEVEL_PROBE_POWER_PIN, LOW);
      break;
    case 3:
      value = analogRead(TEMPERATURE_VALUE_PIN);
      break;
    case 4:
      value = analogRead(LIGHT_INTENSITY_VALUE_PIN);
      break;
    default:
      Serial.println("Invalid probe: " + probe);
      break;
  }
  
  return value;
}

void loop() {
  
  unsigned long now = millis();
    
  if ((now - tempLightStartTime) >= TEMP_LIGHT_PROBE_INTERVAL) {
    float temperatureValue = measure(3);
    float lightValue = measure(4);
    float temperature = 3.3 + ((5.0 * temperatureValue / 1024.0) - .5) * 100.0; // Convert sensor reading to voltage and then to temperature    
    outputSensorReading("photo", lightValue);
    outputSensorReading("temp", temperature);
    tempLightStartTime = millis();
  }

  if ((now - moistureStartTime) >= MOISTURE_PROBE_INTERVAL) {
    float moisture = measure(1);
    float waterLevel = measure(2);
    outputSensorReading("soilmoisture", moisture);
    outputSensorReading("waterlevel", waterLevel);
    
    if (moisture >= DRY_THRESHOLD) {
      digitalWrite(BLUE_LED_PIN, HIGH);
      Serial.println("Soil is dry, needs watering!");
      
      if (waterLevel >= 400) { // There is enough water
        Serial.println("Watering...");
        // TODO: water
      } else if (waterLevel >= 380 && waterLevel < 400) {
        Serial.println("Water level low, needs to be refilled!");
      } else {
        Serial.println("Not enough water left!");
      } 
    } else if (moisture < WET_THRESHOLD) {
      digitalWrite(BLUE_LED_PIN, LOW);
      Serial.println("Soil is wet, no need to water.");
    } else {
      digitalWrite(BLUE_LED_PIN, LOW);
      Serial.println("Soil moisture is OK");
    }
    moistureStartTime = millis();
  }
}

void outputSensorReading(const char* sensorName, const float sensorValue) {
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["sensor"] = sensorName;
  root["value"] = sensorValue;
  root.printTo(Serial);
  Serial.println(); // To make the serialport parser in Node.js detect the output
}
