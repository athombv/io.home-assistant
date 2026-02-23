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
  measure_frequency: convertHzUnit,
};

function getConverter(capabilityId: string): UnitConverter {
  return converters[capabilityId] ?? ((_, newValue): UnitConverter => newValue);
}

function convertHzUnit(units: string, newValue: number): number {
  switch (units) {
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
