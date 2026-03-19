import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by Home Assistant in `FanEntityFeature` */
export enum FanEntityFeature {
  SET_SPEED = 1,
  OSCILLATE = 2,
  DIRECTION = 4,
  PRESET_MODE = 8,
  TURN_OFF = 16,
  TURN_ON = 32,
}

const SUPPORTED_FEATURES: Partial<Record<FanEntityFeature, string[]>> = {
  [FanEntityFeature.SET_SPEED]: ['fan_speed'],
  [FanEntityFeature.OSCILLATE]: ['fan_oscillate'],
  [FanEntityFeature.PRESET_MODE]: ['fan_mode'],
};

/**
 * Mapper for fan entities. See https://developers.home-assistant.io/docs/core/entity/fan.
 */
export default class FanEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('fan.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'fan';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'fan';

    homeyDevice.capabilities.push('onoff');
    homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
    homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;

    if (!entity.instance.attributes) {
      return;
    }

    const supportedFeatures = entity.instance.attributes['supported_features'] || 0;
    for (const [key, value] of Object.entries(SUPPORTED_FEATURES)) {
      // Check if the key is part of the supported features binary value.
      if (supportedFeatures & Number(key)) {
        value.forEach(capabilityId => {
          if (capabilityId === 'fan_mode') {
            if (
              entity.instance.attributes['preset_modes'].every((mode?: string) =>
                ['nature', 'normal'].includes(mode?.toLowerCase() ?? ''),
              )
            ) {
              // Check if fan preset mode contains Nature and Normal.
              homeyDevice.capabilities.push('fan_mode');
              homeyDevice.capabilitiesOptions['fan_mode'] = homeyDevice.capabilitiesOptions['fan_mode'] || {};
              homeyDevice.capabilitiesOptions['fan_mode'].entityId = entityId;
            } else if (
              entity.instance.attributes['preset_modes'].every((mode?: string) =>
                ['fan', 'auto', 'silent', 'favorite'].includes(mode?.toLowerCase() ?? ''),
              )
            ) {
              // Check if fan preset mode contains Fan, Auto, Silent and Favorite.
              homeyDevice.capabilities.push('aircleaner_mode');
              homeyDevice.capabilitiesOptions['aircleaner_mode'] =
                homeyDevice.capabilitiesOptions['aircleaner_mode'] || {};
              homeyDevice.capabilitiesOptions['aircleaner_mode'].entityId = entityId;
            }
          } else {
            homeyDevice.capabilities.push(capabilityId);
            homeyDevice.capabilitiesOptions[capabilityId] = { entityId };

            if (capabilityId === 'fan_speed') {
              homeyDevice.capabilitiesOptions[capabilityId].min = 0;
              homeyDevice.capabilitiesOptions[capabilityId].max = 1;
              homeyDevice.capabilitiesOptions[capabilityId].step =
                Math.floor(entity.instance.attributes['percentage_step']) / 100; // A bit of a hack because of rounding errors.
            }
          }
        });
      }
    }
  }
}
