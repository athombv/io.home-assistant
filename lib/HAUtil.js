'use strict';

module.exports = class HAUtil {

  static ENTITY_CAPABILITY_MAP = {
    'temperature': 'measure_temperature',
    'co': 'measure_co',
    'co2': 'measure_co2',
    'pm25': 'measure_pm25',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'noise': 'measure_noise',
    'rain': 'measure_rain',
    'wind_strength': 'measure_wind_strength',
    'wind_angle': 'measure_wind_angle',
    'gust_strength': 'measure_gust_strength',
    'gust_angle': 'measure_gust_angle',
    'battery': 'measure_battery',
    'power': 'measure_power',
    'voltage': 'measure_voltage',
    'current': 'measure_current',
    'luminance': 'measure_luminance',
    'ultraviolet': 'measure_ultraviolet',
    'water_flow': 'measure_water',
    'water': 'measure_water',
    'energy': 'meter_power',
    // lights
    'onoff': 'onoff',
    'brightness': 'dim',
    'color_temp': 'light_temperature',
    // below are rgbs
    '': 'light_saturation',
    '': 'light_hue',
    '': 'light_mode'
  };

  static LIGHT_CAPABILITIES = ['onoff', 'dim'];

  static getCapabilityFromEntity(entity) {
    if (entity.attributes && entity.attributes.device_class) {
      return this.ENTITY_CAPABILITY_MAP[entity.attributes.device_class] || null;
    }
    if (entity.attributes && entity.attributes.supported_color_modes && entity.attributes.supported_features) { // 99% chance the entity that is being scanned is a light
      // return this.ENTITY_CAPABILITY_MAP[entity.attributes.supported_color_modes] || null; //because the light is 1 entity but has multiple capabilities, this wont work
      //for the lights i need to physically return 'onoff', 'dim', 'light_temperature'. Only difference you can make is whether or not the light is RGB, RGBW or W capable.

      //TODO return the light capabilities
      return 'onoff' || null;

    }

    return null;
  }
  // https://github.com/home-assistant/core/blob/dev/homeassistant/components/light/__init__.py
  /*
  # Bitfield of features supported by the light entity
  SUPPORT_BRIGHTNESS = 1  # Deprecated, replaced by color modes
  SUPPORT_COLOR_TEMP = 2  # Deprecated, replaced by color modes
  SUPPORT_EFFECT = 4
  SUPPORT_FLASH = 8
  SUPPORT_COLOR = 16  # Deprecated, replaced by color modes
  SUPPORT_TRANSITION = 32
  SUPPORT_WHITE_VALUE = 128  # Deprecated, replaced by color modes

  # Color mode of the light
  ATTR_COLOR_MODE = "color_mode"
  # List of color modes supported by the light
  ATTR_SUPPORTED_COLOR_MODES = "supported_color_modes"
  # Possible color modes
  COLOR_MODE_UNKNOWN = "unknown"  # Ambiguous color mode
  COLOR_MODE_ONOFF = "onoff"  # Must be the only supported mode
  COLOR_MODE_BRIGHTNESS = "brightness"  # Must be the only supported mode
  COLOR_MODE_COLOR_TEMP = "color_temp"
  COLOR_MODE_HS = "hs"
  COLOR_MODE_XY = "xy"
  COLOR_MODE_RGB = "rgb"
  COLOR_MODE_RGBW = "rgbw"
  COLOR_MODE_RGBWW = "rgbww"
  COLOR_MODE_WHITE = "white"  # Must *NOT* be the only supported mode
          */
}