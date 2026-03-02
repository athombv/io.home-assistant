import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for light entities. See https://developers.home-assistant.io/docs/core/entity/light/.
 */
export default class LightEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('light.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'light';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'light-bulb';
    const supportedColorModes = entity.instance.attributes['supported_color_modes'] ?? [];
    const lightSupportsColorChanging =
      supportedColorModes.includes('hs') ||
      supportedColorModes.includes('rgb') ||
      supportedColorModes.includes('rgbw') ||
      supportedColorModes.includes('rgbww') ||
      supportedColorModes.includes('xy');

    if (typeof entity.instance.state === 'string') {
      homeyDevice.capabilities.push('onoff');
      homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
      homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
    }

    if (!entity.instance.attributes) {
      return;
    }

    if (
      supportedColorModes.includes('brightness') ||
      supportedColorModes.includes('color_temp') ||
      supportedColorModes.includes('white') ||
      lightSupportsColorChanging
    ) {
      homeyDevice.capabilities.push('dim');
      homeyDevice.capabilitiesOptions['dim'] = homeyDevice.capabilitiesOptions['dim'] || {};
      homeyDevice.capabilitiesOptions['dim'].entityId = entityId;
    }

    if (supportedColorModes.includes('color_temp')) {
      homeyDevice.capabilities.push('light_temperature');
      homeyDevice.capabilitiesOptions['light_temperature'] = homeyDevice.capabilitiesOptions['light_temperature'] || {};
      homeyDevice.capabilitiesOptions['light_temperature'].entityId = entityId;
    }

    if (lightSupportsColorChanging) {
      homeyDevice.capabilities.push('light_hue');
      homeyDevice.capabilitiesOptions['light_hue'] = homeyDevice.capabilitiesOptions['light_hue'] || {};
      homeyDevice.capabilitiesOptions['light_hue'].entityId = entityId;

      homeyDevice.capabilities.push('light_saturation');
      homeyDevice.capabilitiesOptions['light_saturation'] = homeyDevice.capabilitiesOptions['light_saturation'] || {};
      homeyDevice.capabilitiesOptions['light_saturation'].entityId = entityId;
    }

    if (supportedColorModes.includes('color_temp') && lightSupportsColorChanging) {
      homeyDevice.capabilities.push('light_mode');
      homeyDevice.capabilitiesOptions['light_mode'] = homeyDevice.capabilitiesOptions['light_mode'] || {};
      homeyDevice.capabilitiesOptions['light_mode'].entityId = entityId;
    }
  }
}
