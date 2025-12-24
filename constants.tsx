
import { Part } from './types';

const getPhoto = (name: string) => `https://loremflickr.com/320/240/electronics,hardware,${encodeURIComponent(name)}`;

export const COMMON_PARTS: Part[] = [
  // CORES
  { id: 'c1', name: 'ESP32-C3 Super Mini', category: 'Core', details: { photoUrl: getPhoto('esp32-c3-super-mini') } },
  { id: 'c4', name: 'RP2040-Zero', category: 'Core', details: { photoUrl: getPhoto('rp2040-zero') } },
  { id: 'c5', name: 'Raspberry Pi Pico W', category: 'Core', details: { photoUrl: getPhoto('pico-w') } },
  { id: 'c11', name: 'Wemos D1 Mini ESP8266', category: 'Core', details: { photoUrl: getPhoto('wemos-d1-mini') } },
  
  // DISPLAYS
  { id: 'd1', name: '0.96" OLED SSD1306', category: 'Display', details: { photoUrl: getPhoto('0.96-oled-display') } },
  { id: 'd9', name: 'Round LCD 1.28" GC9A01', category: 'Display', details: { photoUrl: getPhoto('round-lcd-gc9a01') } },
  { id: 'd14', name: 'Nixie Tube IN-14', category: 'Display', details: { photoUrl: getPhoto('in-14-nixie') } },

  // PASSIVES
  { id: 'ps1', name: '220 Ohm Resistor 1/4W', category: 'Passive', details: { photoUrl: getPhoto('resistor-220-ohm') } },
  { id: 'ps2', name: '1k Ohm Resistor 1/4W', category: 'Passive', details: { photoUrl: getPhoto('resistor-1k') } },
  { id: 'ps3', name: '10k Ohm Resistor 1/4W', category: 'Passive', details: { photoUrl: getPhoto('resistor-10k') } },
  { id: 'ps4', name: '1M Ohm Resistor 1/4W', category: 'Passive', details: { photoUrl: getPhoto('resistor-1m') } },
  { id: 'ps5', name: '10nF Ceramic Capacitor', category: 'Passive', details: { photoUrl: getPhoto('ceramic-capacitor') } },
  { id: 'ps6', name: '100uF Electrolytic Cap', category: 'Passive', details: { photoUrl: getPhoto('electrolytic-capacitor') } },
  { id: 'ps7', name: '10nF Myar Film Capacitor', category: 'Passive', details: { photoUrl: getPhoto('film-capacitor') } },

  // DIODES
  { id: 'dd1', name: '1N4007 Power Diode', category: 'Passive', details: { photoUrl: getPhoto('1n4007-diode') } },
  { id: 'dd2', name: '1N4148 Signal Diode', category: 'Passive', details: { photoUrl: getPhoto('1n4148-diode') } },
  { id: 'dd3', name: '5.1V Zener Diode', category: 'Passive', details: { photoUrl: getPhoto('zener-diode') } },
  { id: 'dd4', name: 'Schottky Diode SS14', category: 'Passive', details: { photoUrl: getPhoto('schottky-diode') } },

  // LIGHTS
  { id: 'l1', name: 'LED 5mm Red Diffused', category: 'Light', details: { photoUrl: getPhoto('red-led-5mm') } },
  { id: 'l2', name: 'LED 5mm Green Diffused', category: 'Light', details: { photoUrl: getPhoto('green-led-5mm') } },
  { id: 'l3', name: 'LED 5mm Blue Crystal', category: 'Light', details: { photoUrl: getPhoto('blue-led-5mm') } },
  { id: 'l4', name: 'LED 5mm Amber Vintage', category: 'Light', details: { photoUrl: getPhoto('amber-led-5mm') } },
  { id: 'l5', name: 'WS2812B RGB Neopixel', category: 'Light', details: { photoUrl: getPhoto('ws2812b-led') } },
  { id: 'l6', name: 'Edison Filament LED', category: 'Light', details: { photoUrl: getPhoto('edison-filament-led') } },
  { id: 'l7', name: 'SMD LED 0603 White', category: 'Light', details: { photoUrl: getPhoto('0603-led') } },
  { id: 'l8', name: 'Edison Ceramic Fiber LED Filament', category: 'Light', details: { photoUrl: getPhoto('ceramic-led-filament') } },
  { id: 'l9', name: 'LED Fuse Bulb (Festoon)', category: 'Light', details: { photoUrl: getPhoto('led-fuse-bulb') } },
  { id: 'l10', name: 'COB LED Strip Light', category: 'Light', details: { photoUrl: getPhoto('cob-led-strip') } },

  // SENSORS
  { id: 's1', name: 'BME280 Temp/Pressure', category: 'Sensor', details: { photoUrl: getPhoto('bme280-sensor') } },
  { id: 's2', name: 'MPU6050 Gyroscope', category: 'Sensor', details: { photoUrl: getPhoto('mpu6050-sensor') } },
  { id: 's7', name: 'LDR Photoresistor', category: 'Sensor', details: { photoUrl: getPhoto('ldr-sensor') } },

  // POWER
  { id: 'p1', name: 'TP4056 USB-C Charger', category: 'Power', details: { photoUrl: getPhoto('tp4056-charger') } },
  { id: 'p3', name: '18650 Li-ion Cell', category: 'Power', details: { photoUrl: getPhoto('18650-battery') } },
  { id: 'p5', name: 'CR2032 Coin Cell Holder', category: 'Power', details: { photoUrl: getPhoto('cr2032-holder') } },

  // STRUCTURE
  { id: 'st1', name: 'Brass Rod 2mm', category: 'Structure', details: { photoUrl: getPhoto('brass-rod') } },
  { id: 'st4', name: 'Acrylic Plate 3mm Black', category: 'Structure', details: { photoUrl: getPhoto('acrylic-plate') } },
  { id: 'st5', name: 'Laser-cut Plywood Sheet', category: 'Structure', details: { photoUrl: getPhoto('plywood-sheet') } },

  // INPUTS
  { id: 'i1', name: 'Rotary Encoder KY-040', category: 'Input', details: { photoUrl: getPhoto('rotary-encoder') } },
  { id: 'i2', name: 'Brass Toggle Switch', category: 'Input', details: { photoUrl: getPhoto('toggle-switch-brass') } },
];

export const THEME_COLORS = {
  cyan: '#00f3ff',
  magenta: '#ff00ff',
  yellow: '#f3ff00',
  dark: '#050505',
  card: '#0a0a0f',
};
