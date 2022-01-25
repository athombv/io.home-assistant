'use strict';

const uuid = require('uuid');

module.exports = class HomeAssistantUtil {

  static getNativeAppSuggestion({
    manufacturer = '',
    model = '',
    identifiers = [],
  }) {
    identifiers = identifiers.flat();

    if (typeof manufacturer !== 'string') {
      manufacturer = '';
    }

    if (typeof model !== 'string') {
      model = '';
    }

    if (!Array.isArray(identifiers)) {
      identifiers = [];
    }

    // top 100 relative brands from home assistant analytics
    // https://analytics.home-assistant.io/#integrations 

    // TODO add Google Nest (+ Google Nest Audio)
    // added IKEA / general zigbee compatibility with ZHA python lib
    // TODO add Fibaro / general ZWave_js compatibility
    // TODO add Tuya or what is Tuya compatible

    if (manufacturer === 'Signify Netherlands B.V.' //bridge its manufacturer is Signify
      || model.startsWith('Hue')
      || identifiers.includes('hue')) {
      return 'Philips Hue';
    }

    if (manufacturer === 'IKEA of Sweden'
      || model.startsWith('TRADFRI')
      && identifiers.includes('zha')) {
      return 'IKEA Trådfri';
    }

    if (manufacturer === 'Netatmo'
      || model.startsWith('Netatmo')
      || identifiers.includes('netatmo')) {
      return 'Netatmo';
    }

    if (manufacturer === 'Sonos'
      || identifiers.includes('sonos')) {
      return 'Sonos';
    }

    if (manufacturer === 'Tado'
      || identifiers.includes('tado')) {
      return 'Tado';
    }

    if (manufacturer === 'Spotify'
      || identifiers.includes('spotify')) {
      return 'Spotify';
    }

    if (manufacturer === 'Shelly'
      || identifiers.includes('shelly')) {
      return 'Shelly';
    }

    if (manufacturer === 'TP-Link'
      || identifiers.includes('tplink')) {
      return 'TP-Link Kasa Smart';
    }

    if (manufacturer === 'Samsung'
      || model.startsWith('Samsung')
      || identifiers.includes('samsungtv')) {
      return 'Samsung TV';
    }

    if (manufacturer === 'Tuya'
      || identifiers.includes('tuya')) {
      return 'Tuya';
    }

    if (manufacturer === 'Yeelight'
      || identifiers.includes('yeelight')) {
      return 'Yeelight';
    }

    // the manufacturer was self.device.appliance.brand, thus making it too dynamic to compare it to a static value. The identifier is 99% of the time the domain, making it more reliable
    if (identifiers.includes('home_connect')) { // they are Home Assistant Cloud only
      return 'Bosch-Siemens Home Connect';
    }

    // Homey Pro Only below

    if (manufacturer === 'Google Inc.'
      || identifiers.includes('cast')) {
      return 'Google Chromecast';
    }

    if (manufacturer === 'Xiaomi'
      || identifiers.includes('xiaomi_miio')) {
      return 'Xiaomi Mi Home';
    }

    if (manufacturer === 'UniFi Network' // ATTR_MANUFACTURER = "Ubiquiti Networks"
      || identifiers.includes('unifi')) {
      return 'Unifi';
    }

    if (manufacturer == 'HomeKit Controller'
      || identifiers.includes('homekit_controller')) {
      return 'HomeKit Controller';
    }

    if (manufacturer === 'HomeKit'
      || identifiers.includes('homekit')) {
      return 'HomeKit';
    }

    if (manufacturer === 'Synology'
      || identifiers.includes('synology_dsm')) {
      return 'Synology';
    }

    if (manufacturer === 'InfluxDB'
      || identifiers.includes('influxdb')) {
      return 'InfluxDb';
    }

    if (manufacturer === 'Tasmota'
      || identifiers.includes('tasmota')) {
      return 'Tasmota MQTT';
    }

    if (manufacturer === 'Amazon Alexa' // they are Home Assistant Cloud only
      || identifiers.includes('alexa')) {
      return 'Amazon Alexa';
    }

    if (manufacturer === 'Broadlink'
      || identifiers.includes('broadlink')) {
      return 'Broadlink';
    }

    if (manufacturer === 'Telegram'
      || identifiers.includes('telegram_bot')) {
      return 'Telegram Bot';
    }

    if (manufacturer === 'Kodi'
      || identifiers.includes('kodi')) {
      return 'Kodi';
    }

    if (manufacturer === 'iRobot'
      || identifiers.includes('roomba')) {
      return 'iRobot';
    }

    if (manufacturer === 'HEOS'
      || identifiers.includes('heos')) {
      return 'Denon Heos';
    }

    return null;
  }

  static uuid() {
    return uuid.v4();
  }

  // static getCapabilityFromEntity(entity) {
  //   if (entity.attributes && entity.attributes.device_class) {
  //     if (entity.state == 'on' || entity.state == 'off') {
  //       return this.ENTITY_ALARM_CAPABILITY_MAP[entity.attributes.device_class] || null;
  //     }

  //     return this.ENTITY_SENSOR_CAPABILITY_MAP[entity.attributes.device_class] || null;
  //   }
  //   if (entity.attributes && entity.attributes.supported_color_modes && entity.attributes.supported_features) { // 99% chance the entity that is being scanned is a light
  //     const tmp = [];
  //     if (entity.attributes.supported_color_modes.includes('hs')) {
  //       tmp.push('light_saturation'); tmp.push('light_hue');
  //     }
  //     this.LIGHT_CAPABILITIES.forEach(id => {
  //       console.log('id: ', id);
  //       console.log('translated capability: ', this.ENTITY_LIGHT_CAPABILITY_MAP[id]);
  //       tmp.push(this.ENTITY_LIGHT_CAPABILITY_MAP[id]);
  //     });
  //     return tmp;
  //   }
  //   if (entity.attributes && entity.attributes.media_content_type) {
  //     if (entity.state == 'paused' || entity.state == 'playing') {
  //       const capabilities = [];
  //       this.SPEAKER_CAPABILITIES.forEach(id => {
  //         capabilities.push(this.ENTITY_SPEAKER_CAPABILITY_MAP[id]);
  //       });
  //       return capabilities;
  //     }
  //   }
  //   return null;
  // }

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
  static getCapabilitiesAndClassFromEntities(entities) {
    return {
      capabilities: [],
      class: 'other',
    };
  }
  // static getClassFromCapabilities(capabilities) {
  //   // TODO
  //   // if (capabilities.length > 0) {
  //   //   if (capabilities[0].startsWith('measure_') || (capabilities[0].startsWith('alarm_'))) {
  //   //     return 'sensor';
  //   //   } if (capabilities[0].startsWith('speaker_')) {
  //   //     return 'speaker';
  //   //   } if (capabilities.includes('onoff') && capabilities.length > 1) {
  //   //     return 'light';
  //   //   } if (capabilities[0] === 'onoff' && capabilities.length === 1) {
  //   //     return 'socket';
  //   //   }
  //   //   return 'other';
  //   // }
  //   return 'other';
  // }

};
