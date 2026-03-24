import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by HA */
enum ClimateEntityFeature {
  TARGET_TEMPERATURE = 1,
  TARGET_TEMPERATURE_RANGE = 2,
  TARGET_HUMIDITY = 4,
  FAN_MODE = 8,
  PRESET_MODE = 16,
  SWING_MODE = 32,
  TURN_OFF = 128,
  TURN_ON = 256,
  SWING_HORIZONTAL_MODE = 512,
}

const SUPPORTED_FEATURES: Partial<Record<ClimateEntityFeature, string[]>> = {
  [ClimateEntityFeature.TURN_ON]: ['onoff'],
  [ClimateEntityFeature.TURN_OFF]: ['onoff'],
  [ClimateEntityFeature.TARGET_TEMPERATURE]: ['target_temperature'],
  [ClimateEntityFeature.TARGET_TEMPERATURE_RANGE]: ['target_temperature_min', 'target_temperature_max'],
  [ClimateEntityFeature.TARGET_HUMIDITY]: ['target_humidity'],
  [ClimateEntityFeature.FAN_MODE]: ['fan_mode'],
  [ClimateEntityFeature.SWING_MODE]: ['onoff.swing_mode', 'swing_mode'],
  [ClimateEntityFeature.SWING_HORIZONTAL_MODE]: ['onoff.swing_mode_horizontal', 'swing_mode'],
};

/**
 * Mapper for climate entities. See https://developers.home-assistant.io/docs/core/entity/climate.
 */
export default class ClimateEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('climate.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'airconditioning');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'thermostat_mode');
    HaDeviceEntityMapper.mapFeatureMask(entityId, entity, homeyDevice, friendlyName, SUPPORTED_FEATURES);

    if (homeyDevice.capabilities.includes('onoff.swing_mode')) {
      homeyDevice.capabilitiesOptions['onoff.swing_mode'].title = 'Swing mode';
    }

    if (homeyDevice.capabilities.includes('onoff.swing_mode_horizontal')) {
      homeyDevice.capabilitiesOptions['onoff.swing_mode_horizontal'].title = 'Horizontal swing mode';
    }

    if (homeyDevice.capabilities.includes('swing_mode')) {
      homeyDevice.capabilitiesOptions['swing_mode'].setable = false;
    }

    // Only add capabilities if the entity has values for the temperature and humidity attributes
    if (typeof entity.instance.attributes.current_humidity === 'number') {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'measure_humidity');
    }
    if (typeof entity.instance.attributes.current_temperature === 'number') {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'measure_temperature');
    }
  }
}
