'use strict';

module.exports = class HomeAssistantConstants {

  static ENTITY_SENSOR_CAPABILITY_MAP = {
    aqi: 'measure_aqi', // TODO: Not supported by Homey yet
    battery: 'measure_battery',
    carbon_dioxide: 'measure_co2',
    carbon_monoxide: 'measure_co',
    current: 'measure_current',
    energy: 'meter_power',
    // frequency: 'measure_frequency', // TODO: Not supported by Homey yet
    gas: 'meter_gas',
    humidity: 'measure_humidity',
    illuminance: 'measure_luminance',
    // monetary: 'measure_monetary', // TODO: Not supported by Homey yet
    // nitrogen_dioxide: 'measure_no2', // TODO: Not supported by Homey yet
    // nitrogen_monoxide: 'measure_no', // TODO: Not supported by Homey yet
    // nitrous_oxide: 'measure_nox', // TODO: Not supported by Homey yet
    // ozone: 'measure_ozone',  // TODO: Not supported by Homey yet
    pm1: 'measure_pm1', // TODO: Not supported by Homey yet
    pm10: 'measure_pm10', // TODO: Not supported by Homey yet
    pm25: 'measure_pm25',
    // power_factor: 'measure_power_factor', // TODO: Not supported by Homey yet
    power: 'measure_power',
    pressure: 'measure_pressure',
    signal_strength: 'measure_signal_strength', // TODO: Not supported by Homey yet
    // sulphur_dioxide: 'measure_so2', // TODO: Not supported by Homey yet
    temperature: 'measure_temperature',
    volatile_organic_compounds: 'measure_voc', // TODO: Not supported by Homey yet
    voltage: 'measure_voltage',

    // NOTE: The following device classes are not supported by Home Assistant!
    // noise: 'measure_noise',
    // rain: 'measure_rain',
    // wind_strength: 'measure_wind_strength',
    // wind_angle: 'measure_wind_angle',
    // gust_strength: 'measure_gust_strength',
    // gust_angle: 'measure_gust_angle',
    // ultraviolet: 'measure_ultraviolet',
    // water_flow: 'measure_water',
    // water: 'measure_water',
  };

  // static ENTITY_LIGHT_CAPABILITY_MAP = {
  //   onoff: 'onoff',
  //   brightness: 'dim',
  //   color_temp: 'light_temperature',
  //   hs: 'light_saturation',
  //   hs: 'light_hue',
  //   // '': 'light_mode'
  // };

  static ENTITY_MEDIAPLAYER_CLASS_MAP = {
    tv: 'tv',
    speaker: 'speaker',
    receiver: 'amplifier',
  };

  // static ENTITY_SPEAKER_CAPABILITY_MAP = {
  //   state: 'speaker_playing',
  //   // '': 'speaker_next',
  //   // '': 'speaker_prev',
  //   media_artist: 'speaker_artist',
  //   media_album_name: 'speaker_album',
  //   media_title: 'speaker_track',
  //   is_volume_muted: 'volume_mute',
  //   volume_level: 'volume_set',
  // };

  static ENTITY_SPEAKER_SUPPORTED_FEATURES = {
    1: ['speaker_playing', 'speaker_track', 'speaker_artist', 'speaker_album'],
    2: ['speaker_position', 'speaker_duration'],
    4: ['volume_set'],
    8: ['volume_mute'],
    16: ['speaker_prev'],
    32: ['speaker_next'],
    // 128: ['onoff'], // Turn Off
    // 256: ['onoff'], // Turn On
    // 512: 'play_media', // TODO: Not supported by Homey yet
    1024: ['volume_up', 'volume_down'],
    // 2048: 'select_source', // TODO: Not supported by Homey yet
    // 4096: 'speaker_stop', // TODO: Not supported by Homey yet
    // 8192: 'clear_playlist', // TODO: Not supported by Homey yet
    16384: ['speaker_playing'],
    32768: ['speaker_shuffle'],
    // 65536: 'select_sound_mode', // TODO: Not supported by Homey yet
    // 131072: 'browse_media', // TODO: Not supported by Homey yet
    262144: ['speaker_repeat'],
    // 524288: 'grouping', // TODO: Not supported by Homey yet
  };

  static ENTITY_ALARM_CAPABILITY_MAP = {
    outlet: 'onoff',
    // On means low, Off means normal : "True when battery is low"
    battery: 'alarm_battery',
    // On means charging, Off means not charging : ?
    battery_charging: 'alarm_charging', // TODO: Not supported by Homey yet
    // On means cold, Off means normal : ?
    cold: 'alarm_generic',
    // On means connected, Off means disconnected : ?
    connectivity: 'onoff',
    // On means open, Off means closed : ?
    door: 'alarm_contact', // ?
    // On means open, Off means closed : "True when garage door is closed"
    garage_door: 'garagedoor_closed',
    // On means gas detected, Off means no gas (clear) : "True when [x] gas is detected"
    gas: 'alarm_co2', // ?
    // On means hot, Off means normal : "True when extreme heat has been detected"
    heat: 'alarm_heat',
    // On means light detected, Off means no light : ?
    light: 'alarm_generic',
    // On means open (unlocked), Off means closed (locked) : "True when the lock is locked"
    lock: 'locked',
    // On means wet, Off means dry : "True when water has been detected"
    moisture: 'alarm_water',
    // On means motion detected, Off means no motion (clear) : "Motion alarm turned on"
    motion: 'alarm_motion',
    // On means moving, Off means not moving (stopped) : ?
    moving: 'alarm_generic',
    // On means occupied, Off means not occupied (clear) : ?
    occupancy: 'alarm_occupancy',
    // On means open, Off means closed : ?
    opening: 'alarm_contact',
    // On means plugged in, Off means unplugged : ?
    plug: 'alarm_plugged_in', // TODO: Not supported by Homey yet
    // On means power detected, Off means no power : ?
    power: 'onoff',
    // On means home, Off means away : ?
    presence: 'alarm_motion',
    // On means problem detected, Off means no problem (OK) : ?
    problem: 'alarm_problem', // TODO: Not supported by Homey yet
    // On means running, Off means not running : ?
    running: 'alarm_generic', // TODO: Not supported by Homey yet
    // On means unsafe, Off means safe : ?
    safety: 'alarm_safety', // TODO: Not supported by Homey yet
    // On means smoke detected, Off means no smoke (clear) : "True when smoke is detected"
    smoke: 'alarm_smoke',
    // On means sound detected, Off means no sound (clear) : ?
    sound: 'alarm_sound', // TODO: Not supported by Homey yet
    // On means tampering detected, Off means no tampering (clear) : "True when tampering has been detected"
    tamper: 'alarm_tamper',
    // On means update available, Off means up-to-date : ?
    // update: 'alarm_generic',
    // On means vibration detected, Off means no vibration : ?
    vibration: 'alarm_vibration', // TODO: Not supported by Homey yet
    // On means open, Off means closed : "True when the window coverings are closed"
    window: 'windowcoverings_closed',
  };

  // static LIGHT_CAPABILITIES = ['onoff', 'brightness', 'color_temp'];
  // static SPEAKER_CAPABILITIES = ['state', 'media_artist', 'media_album_name', 'media_title', 'is_volume_muted', 'volume_level'];

};
