import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

export enum ColorMode {
  UNKNOWN = 'unknown',
  ONOFF = 'onoff',
  BRIGHTNESS = 'brightness',
  COLOR_TEMP = 'color_temp',
  HS = 'hs',
  XY = 'xy',
  RGB = 'rgb',
  RGBW = 'rgbw',
  RGBWW = 'rgbww',
  WHITE = 'white',
}

const attributeMap: AttributeValueMapper = [
  { attribute: 'brightness', capability: 'dim', mapper: (value: number) => value / 255 },
];

/**
 * Entity update handler for light entities. See https://developers.home-assistant.io/docs/core/entity/light/.
 */
export default class LightEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('light.');
  }

  async handle(entityState: HassEntity): Promise<void> {
    this.handleOnOff(entityState, 'onoff');
    this.mapAttributesToCapability(entityState, attributeMap);

    if (typeof entityState.attributes.color_mode === 'string') {
      switch (entityState.attributes.color_mode) {
        case ColorMode.ONOFF:
        case ColorMode.UNKNOWN:
        case ColorMode.BRIGHTNESS:
        case ColorMode.WHITE:
          // Nothing additional to do
          break;

        case ColorMode.HS:
        case ColorMode.XY:
        case ColorMode.RGB:
        case ColorMode.RGBW:
        case ColorMode.RGBWW:
          this.setCapabilityValueIfExists('light_mode', 'color');
          break;

        case ColorMode.COLOR_TEMP:
          this.setCapabilityValueIfExists('light_mode', 'temperature');
          break;

        default:
          this.log(`Unknown EntityState.attributes.color_mode: ${entityState.attributes['color_mode']}`);
          break;
      }
    }

    if (Array.isArray(entityState.attributes.hs_color)) {
      const [hue, saturation] = entityState.attributes.hs_color;

      if (this.hasCapability('light_hue')) {
        this.setCapabilityValue('light_hue', hue / 360);
      }

      if (this.hasCapability('light_saturation')) {
        this.setCapabilityValue('light_saturation', saturation / 100);
      }
    }

    if (typeof entityState.attributes.color_temp_kelvin === 'number' && this.hasCapability('light_temperature')) {
      const temperatureOptions = this.device.getCapabilityOptions('light_temperature');

      const min =
        typeof entityState.attributes.min_color_temp_kelvin === 'number'
          ? entityState.attributes.min_color_temp_kelvin
          : 2000;

      const max =
        typeof entityState.attributes.max_color_temp_kelvin === 'number'
          ? entityState.attributes.max_color_temp_kelvin
          : 6500;

      let optionsChanged = false;
      if (temperatureOptions.min_color_temp_kelvin !== min) {
        temperatureOptions.min_color_temp_kelvin = min;
        optionsChanged = true;
      }

      if (temperatureOptions.max_color_temp_kelvin !== max) {
        temperatureOptions.max_color_temp_kelvin = max;
        optionsChanged = true;
      }

      if (optionsChanged) {
        this.device.setCapabilityOptions('light_temperature', temperatureOptions).catch(this.error.bind(this));
      }

      this.setCapabilityValue('light_temperature', 1 - (entityState.attributes.color_temp_kelvin - min) / (max - min));
    }
  }
}
