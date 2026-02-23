import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const CLASS_MAP = {
  awning: 'sunshade',
  blind: 'blinds',
  curtain: 'curtain',
  damper: 'windowcoverings',
  door: 'garagedoor',
  garage: 'garagedoor',
  gate: 'garagedoor',
  shade: 'sunshade',
  shutter: 'windowcoverings',
  window: 'windowcoverings',
};

const SUPPORTED_FEATURES = {
  1: ['windowcoverings_state'], // Open
  // 2: ['windowcoverings_state'], // Close: Disabled since Homey has no seperate cabability for close.
  4: ['windowcoverings_set'],
  // 8: ['windowcoverings_state'], // Stop: Disabled since Homey has no seperate cabability for stop.
  16: ['windowcoverings_tilt_up'], // Open Tilt
  32: ['windowcoverings_tilt_down'], // Close Tilt
  // 64: [''], // Stop Tilt // TODO: Not supported by Homey yet
  128: ['windowcoverings_tilt_set'], // Set Tilt Position
};

/**
 * Mapper for cover entities. See https://developers.home-assistant.io/docs/core/entity/cover.
 */
export default class CoverEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('cover.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    const coveringType = entity.instance.attributes['device_class']
      ? CLASS_MAP[entity.instance.attributes['device_class'] as keyof typeof CLASS_MAP]
      : 'windowcoverings';
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : coveringType;

    if (!homeyDevice.iconOverride || homeyDevice.class === 'sensor') {
      switch (coveringType) {
        case 'sunshade':
          homeyDevice.iconOverride = 'sunshade2';
          break;
        case 'blinds':
          homeyDevice.iconOverride = 'blinds';
          break;
        case 'curtain':
          homeyDevice.iconOverride = 'curtains';
          break;
        case 'garagedoor':
          homeyDevice.iconOverride = 'garage-door';
          break;
        default:
          homeyDevice.iconOverride = 'sunshade';
          break;
      }
    }

    if (entity.instance.attributes) {
      const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

      for (const [key, value] of Object.entries(SUPPORTED_FEATURES)) {
        // Check if the key is part of the supported features binary value.
        if (supportedFeatures & Number(key)) {
          value.forEach(capabilityId => {
            homeyDevice.capabilities.push(capabilityId);
            homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
            homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName || entityId;
            homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
          });
        }
      }

      if (coveringType === 'garagedoor') {
        homeyDevice.capabilities.push('garagedoor_closed');
        homeyDevice.capabilitiesOptions['garagedoor_closed'] =
          homeyDevice.capabilitiesOptions['garagedoor_closed'] || {};
        homeyDevice.capabilitiesOptions['garagedoor_closed'].title = friendlyName || entityId;
        homeyDevice.capabilitiesOptions['garagedoor_closed'].entityId = entityId;
      }
    }
  }
}
