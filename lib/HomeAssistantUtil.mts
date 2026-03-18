export function getNativeAppSuggestion(
  manufacturer = '',
  model = '',
  identifiers: string[] = [],
  platform?: string,
): string | null {
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

  if (
    manufacturer === 'Signify Netherlands B.V.' || // bridge its manufacturer is Signify
    model.startsWith('Hue') ||
    identifiers.includes('hue')
  ) {
    return 'Philips Hue';
  }

  // Disabled messages for Zigbee devices.
  // if (manufacturer === 'IKEA of Sweden'
  //   || (model.startsWith('TRADFRI') && identifiers.includes('zha'))) {
  //   return 'IKEA Trådfri';
  // }

  if (manufacturer === 'Netatmo' || model.startsWith('Netatmo') || identifiers.includes('netatmo')) {
    return 'Netatmo';
  }

  if (manufacturer === 'Sonos' || identifiers.includes('sonos')) {
    return 'Sonos';
  }

  if (manufacturer === 'Tado' || identifiers.includes('tado')) {
    return 'Tado';
  }

  if (manufacturer === 'Spotify' || identifiers.includes('spotify')) {
    return 'Spotify';
  }

  if (manufacturer === 'Shelly' || identifiers.includes('shelly')) {
    return 'Shelly';
  }

  if (manufacturer === 'TP-Link' || identifiers.includes('tplink')) {
    return 'TP-Link Kasa Smart';
  }

  if (manufacturer === 'Samsung' || model.startsWith('Samsung') || identifiers.includes('samsungtv')) {
    return 'Samsung TV';
  }

  if (manufacturer === 'Tuya' || identifiers.includes('tuya')) {
    return 'Tuya';
  }

  if (manufacturer === 'Yeelight' || identifiers.includes('yeelight')) {
    return 'Yeelight';
  }

  if (manufacturer === 'switchbot' || identifiers.includes('switchbot')) {
    return 'SwitchBot';
  }

  // the manufacturer was self.device.appliance.brand, thus making it too dynamic to compare it to a static value. The identifier is 99% of the time the domain, making it more reliable
  if (identifiers.includes('home_connect')) {
    // they are Home Assistant Cloud only
    return 'Bosch-Siemens Home Connect';
  }

  // Homey Pro Only below

  if (platform !== 'cloud') {
    if (manufacturer === 'Google Inc.' || identifiers.includes('cast')) {
      return 'Google Chromecast';
    }

    // Disabled messages for Zigbee devices.
    // if (manufacturer === 'Xiaomi'
    // || identifiers.includes('xiaomi_miio')) {
    //   return 'Xiaomi Mi Home';
    // }

    if (
      manufacturer === 'UniFi Network' || // ATTR_MANUFACTURER = "Ubiquiti Networks"
      identifiers.includes('unifi')
    ) {
      return 'Unifi';
    }

    if (manufacturer === 'HomeKit Controller' || identifiers.includes('homekit_controller')) {
      return 'HomeKit Controller';
    }

    if (manufacturer === 'HomeKit' || identifiers.includes('homekit')) {
      return 'HomeKit';
    }

    if (manufacturer === 'Synology' || identifiers.includes('synology_dsm')) {
      return 'Synology';
    }

    if (manufacturer === 'InfluxDB' || identifiers.includes('influxdb')) {
      return 'InfluxDb';
    }

    if (manufacturer === 'Tasmota' || identifiers.includes('tasmota')) {
      return 'Tasmota MQTT';
    }

    if (
      manufacturer === 'Amazon Alexa' || // they are Home Assistant Cloud only
      identifiers.includes('alexa')
    ) {
      return 'Amazon Alexa';
    }

    if (manufacturer === 'Broadlink' || identifiers.includes('broadlink')) {
      return 'Broadlink';
    }

    if (manufacturer === 'Telegram' || identifiers.includes('telegram_bot')) {
      return 'Telegram Bot';
    }

    if (manufacturer === 'Kodi' || identifiers.includes('kodi')) {
      return 'Kodi';
    }

    if (manufacturer === 'iRobot' || identifiers.includes('roomba')) {
      return 'iRobot';
    }

    if (manufacturer === 'HEOS' || identifiers.includes('heos')) {
      return 'Denon Heos';
    }
  }

  return null;
}

export function getFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1); // getMonth() returns 0-11, so add 1
  const day = padNumber(date.getDate());
  const hours = padNumber(date.getHours());
  const minutes = padNumber(date.getMinutes());
  const seconds = padNumber(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function padNumber(value: number, length: number = 2): string {
  return String(value).padStart(length, '0');
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function titleCase (str: string): string {
  const splitStr = str?.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ').trim();
}
