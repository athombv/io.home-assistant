'use strict';

module.exports = class HomeAssistantConstants {

  static ENTITY_SENSOR_CAPABILITY_MAP = {
    temperature: 'measure_temperature',
    co: 'measure_co',
    co2: 'measure_co2',
    pm25: 'measure_pm25',
    humidity: 'measure_humidity',
    pressure: 'measure_pressure',
    noise: 'measure_noise',
    rain: 'measure_rain',
    wind_strength: 'measure_wind_strength',
    wind_angle: 'measure_wind_angle',
    gust_strength: 'measure_gust_strength',
    gust_angle: 'measure_gust_angle',
    battery: 'measure_battery',
    power: 'measure_power',
    voltage: 'measure_voltage',
    current: 'measure_current',
    luminance: 'measure_luminance',
    ultraviolet: 'measure_ultraviolet',
    water_flow: 'measure_water',
    water: 'measure_water',
    energy: 'meter_power',
  };

  static ENTITY_LIGHT_CAPABILITY_MAP = {
    onoff: 'onoff',
    brightness: 'dim',
    color_temp: 'light_temperature',
    hs: 'light_saturation',
    hs: 'light_hue',
    // '': 'light_mode'
  };

  static ENTITY_SPEAKER_CAPABILITY_MAP = {
    state: 'speaker_playing',
    // '': 'speaker_next',
    // '': 'speaker_prev',
    media_artist: 'speaker_artist',
    media_album_name: 'speaker_album',
    media_title: 'speaker_track',
    is_volume_muted: 'volume_mute',
    volume_level: 'volume_set',
  };

  static ENTITY_ALARM_CAPABILITY_MAP = {
    outlet: 'onoff',
    // On means low, Off means normal : "True when battery is low"
    battery: 'alarm_battery',
    // On means charging, Off means not charging : ?
    battery_charging: 'alarm_generic',
    // On means cold, Off means normal : ?
    cold: 'alarm_generic',
    // On means connected, Off means disconnected : ?
    connectivity: 'alarm_generic',
    // On means open, Off means closed : ?
    door: 'alarm_generic', // ?
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
    occupancy: 'alarm_generic',
    // On means open, Off means closed : ?
    opening: 'alarm_generic',
    // On means plugged in, Off means unplugged : ?
    plug: 'alarm_generic',
    // On means power detected, Off means no power : ?
    power: 'alarm_generic',
    // On means home, Off means away : ?
    presence: 'alarm_generic',
    // On means problem detected, Off means no problem (OK) : ?
    problem: 'alarm_generic',
    // On means running, Off means not running : ?
    running: 'alarm_generic',
    // On means unsafe, Off means safe : ?
    safety: 'alarm_generic',
    // On means smoke detected, Off means no smoke (clear) : "True when smoke is detected"
    smoke: 'alarm_smoke',
    // On means sound detected, Off means no sound (clear) : ?
    sound: 'alarm_generic',
    // On means tampering detected, Off means no tampering (clear) : "True when tampering has been detected"
    tamper: 'alarm_tamper',
    // On means update available, Off means up-to-date : ?
    update: 'alarm_generic',
    // On means vibration detected, Off means no vibration : ?
    vibration: 'alarm_generic',
    // On means open, Off means closed : "True when the window coverings are closed"
    window: 'windowcoverings_closed',
  };

  static LIGHT_CAPABILITIES = ['onoff', 'brightness', 'color_temp'];
  static SPEAKER_CAPABILITIES = ['state', 'media_artist', 'media_album_name', 'media_title', 'is_volume_muted', 'volume_level'];

};
