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
type UnitConverter = (unit: string, newValue: any) => any;
const converters: Record<string, UnitConverter> = {
  measure_current: convertCurrentUnit,
  measure_frequency: convertHzUnit,
  measure_power: convertPowerUnit,
  measure_pressure: convertPressureUnit,
  measure_voltage: convertVoltageUnit,
  meter_gas: convertVolumeUnit,
  meter_power: convertEnergyUnit,
};

function getConverter(capabilityId: string): UnitConverter {
  return converters[capabilityId] ?? ((_, newValue): UnitConverter => newValue);
}

function convertCurrentUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'A':
      return newValue;
    case 'mA':
      return newValue / 1000;
    default:
      return newValue;
  }
}

function convertEnergyUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'J':
      return convertEnergyUnit('MJ', newValue / 1_000_000);
    case 'kJ':
      return convertEnergyUnit('MJ', newValue / 1_000);
    case 'MJ':
      return newValue / 3.6;
    case 'GJ':
      return convertEnergyUnit('MJ', newValue * 1_000);
    case 'mWh':
      return newValue * 1_000_000;
    case 'Wh':
      return newValue * 1_000;
    case 'kWh':
      return newValue;
    case 'MWh':
      return newValue / 1_000;
    case 'GWh':
      return newValue * 1_000_000;
    case 'TWh':
      return newValue * 1_000_000_000;
    case 'cal':
      return convertEnergyUnit('Mcal', newValue / 1_000_000);
    case 'kcal':
      return convertEnergyUnit('Mcal', newValue / 1000);
    case 'Mcal':
      return newValue * 1.162222;
    case 'Gcal':
      return convertEnergyUnit('Mcal', newValue * 1_000);
    default:
      return newValue;
  }
}

function convertHzUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'Hz':
      return newValue;
    case 'kHz':
      return newValue * 1_000;
    case 'MHz':
      return newValue * 1_000_000;
    case 'GHz':
      return newValue * 1_000_000_000;
    default:
      return newValue;
  }
}

function convertPowerUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'mW':
      return newValue / 1_000;
    case 'W':
      return newValue;
    case 'kW':
      return newValue * 1_000;
    case 'MW':
      return newValue * 1_000_000;
    case 'GW':
      return newValue * 1_000_000_000;
    case 'TW':
      return newValue * 1_000_000_000_000;
    case 'BTU/h':
      return newValue * 0.2930710702;
    default:
      return newValue;
  }
}

function convertPressureUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'mbar':
      return newValue;
    case 'cbar':
      return newValue * 10;
    case 'bar':
      return newValue * 1_000;
    case 'mPa':
      return newValue / 100_000;
    case 'Pa':
      return newValue / 100;
    case 'hPa':
      return newValue;
    case 'kPa':
      return newValue * 10;
    case 'inHg':
      return newValue * 33.8639;
    case 'psi':
      return newValue * 68.9476;
    case 'inH₂O':
      return newValue * 2.4884;
    default:
      return newValue;
  }
}

function convertVoltageUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'V':
      return newValue;
    case 'mV':
      return newValue / 1_000;
    case 'μV':
      return newValue / 1_000_000;
    case 'kV':
      return newValue * 1_000;
    case 'MV':
      return newValue * 1_000_000;
    default:
      return newValue;
  }
}

function convertVolumeUnit(unit: string, newValue: number): number {
  switch (unit) {
    case 'L':
      return newValue / 1_000;
    case 'm³':
      return newValue;
    case 'ft³':
      return newValue / 35.31469989;
    case 'CCF':
      return newValue * 2.832;
    case 'MCF':
      return newValue * 28.317;
    case 'gal':
      return newValue * 3.78541;
    default:
      return newValue;
  }
}
