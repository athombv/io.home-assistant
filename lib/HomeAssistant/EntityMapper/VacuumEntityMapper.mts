import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const SUPPORTED_FEATURES = {
  // 1: ['onoff'], // Turn On
  // 2: ['onoff'], // Turn Off
  // 4: [''], // Pause
  // 8: [''], // Stop
  // 16: [''], // Return Home
  // 32: [''], // Fan Speed
  128: ['vacuumcleaner_state'], // Status
  // 256: [''], // Send Command
  // 512: [''], // Locate
  // 1024: [''], // Clean Spot
  // 2048: [''], // Map
  // 4096: [''], // State
  // 8192: [''], // Start
};

/**
 * Mapper for vacuum entities. See https://www.home-assistant.io/integrations/vacuum/.
 */
export default class VacuumEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('vacuum.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'vacuumcleaner';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'vacuum-cleaner';
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
          console.log('capabilityId', value, entityId);
          value.forEach(capabilityId => {
            homeyDevice.capabilities.push(capabilityId);
            homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
            homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
          });
        }
      }
    }
  }
}
