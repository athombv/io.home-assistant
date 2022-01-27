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

  static ENTITY_SPEAKER_CAPABILITY_MAP = {
    state: 'speaker_playing',
    media_artist: 'speaker_artist',
    media_album_name: 'speaker_album',
    media_title: 'speaker_track',
    is_volume_muted: 'volume_mute',
    volume_level: 'volume_set',
  };

  static ENTITY_ALARM_CAPABILITY_MAP = {
    outlet: 'onoff',
    battery: 'alarm_battery',
    battery_charging: 'alarm_generic',
    cold: 'alarm_generic',
    connectivity: 'alarm_generic',
    door: 'alarm_generic',
    garage_door: 'garagedoor_closed',
    gas: 'alarm_co2',
    heat: 'alarm_heat',
    light: 'alarm_generic',
    lock: 'locked',
    moisture: 'alarm_water',
    motion: 'alarm_motion',
    moving: 'alarm_generic',
    occupancy: 'alarm_generic',
    opening: 'alarm_generic',
    plug: 'alarm_generic',
    power: 'alarm_generic',
    presence: 'alarm_generic',
    problem: 'alarm_generic',
    running: 'alarm_generic',
    safety: 'alarm_generic',
    smoke: 'alarm_smoke',
    sound: 'alarm_generic',
    tamper: 'alarm_tamper',
    update: 'alarm_generic',
    vibration: 'alarm_generic',
    window: 'windowcoverings_closed',
  };

  static LIGHT_CAPABILITIES = ['onoff', 'brightness', 'color_temp'];
  static SPEAKER_CAPABILITIES = ['state', 'media_artist', 'media_album_name', 'media_title', 'is_volume_muted', 'volume_level'];

};
