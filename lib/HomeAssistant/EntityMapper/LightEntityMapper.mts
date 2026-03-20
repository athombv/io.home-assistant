import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import { ColorMode } from '../EntityStateUpdateHandler/LightEntityStateUpdateHandler.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

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
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'light');
    HaDeviceEntityMapper.setDeviceIcon(homeyDevice, 'light-bulb');

    const supportedColorModes = entity.instance.attributes.supported_color_modes ?? [];
    const lightSupportsColorChanging =
      supportedColorModes.includes(ColorMode.HS) ||
      supportedColorModes.includes(ColorMode.RGB) ||
      supportedColorModes.includes(ColorMode.RGBW) ||
      supportedColorModes.includes(ColorMode.RGBWW) ||
      supportedColorModes.includes(ColorMode.XY);

    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'onoff');

    if (!entity.instance.attributes) {
      return;
    }

    if (
      supportedColorModes.includes(ColorMode.BRIGHTNESS) ||
      supportedColorModes.includes(ColorMode.COLOR_TEMP) ||
      supportedColorModes.includes(ColorMode.WHITE) ||
      lightSupportsColorChanging
    ) {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'dim');
    }

    if (supportedColorModes.includes(ColorMode.COLOR_TEMP)) {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'light_temperature', {
        max_color_temp_kelvin: entity.instance.attributes.max_color_temp_kelvin ?? 6500,
        min_color_temp_kelvin: entity.instance.attributes.min_color_temp_kelvin ?? 2000,
      });
    }

    if (lightSupportsColorChanging) {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'light_hue');
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'light_saturation');
    }

    if (supportedColorModes.includes(ColorMode.COLOR_TEMP) && lightSupportsColorChanging) {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'light_mode');
    }
  }
}
