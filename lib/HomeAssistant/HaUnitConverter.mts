import type { HassEntity } from 'home-assistant-js-websocket';
import Homey from 'homey';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertUnits(device: Homey.Device, capabilityId: string, entityState: HassEntity, newValue: any): any {
  const capabilityOptions = device.getCapabilityOptions(capabilityId) || {};
  let storedUnits = capabilityOptions.ha_unit;

  // Unit of measurement was never set for this device, so do not convert
  if (!storedUnits || typeof storedUnits !== 'string') {
    // Units not configured for device
    return newValue;
  }

  if (entityState.attributes['unit_of_measurement'] && entityState.attributes['unit_of_measurement'] !== storedUnits) {
    // New entity state has a different unit of measurement
    capabilityOptions.ha_unit = entityState.attributes['unit_of_measurement'];
    device.setCapabilityOptions(capabilityId, capabilityOptions).catch(device.error);

    storedUnits = capabilityOptions.ha_unit;
  }

  return getConverter(capabilityId)(storedUnits, newValue);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnitConverter = (unit: string, value: any) => any;
const converters: Record<string, UnitConverter> = {
  measure_current: convertCurrent, // A
  measure_data_rate: convertDataRate, // b/s
  measure_data_size: convertDataSize, // bytes
  measure_distance: convertDistance, // m
  measure_frequency: convertFrequency, // Hz
  measure_o3: convertO3, // μg/m³
  measure_co: convertCO, // ppm
  measure_power: convertPower, // W
  measure_pressure: convertPressure, // mbar
  measure_so2: convertSO2, // μg/m³
  measure_speed: convertSpeedMs, // m/s
  measure_voltage: convertVoltage, // V
  measure_content_volume: convertVolumeL, // L
  measure_rain: convertRain, // mm
  measure_rain_intensity: convertRainIntensity, // mm/h
  measure_water: convertWaterFlow, // L/min
  measure_weight: convertWeight, // g
  measure_wind_strength: convertSpeedKmh, // km/h
  meter_gas: convertGas, // m³
  meter_power: convertEnergy, // kWh
  meter_water: convertWater, // m³
};

function getConverter(capabilityId: string): UnitConverter {
  return converters[capabilityId] ?? ((_, value): unknown => value);
}

function convertDataRate(unit: string, value: number): number {
  switch (unit) {
    // --- SI bit-based ---
    case 'bit/s':
      return value; // base unit
    case 'kbit/s':
      return value * 1_000; // 1 kb/s = 1,000 bit/s
    case 'Mbit/s':
      return value * 1_000_000; // 1 Mb/s = 1,000,000 bit/s
    case 'Gbit/s':
      return value * 1_000_000_000; // 1 Gb/s = 1,000,000,000 bit/s

    // --- SI byte-based (1 byte = 8 bits) ---
    case 'B/s':
      return value * 8; // 1 B/s = 8 bit/s
    case 'kB/s':
      return value * 1_000 * 8; // 1 kB/s = 8,000 bit/s
    case 'MB/s':
      return value * 1_000_000 * 8; // 1 MB/s = 8,000,000 bit/s
    case 'GB/s':
      return value * 1_000_000_000 * 8; // 1 GB/s = 8,000,000,000 bit/s

    // --- IEC binary byte-based ---
    case 'KiB/s':
      return value * 1_024 * 8; // 1 KiB/s = 8,192 bit/s
    case 'MiB/s':
      return value * 1_024 * 1_024 * 8; // 1 MiB/s = 8,388,608 bit/s
    case 'GiB/s':
      return value * 1_024 * 1_024 * 1_024 * 8; // 1 GiB/s = 8,589,934,592 bit/s

    default:
      return value;
  }
}

// Converts a data size to bits (base unit).
function convertDataSize(unit: string, value: number): number {
  switch (unit) {
    // --- SI bit-based (decimal, 10^3) ---
    case 'bit':
      return value; // base unit
    case 'kbit':
      return value * 1_000;
    case 'Mbit':
      return value * 1_000_000;
    case 'Gbit':
      return value * 1_000_000_000;

    // --- SI byte-based (decimal, 10^3). 1 byte = 8 bits ---
    case 'B':
      return value * 8;
    case 'kB':
      return value * 1_000 * 8;
    case 'MB':
      return value * 1_000_000 * 8;
    case 'GB':
      return value * 1_000_000_000 * 8;
    case 'TB':
      return value * 1_000_000_000_000 * 8;
    case 'PB':
      return value * 1_000_000_000_000_000 * 8;

    // --- IEC byte-based (binary, 2^10). 1 byte = 8 bits ---
    case 'KiB':
      return value * 1_024 * 8;
    case 'MiB':
      return value * 1_024 ** 2 * 8;
    case 'GiB':
      return value * 1_024 ** 3 * 8;
    case 'TiB':
      return value * 1_024 ** 4 * 8;
    case 'PiB':
      return value * 1_024 ** 5 * 8;

    default:
      return value;
  }
}

function convertConcentrationToMicroGram(unit: string, value: number, ppbFactor: number): number {
  switch (unit) {
    case 'ppb':
      return value * ppbFactor;
    case 'ppm':
      return value * ppbFactor * 1_000;
    case 'μg/m³':
      return value;
    default:
      return value;
  }
}

function convertConcentrationToPpm(unit: string, value: number, ppbFactor: number): number {
  switch (unit) {
    case 'ppb':
      return value / 1_000;
    case 'ppm':
      return value;
    case 'μg/m³':
      return value / ppbFactor;
    case 'mg/m³':
      return (value / ppbFactor) * 1000;
    default:
      return value;
  }
}

function convertCO(unit: string, value: number): number {
  if (unit === 'ppm') {
    return value;
  }

  return convertConcentrationToPpm(unit, value, 1.15);
}

function convertDistance(unit: string, value: number): number {
  switch (unit) {
    case 'mm':
      return value / 1_000;
    case 'cm':
      return value / 100;
    case 'm':
      return value;
    case 'km':
      return value * 1_000;
    case 'in':
      return value * 0.0254;
    case 'ft':
      return value * 0.3048;
    case 'yd':
      return value * 0.9144;
    case 'mi':
      return value * 1609.344;
    default:
      return value;
  }
}

function convertO3(unit: string, value: number): number {
  if (unit === 'μg/m³') {
    return value;
  }

  return convertConcentrationToMicroGram(unit, value, 1.96);
}

function convertSO2(unit: string, value: number): number {
  if (unit === 'μg/m³') {
    return value;
  }

  return convertConcentrationToMicroGram(unit, value, 2.62);
}

function convertCurrent(unit: string, value: number): number {
  switch (unit) {
    case 'A':
      return value;
    case 'mA':
      return value / 1000;
    default:
      return value;
  }
}

function convertEnergy(unit: string, value: number): number {
  switch (unit) {
    case 'J':
      return convertEnergy('MJ', value / 1_000_000);
    case 'kJ':
      return convertEnergy('MJ', value / 1_000);
    case 'MJ':
      return value / 3.6;
    case 'GJ':
      return convertEnergy('MJ', value * 1_000);
    case 'mWh':
      return value * 1_000_000;
    case 'Wh':
      return value * 1_000;
    case 'kWh':
      return value;
    case 'MWh':
      return value / 1_000;
    case 'GWh':
      return value / 1_000_000;
    case 'TWh':
      return value / 1_000_000_000;
    case 'cal':
      return convertEnergy('Mcal', value / 1_000_000);
    case 'kcal':
      return convertEnergy('Mcal', value / 1000);
    case 'Mcal':
      return value * 1.162222;
    case 'Gcal':
      return convertEnergy('Mcal', value * 1_000);
    default:
      return value;
  }
}

function convertFrequency(unit: string, value: number): number {
  switch (unit) {
    case 'Hz':
      return value;
    case 'kHz':
      return value * 1_000;
    case 'MHz':
      return value * 1_000_000;
    case 'GHz':
      return value * 1_000_000_000;
    default:
      return value;
  }
}

function convertPower(unit: string, value: number): number {
  switch (unit) {
    case 'mW':
      return value / 1_000;
    case 'W':
      return value;
    case 'kW':
      return value * 1_000;
    case 'MW':
      return value * 1_000_000;
    case 'GW':
      return value * 1_000_000_000;
    case 'TW':
      return value * 1_000_000_000_000;
    case 'BTU/h':
      return value * 0.2930710702;
    default:
      return value;
  }
}

function convertPressure(unit: string, value: number): number {
  switch (unit) {
    case 'mbar':
      return value;
    case 'cbar':
      return value * 10;
    case 'bar':
      return value * 1_000;
    case 'mPa':
      return value / 100_000;
    case 'Pa':
      return value / 100;
    case 'hPa':
      return value;
    case 'kPa':
      return value * 10;
    case 'inHg':
      return value * 33.8639;
    case 'psi':
      return value * 68.9476;
    case 'inH₂O':
      return value * 2.4884;
    default:
      return value;
  }
}

function convertSpeedKmh(unit: string, value: number): number {
  if (unit === 'km/h') {
    return value;
  }

  return convertSpeedMs(unit, value) * 3.6;
}

function convertSpeedMs(unit: string, value: number): number {
  switch (unit) {
    case 'mm/d':
      return value / 86_400_000;
    case 'mm/h':
      return value / 3_600_000;
    case 'm/s':
      return value;
    case 'km/h':
      return value / 3.6;
    case 'mm/s':
      return value / 1_000;
    case 'in/d':
      return value / 3_392_640;
    case 'in/h':
      return value / 141_732;
    case 'in/s':
      return value * 0.0254;
    case 'ft/s':
      return value / 3.281;
    case 'mph':
      return value / 2.237;
    case 'kn':
      return value * 0.5144;
    case 'Beaufort':
      return 0.836 * Math.pow(value, 1.5);
    default:
      return value;
  }
}

function convertVoltage(unit: string, value: number): number {
  switch (unit) {
    case 'V':
      return value;
    case 'mV':
      return value / 1_000;
    case 'μV':
      return value / 1_000_000;
    case 'kV':
      return value * 1_000;
    case 'MV':
      return value * 1_000_000;
    default:
      return value;
  }
}

function convertGas(unit: string, value: number): number {
  if (unit === 'm³') {
    return value;
  }
  return convertVolumeM3(unit, value);
}

function convertWater(unit: string, value: number): number {
  if (unit === 'm³') {
    return value;
  }
  return convertVolumeM3(unit, value);
}

function convertVolumeL(unit: string, value: number): number {
  if (unit === 'L') {
    return value;
  }

  return convertGas(unit, value) * 1_000;
}

function convertVolumeM3(unit: string, value: number): number {
  switch (unit) {
    case 'L':
      return value / 1_000;
    case 'm³':
      return value;
    case 'ft³':
      return value / 35.31469989;
    case 'CCF':
      return value * 2.832;
    case 'MCF':
      return value * 28.317;
    case 'gal':
      return value * 3.78541;
    default:
      return value;
  }
}

function convertWaterFlow(unit: string, value: number): number {
  switch (unit) {
    case 'L/min':
      return value; // base unit

    // --- Liter-based ---
    case 'L/s':
      return value * 60; // 1 L/s = 60 L/min
    case 'L/h':
      return value / 60; // 1 L/h = 1/60 L/min
    case 'mL/s':
      return (value / 1000) * 60; // mL/s → L/s → L/min

    // --- Cubic meter-based ---
    case 'm³/s':
      return value * 1000 * 60; // m³/s → L/s → L/min
    case 'm³/min':
      return value * 1000; // m³/min = 1000 L/min
    case 'm³/h':
      return value * (1000 / 60); // m³/h → L/h → L/min

    // --- Imperial ---
    case 'ft³/min': // cubic feet per minute
      return value * 28.316846592; // ft³/min = 28.316846592 L/min

    case 'gal/min': // US gallon/min
      return value * 3.785411784; // directly L/min

    case 'gal/d': // US gallon/day
      return (value * 3.785411784) / 1440; // 1440 min/day

    default:
      return value;
  }
}

function convertWeight(unit: string, value: number): number {
  switch (unit) {
    case 'μg':
      return value / 1_000_000;
    case 'mg':
      return value / 1_000;
    case 'g':
      return value;
    case 'kg':
      return value * 1_000;
    case 'oz':
      return value * 28.3495;
    case 'lb':
      return value * 453.592;
    default:
      return value;
  }
}

function convertRain(unit: string, value: number): number {
  switch (unit) {
    case 'cm':
      return value * 10;
    case 'mm':
      return value;
    case 'in':
      return value * 25.4;
    default:
      return value;
  }
}
function convertRainIntensity(unit: string, value: number): number {
  switch (unit) {
    case 'mm/d':
      return value / 24;
    case 'mm/h':
      return value;
    case 'in/d':
      return (value * 25.4) / 24;
    case 'in/h':
      return value * 25.4;
    default:
      return value;
  }
}
