import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const SUPPORTED_FEATURES = {
  1: ['fan_speed'],
  2: ['fan_oscillate'],
  // 4: ['direction'],
  8: ['fan_mode'],
};

/**
 * Mapper for fan entities. See https://www.home-assistant.io/integrations/fan/.
 */
export default class FanEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('fan.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'fan';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'fan';

    if (typeof entity.instance.state === 'string') {
      homeyDevice.capabilities.push('onoff');
      homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
      homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
    }

    if (entity.instance.attributes) {
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
              homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
              homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;

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
}
