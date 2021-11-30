'use strict';

module.exports = class HAUtil {

  static ENTITY_SENSOR_CAPABILITY_MAP = {
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
  static ENTITY_LIGHT_CAPABILITY_MAP = {
    'onoff': 'onoff',
    'brightness': 'dim',
    'color_temp': 'light_temperature',
    '': 'light_saturation',
    '': 'light_hue',
    '': 'light_mode'
  };

  static ENTITY_SPEAKER_CAPABILITY_MAP = {
    '': 'speaker_playing',
    '': 'speaker_next',
    '': 'speaker_prev',
    '': 'speaker_artist',
    '': 'speaker_album',
    '': 'speaker_track',
    '': 'volume_mute',
    '': ''
  };
  static ALARM_ENTITY_CAPABILITY_MAP = {
    // On means low, Off means normal : "True when battery is low"
    'battery': 'alarm_battery',
    // On means charging, Off means not charging : ?
    'battery_charging': 'alarm_generic',
    // On means cold, Off means normal : ?
    'cold': 'alarm_generic',
    // On means connected, Off means disconnected : ?
    'connectivity': 'alarm_generic',
    // On means open, Off means closed : ?
    'door': 'alarm_generic', // ?
    // On means open, Off means closed : "True when garage door is closed"
    'garage_door': 'garagedoor_closed',
    // On means gas detected, Off means no gas (clear) : "True when [x] gas is detected"
    'gas': 'alarm_co2', // ?
    // On means hot, Off means normal : "True when extreme heat has been detected"
    'heat': 'alarm_heat',
    // On means light detected, Off means no light : ?
    'light': 'alarm_generic',
    // On means open (unlocked), Off means closed (locked) : "True when the lock is locked"
    'lock': 'locked',
    // On means wet, Off means dry : "True when water has been detected"
    'moisture': 'alarm_water',
    // On means motion detected, Off means no motion (clear) : "Motion alarm turned on"
    'motion': 'alarm_motion',
    // On means moving, Off means not moving (stopped) : ?
    'moving': 'alarm_generic',
    // On means occupied, Off means not occupied (clear) : ?
    'occupancy': 'alarm_generic',
    // On means open, Off means closed : ?
    'opening': 'alarm_generic',
    // On means plugged in, Off means unplugged : ?
    'plug': 'alarm_generic',
    // On means power detected, Off means no power : ?
    'power': 'alarm_generic',
    // On means home, Off means away : ?
    'presence': 'alarm_generic',
    // On means problem detected, Off means no problem (OK) : ?
    'problem': 'alarm_generic',
    // On means running, Off means not running : ?
    'running': 'alarm_generic',
    // On means unsafe, Off means safe : ?
    'safety': 'alarm_generic',
    // On means smoke detected, Off means no smoke (clear) : "True when smoke is detected"
    'smoke': 'alarm_smoke',
    // On means sound detected, Off means no sound (clear) : ?
    'sound': 'alarm_generic',
    // On means tampering detected, Off means no tampering (clear) : "True when tampering has been detected"
    'tamper': 'alarm_tamper',
    // On means update available, Off means up-to-date : ?
    'update': 'alarm_generic',
    // On means vibration detected, Off means no vibration : ?
    'vibration': 'alarm_generic',
    // On means open, Off means closed : "True when the window coverings are closed"
    'window': 'windowcoverings_closed'
  };

  static LIGHT_CAPABILITIES = ['onoff', 'brightness', 'color_temp'];

  static getCapabilityFromEntity(entity) {

    if (entity.attributes && entity.attributes.device_class) {
      console.log(entity);
      if (entity.state == 'on' || entity.state == 'off') {
        console.log("test2");
        return this.ALARM_ENTITY_CAPABILITY_MAP[entity.attributes.device_class] || null;
      }
      return this.ENTITY_SENSOR_CAPABILITY_MAP[entity.attributes.device_class] || null;
    }
    if (entity.attributes && entity.attributes.supported_color_modes && entity.attributes.supported_features) { // 99% chance the entity that is being scanned is a light
      const tmp = [];
      this.LIGHT_CAPABILITIES.forEach(id => {
        console.log("id: ", id);
        console.log("translated capability: ", this.ENTITY_LIGHT_CAPABILITY_MAP[id]);
        tmp.push(this.ENTITY_LIGHT_CAPABILITY_MAP[id]);
      })
      return tmp;
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

  /*
  alarm capabilities:
  if deviceClass equals [deviceclass list of alarm stuff] and the state is either on or off, then give alarm_[deviceClass]
  if(DEVICE_CLASS[name] && device.state == 'on' || 'off') {
    return this.mapAlarmCapability[name] || null;
  }
  */


}


