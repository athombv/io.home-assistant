import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const CAPABILITY_MAP = {
  aqi: 'measure_aqi', // TODO: Not supported by Homey yet
  battery: 'measure_battery',
  carbon_dioxide: 'measure_co2',
  carbon_monoxide: 'measure_co',
  current: 'measure_current',
  energy: 'meter_power',
  // frequency: 'measure_frequency', // TODO: Not supported by Homey yet
  gas: 'meter_gas',
  humidity: 'measure_humidity',
  illuminance: 'measure_luminance',
  // monetary: 'measure_monetary', // TODO: Not supported by Homey yet
  // nitrogen_dioxide: 'measure_no2', // TODO: Not supported by Homey yet
  // nitrogen_monoxide: 'measure_no', // TODO: Not supported by Homey yet
  // nitrous_oxide: 'measure_nox', // TODO: Not supported by Homey yet
  // ozone: 'measure_ozone',  // TODO: Not supported by Homey yet
  pm1: 'measure_pm1', // TODO: Not supported by Homey yet
  pm10: 'measure_pm10', // TODO: Not supported by Homey yet
  pm25: 'measure_pm25',
  // power_factor: 'measure_power_factor', // TODO: Not supported by Homey yet
  power: 'measure_power',
  pressure: 'measure_pressure',
  signal_strength: 'measure_signal_strength', // TODO: Not supported by Homey yet
  // sulphur_dioxide: 'measure_so2', // TODO: Not supported by Homey yet
  temperature: 'measure_temperature',
  volatile_organic_compounds: 'measure_voc', // TODO: Not supported by Homey yet
  voltage: 'measure_voltage',

  // NOTE: The following device classes are not supported by Home Assistant!
  // noise: 'measure_noise',
  // rain: 'measure_rain',
  // wind_strength: 'measure_wind_strength',
  // wind_angle: 'measure_wind_angle',
  // gust_strength: 'measure_gust_strength',
  // gust_angle: 'measure_gust_angle',
  // ultraviolet: 'measure_ultraviolet',
  // water_flow: 'measure_water',
  // water: 'measure_water',
};

/**
 * Mapper for sensor entities. See https://developers.home-assistant.io/docs/core/entity/sensor/.
 */
export default class SensorEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('sensor.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    homeyDevice.class = homeyDevice.class || 'sensor';
    if (entity.instance.attributes) {
      // Is this Home Assistant Entity a known Homey Capability?
      const capabilityId = entity.instance.attributes['device_class']
        ? CAPABILITY_MAP[entity.instance.attributes['device_class'] as keyof typeof CAPABILITY_MAP]
        : null;

      if (capabilityId) {
        homeyDevice.capabilities.push(capabilityId);
        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
      } else if (entity.instance.attributes.action !== undefined) {
        homeyDevice.capabilities.push('action');
        homeyDevice.capabilitiesOptions['action'] = homeyDevice.capabilitiesOptions['action'] || {};
        homeyDevice.capabilitiesOptions['action'].entityId = entityId;
      } else if (entityId.endsWith('_power_outage_count') || entityId.endsWith('_motor_state')) {
        // ignore!
      } else if (entityId.endsWith('_noise') && entity.instance.attributes.unit_of_measurement === 'dB') {
        homeyDevice.capabilities.push('measure_noise');
        homeyDevice.capabilitiesOptions['measure_noise'] = homeyDevice.capabilitiesOptions['measure_noise'] || {};
        homeyDevice.capabilitiesOptions['measure_noise'].entityId = entityId;
      } else if (entityId.endsWith('_rain') && entity.instance.attributes.unit_of_measurement === 'mm') {
        homeyDevice.capabilities.push('measure_rain');
        homeyDevice.capabilitiesOptions['measure_rain'] = homeyDevice.capabilitiesOptions['measure_rain'] || {};
        homeyDevice.capabilitiesOptions['measure_rain'].entityId = entityId;
      } else if (entityId.endsWith('_wind_strength') && entity.instance.attributes.unit_of_measurement === 'km/h') {
        homeyDevice.capabilities.push('measure_wind_strength');
        homeyDevice.capabilitiesOptions['measure_wind_strength'] =
          homeyDevice.capabilitiesOptions['measure_wind_strength'] || {};
        homeyDevice.capabilitiesOptions['measure_wind_strength'].entityId = entityId;
      } else if (entityId.endsWith('_status')) {
        homeyDevice.capabilities.push('status');
        homeyDevice.capabilitiesOptions['status'] = homeyDevice.capabilitiesOptions['status'] || {};
        homeyDevice.capabilitiesOptions['status'].entityId = entityId;
      } else {
        const entityIdWithoutSensor = entityId.substring('sensor.'.length);
        const capabilityType = entity.instance.attributes['unit_of_measurement'] ? 'number' : 'string';
        const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;

        homeyDevice.capabilities.push(capabilityId);
        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
        homeyDevice.capabilitiesOptions[capabilityId].title =
          friendlyName || entity.instance.attributes['device_class'] || entityIdWithoutSensor;
        homeyDevice.capabilitiesOptions[capabilityId].units = entity.instance.attributes['unit_of_measurement'] || null;
        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
      }
    }
  }
}
