import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import { ColorMode } from '../EntityStateUpdateHandler/LightEntityStateUpdateHandler.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for light entities. See https://developers.home-assistant.io/docs/core/entity/light/.
 */
export default class LightEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('light.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'light';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'light-bulb';
    const supportedColorModes = entity.instance.attributes.supported_color_modes ?? [];
    const lightSupportsColorChanging =
      supportedColorModes.includes(ColorMode.HS) ||
      supportedColorModes.includes(ColorMode.RGB) ||
      supportedColorModes.includes(ColorMode.RGBW) ||
      supportedColorModes.includes(ColorMode.RGBWW) ||
      supportedColorModes.includes(ColorMode.XY);

    homeyDevice.capabilities.push('onoff');
    homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
    homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;

    if (!entity.instance.attributes) {
      return;
    }

    if (
      supportedColorModes.includes(ColorMode.BRIGHTNESS) ||
      supportedColorModes.includes(ColorMode.COLOR_TEMP) ||
      supportedColorModes.includes(ColorMode.WHITE) ||
      lightSupportsColorChanging
    ) {
      homeyDevice.capabilities.push('dim');
      homeyDevice.capabilitiesOptions['dim'] = homeyDevice.capabilitiesOptions['dim'] || {};
      homeyDevice.capabilitiesOptions['dim'].entityId = entityId;
    }

    if (supportedColorModes.includes(ColorMode.COLOR_TEMP)) {
      homeyDevice.capabilities.push('light_temperature');
      homeyDevice.capabilitiesOptions['light_temperature'] = homeyDevice.capabilitiesOptions['light_temperature'] || {};
      homeyDevice.capabilitiesOptions['light_temperature'].entityId = entityId;
      homeyDevice.capabilitiesOptions['light_temperature'].max_color_temp_kelvin =
        entity.instance.attributes.max_color_temp_kelvin ?? 6500;
      homeyDevice.capabilitiesOptions['light_temperature'].min_color_temp_kelvin =
        entity.instance.attributes.min_color_temp_kelvin ?? 2000;
    }

    if (lightSupportsColorChanging) {
      homeyDevice.capabilities.push('light_hue');
      homeyDevice.capabilitiesOptions['light_hue'] = homeyDevice.capabilitiesOptions['light_hue'] || {};
      homeyDevice.capabilitiesOptions['light_hue'].entityId = entityId;

      homeyDevice.capabilities.push('light_saturation');
      homeyDevice.capabilitiesOptions['light_saturation'] = homeyDevice.capabilitiesOptions['light_saturation'] || {};
      homeyDevice.capabilitiesOptions['light_saturation'].entityId = entityId;
    }

    if (supportedColorModes.includes(ColorMode.COLOR_TEMP) && lightSupportsColorChanging) {
      homeyDevice.capabilities.push('light_mode');
      homeyDevice.capabilitiesOptions['light_mode'] = homeyDevice.capabilitiesOptions['light_mode'] || {};
      homeyDevice.capabilitiesOptions['light_mode'].entityId = entityId;
    }
  }
}
