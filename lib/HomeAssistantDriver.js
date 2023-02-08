'use strict';

const fetch = require('node-fetch');
const Hass = require('home-assistant-js-websocket');

const Homey = require('homey');
const HomeAssistantConstants = require('./HomeAssistantConstants');

module.exports = class HomeAssistantDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    // Init Action Cards
    this.homey.flow
      .getActionCard('fan_speed_set')
      .registerRunListener(async args => {
        args.device.onCapabilityFanSpeedSet(args['fan_speed']);
      });

    this.homey.flow
      .getActionCard('fan_mode_set')
      .registerRunListener(async args => {
        args.device.onCapabilityFanModeSet(args['fan_mode']);
      });

    this.homey.flow
      .getActionCard('aircleaner_mode_set')
      .registerRunListener(async args => {
        args.device.onCapabilityAirCleanerModeSet(args['aircleaner_mode']);
      });

    this.homey.flow
      .getConditionCard('action_is')
      .registerRunListener(async args => {
        return args.device.isValueRunListener(args.action, 'action');
      });

    this.homey.flow
      .getConditionCard('status_is')
      .registerRunListener(async args => {
        return args.device.isValueRunListener(args.status, 'status');
      });

    this.homey.flow
      .getConditionCard('alarm_charging_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_charging');
      });

    this.homey.flow
      .getConditionCard('alarm_occupancy_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_occupancy');
      });

    this.homey.flow
      .getConditionCard('alarm_plugged_in_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_plugged_in');
      });

    this.homey.flow
      .getConditionCard('alarm_problem_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_problem');
      });

    this.homey.flow
      .getConditionCard('alarm_running_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_running');
      });

    this.homey.flow
      .getConditionCard('alarm_safety_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_safety');
      });

    this.homey.flow
      .getConditionCard('alarm_sound_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_sound');
      });

    this.homey.flow
      .getConditionCard('alarm_vibration_is')
      .registerRunListener(async args => {
        return args.device.isOnRunListener('alarm_vibration');
      });
  }

  onDiscoveryResults = () => {
    const discoveryStrategy = this.getDiscoveryStrategy();
    return discoveryStrategy.getDiscoveryResults();
  };

  async onPair(socket) {
    const servers = {
      new: null,
    };

    let currentViewId = 'list_servers';
    let currentServerId = null;

    const onViewSelectServerLoading = async () => {
      if (currentServerId === 'new') {
        return socket.showView('configure_server');
      }

      if (currentServerId.startsWith('mdns:')) {
        currentServerId = currentServerId.replace('mdns:', '');
        const discoveryResults = this.onDiscoveryResults();
        const server = discoveryResults[currentServerId];

        servers[currentServerId] = {
          protocol: 'http',
          host: server.host,
          port: server.port,
          name: null,
        };

        return socket.showView('authenticate_server');
      }

      return socket.showView('list_server_devices');
    };

    const onViewConfigureServer = async () => {
      // ...
    };

    const onViewAuthenticateServer = async () => {
      const server = servers[currentServerId];
      if (!server) {
        throw new Error(`Invalid Server: ${currentServerId}`);
      }

      const hassUrl = `${server.protocol}://${server.host}:${server.port}`;
      const clientId = 'https://callback.athom.com';
      const redirectUri = 'https://callback.athom.com/oauth2/callback';
      const authorizationUrl = `${hassUrl}/auth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
      const callback = await this.homey.cloud.createOAuth2Callback(
        authorizationUrl,
      );
      callback
        .on('url', url => {
          socket.emit('url', url).catch(this.error);
        })
        .on('code', authCode => {
          Promise.resolve()
            .then(async () => {
              // Swap authCode for a Regular Access Token
              const hassAuth = await Hass.getAuth({
                hassUrl,
                clientId,
                authCode,
              });

              // Create WebSocket Connection
              const hassConnection = await Hass.createConnection({
                auth: hassAuth,
              });

              // Create a Long-Lived Access Token
              const hassConnectionLongLivedAccessToken = await hassConnection.sendMessagePromise({
                type: 'auth/long_lived_access_token',
                client_name: `Homey (Created at ${new Date()})`,
                client_icon: 'https://etc.athom.com/logo/transparent/256.png',
                lifespan: 3650,
              });

              // Close WebSocket Connection
              await hassConnection.close();

              // Revoke Regular Access Token
              await hassAuth.revoke();

              // Fetch server config
              const config = await Promise.resolve().then(async () => {
                const res = await fetch(`${hassUrl}/api/config`, {
                  headers: {
                    Authorization: `Bearer ${hassConnectionLongLivedAccessToken}`,
                  },
                });
                return res.json();
              });

              // Create & Save Server
              currentServerId = await this.homey.app.createServer({
                name: config.location_name,
                host: server.host,
                port: server.port,
                protocol: server.protocol,
                token: hassConnectionLongLivedAccessToken,
              });
            })
            .then(() => socket.emit('authorized'))
            .catch(err => {
              this.error(err);
              socket.emit('error', err.message || err.toString());
            });
        });
    };

    const onListServers = async () => {
      const servers = await this.homey.app.getServers();
      const discoveryResults = this.onDiscoveryResults();

      return [
        // Existing Servers
        ...Object.entries(servers).map(([serverId, server]) => ({
          name: `${server.name} (${server.protocol}://${server.host}:${server.port})`,
          data: {
            id: serverId,
          },
        })),

        // mDNS Servers
        ...Object.entries(discoveryResults).map(([serverId, server]) => {
          // console.log('result', serverId, server, server.name);
          return {
            name: `${server.name} (http://${server.host}:${server.port})`,
            data: {
              id: `mdns:${server.id}`,
            },
          };
        }),

        // New Server
        {
          name: 'New server...',
          data: {
            id: 'new',
          },
        },
      ];
    };

    const onListServerDevices = async () => {
      const server = await this.homey.app.getServer(currentServerId);
      const connection = await server.getConnection();
      const deviceRegistry = await connection.sendMessagePromise({
        type: 'config/device_registry/list',
      });
      const entityRegistry = await connection.sendMessagePromise({
        type: 'config/entity_registry/list',
      });
      const entities = await server.getEntities();

      const titleCase = str => {
        const splitStr = str?.toLowerCase().split(' ');
        for (let i = 0; i < splitStr.length; i++) {
          // You do not need to check if i is larger than splitStr length, as your for does that for you
          // Assign it back to the array
          splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        // Directly return the joined string
        return splitStr.join(' ');
      };

      // console.log('deviceRegistry', deviceRegistry)
      // console.log('entityRegistry', entityRegistry)
      // console.log('entities', entities)

      return (
        deviceRegistry
          // Add device.entities
          .map(device => ({
            entities: entityRegistry
              .filter(entity => {
                return entity.device_id === device.id;
              })
              .map(entity => ({
                instance: entities[entity.entity_id],
                ...entity,
              })),
            ...device,
          }))

          // Filter devices without entities
          .filter(device => {
            if (device.entities.length === 0) return false;
            return true;
          })

          // Map Home Assistant device to Homey Device
          .map(homeAssistantDevice => {
            // this.log(JSON.stringify(homeAssistantDevice, false, 2));

            const homeyDevice = {
              name:
                typeof homeAssistantDevice.name_by_user === 'string'
                  ? homeAssistantDevice.name_by_user
                  : homeAssistantDevice.name,
              data: {
                deviceId: homeAssistantDevice.id,
                serverId: currentServerId,
              },
              store: {
                manufacturer: homeAssistantDevice.manufacturer,
                model: homeAssistantDevice.model,
                identifiers: homeAssistantDevice.identifiers,
              },
              class: undefined,
              iconOverride: undefined,
              capabilities: [],
              capabilitiesOptions: {
                // [capabilityId]: {
                //   entityId: 'sensor.foo',
                // }
              },
            };

            for (const entity of Object.values(homeAssistantDevice.entities)) {
              const entityId = entity.entity_id;

              // Skip entities without instance
              if (!entity.instance) continue;

              // Set friendly name without the device name.
              let friendlyName = entity.instance.attributes['friendly_name'];
              if (
                friendlyName
                && friendlyName.length > 0
                && homeyDevice.name.length > 0
                && friendlyName.startsWith(homeyDevice.name)
              ) {
                friendlyName = titleCase(friendlyName.slice(homeyDevice.name.length))
                  || friendlyName;
              }

              // Is this entity a Light?
              // https://developers.home-assistant.io/docs/core/entity/light/
              if (entityId.startsWith('light.')) {
                // If the Home Assistant device contains light entities, this should be the main class of the Home Device.
                homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor'
                  ? homeyDevice.class
                  : 'light';
                homeyDevice.iconOverride = homeyDevice.iconOverride && homeyDevice.class !== 'sensor'
                  ? homeyDevice.iconOverride
                  : 'light-bulb';

                const supportedColorModes = entity.instance.attributes['supported_color_modes'];

                // Check if a light supports any of the supported color modes.
                const lightSupportsColorChanging = supportedColorModes.includes('hs')
                  || supportedColorModes.includes('rgb')
                  || supportedColorModes.includes('rgbw')
                  || supportedColorModes.includes('rgbww')
                  || supportedColorModes.includes('xy');

                // Is this device a Light that can turn on/off?
                if (typeof entity.instance.state === 'string') {
                  homeyDevice.capabilities.push('onoff');
                  homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
                  homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
                }

                if (entity.instance.attributes) {
                  // Is this device a Light that can change brightness?
                  // This includes not only brightness but also all other modes which allow dimming.
                  if (
                    supportedColorModes.includes('brightness')
                    || supportedColorModes.includes('color_temp')
                    || supportedColorModes.includes('white')
                    || lightSupportsColorChanging
                  ) {
                    homeyDevice.capabilities.push('dim');
                    homeyDevice.capabilitiesOptions['dim'] = homeyDevice.capabilitiesOptions['dim'] || {};
                    homeyDevice.capabilitiesOptions['dim'].entityId = entityId;
                  }

                  // Is this device a Light that can change color temperature?
                  if (supportedColorModes.includes('color_temp')) {
                    homeyDevice.capabilities.push('light_temperature');
                    homeyDevice.capabilitiesOptions['light_temperature'] = homeyDevice.capabilitiesOptions['light_temperature']
                      || {};
                    homeyDevice.capabilitiesOptions[
                      'light_temperature'
                    ].entityId = entityId;
                  }

                  // Is this device a Light that can change color?
                  if (lightSupportsColorChanging) {
                    homeyDevice.capabilities.push('light_hue');
                    homeyDevice.capabilitiesOptions['light_hue'] = homeyDevice.capabilitiesOptions['light_hue'] || {};
                    homeyDevice.capabilitiesOptions['light_hue'].entityId = entityId;

                    homeyDevice.capabilities.push('light_saturation');
                    homeyDevice.capabilitiesOptions['light_saturation'] = homeyDevice.capabilitiesOptions['light_saturation'] || {};
                    homeyDevice.capabilitiesOptions[
                      'light_saturation'
                    ].entityId = entityId;
                  }

                  // Set light_mode if both color & temperature are supported
                  if (
                    supportedColorModes.includes('color_temp')
                    && lightSupportsColorChanging
                  ) {
                    // homeyDevice.capabilities.push('light_temperature');
                    // homeyDevice.capabilitiesOptions['light_temperature'] = homeyDevice.capabilitiesOptions['light_temperature'] || {};
                    // homeyDevice.capabilitiesOptions['light_temperature'].entityId = entityId;

                    // homeyDevice.capabilities.push('light_hue');
                    // homeyDevice.capabilitiesOptions['light_hue'] = homeyDevice.capabilitiesOptions['light_hue'] || {};
                    // homeyDevice.capabilitiesOptions['light_hue'].entityId = entityId;

                    // homeyDevice.capabilities.push('light_saturation');
                    // homeyDevice.capabilitiesOptions['light_saturation'] = homeyDevice.capabilitiesOptions['light_saturation'] || {};
                    // homeyDevice.capabilitiesOptions['light_saturation'].entityId = entityId;

                    homeyDevice.capabilities.push('light_mode');

                    homeyDevice.capabilities.push('light_mode');
                    homeyDevice.capabilitiesOptions['light_mode'] = homeyDevice.capabilitiesOptions['light_mode'] || {};
                    homeyDevice.capabilitiesOptions['light_mode'].entityId = entityId;
                  }
                }
              }

              // Is this entity a Switch?
              // https://developers.home-assistant.io/docs/core/entity/switch/
              if (entityId.startsWith('switch.')) {
                // If the Home Assistant device contains switch entities, socket should be the main class of the Home Device.
                homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor'
                  ? homeyDevice.class
                  : 'socket';
                homeyDevice.iconOverride = homeyDevice.iconOverride && homeyDevice.class !== 'sensor'
                  ? homeyDevice.iconOverride
                  : 'plug';

                const currentOnOffCapabilities = homeyDevice.capabilities.filter((item, index) => {
                  return item.startsWith('onoff');
                });

                // Is this Home Assistant Entity a known Homey Capability?
                const entityIdWithoutSwitch = entityId.substring(
                  'switch.'.length,
                );

                const capabilityId = (currentOnOffCapabilities.length > 0 || !['sensor', 'plug', 'socket'].includes(homeyDevice.class))
                  ? `onoff.${currentOnOffCapabilities.length}`
                  : 'onoff';

                homeyDevice.capabilities.push(capabilityId);
                homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName
                  || entity.instance.attributes['device_class']
                  || entityIdWithoutSwitch;
                homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
              }

              // Is this entity a Fan?
              // https://www.home-assistant.io/integrations/fan/
              if (entityId.startsWith('fan.')) {
                homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor'
                  ? homeyDevice.class
                  : 'fan';
                homeyDevice.iconOverride = homeyDevice.iconOverride && homeyDevice.class !== 'sensor'
                  ? homeyDevice.iconOverride
                  : 'fan';

                // Is this device a Fan that can turn on/off?
                if (typeof entity.instance.state === 'string') {
                  homeyDevice.capabilities.push('onoff');
                  homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
                  homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
                }

                if (entity.instance.attributes) {
                  const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

                  for (const [key, value] of Object.entries(
                    HomeAssistantConstants.ENTITY_FAN_SUPPORTED_FEATURES,
                  )) {
                    // Check if the key is part of the supported features binary value.
                    if (supportedFeatures & key) {
                      value.forEach(capabilityId => {
                        if (capabilityId === 'fan_mode') {
                          if (
                            entity.instance.attributes['preset_modes'].every(
                              mode => ['nature', 'normal'].includes(
                                mode?.toLowerCase(),
                              ),
                            )
                          ) {
                            // Check if fan preset mode contains Nature and Normal.
                            homeyDevice.capabilities.push('fan_mode');
                            homeyDevice.capabilitiesOptions['fan_mode'] = homeyDevice.capabilitiesOptions['fan_mode'] || {};
                            homeyDevice.capabilitiesOptions[
                              'fan_mode'
                            ].entityId = entityId;
                          } else if (
                            entity.instance.attributes['preset_modes'].every(
                              mode => ['fan', 'auto', 'silent', 'favorite'].includes(
                                mode?.toLowerCase(),
                              ),
                            )
                          ) {
                            // Check if fan preset mode contains Fan, Auto, Silent and Favorite.
                            homeyDevice.capabilities.push('aircleaner_mode');
                            homeyDevice.capabilitiesOptions['aircleaner_mode'] = homeyDevice.capabilitiesOptions[
                              'aircleaner_mode'
                            ] || {};
                            homeyDevice.capabilitiesOptions[
                              'aircleaner_mode'
                            ].entityId = entityId;
                          }
                        } else {
                          homeyDevice.capabilities.push(capabilityId);
                          homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                          homeyDevice.capabilitiesOptions[
                            capabilityId
                          ].entityId = entityId;

                          if (capabilityId === 'fan_speed') {
                            homeyDevice.capabilitiesOptions[
                              capabilityId
                            ].min = 0;
                            homeyDevice.capabilitiesOptions[
                              capabilityId
                            ].max = 1;
                            homeyDevice.capabilitiesOptions[capabilityId].step = Math.floor(
                              entity.instance.attributes['percentage_step'],
                            ) / 100; // A bit of a hack because of rounding errors.
                          }
                        }
                      });
                    }
                  }
                }
              }

              // Is this entity a Vacuum?
              // https://www.home-assistant.io/integrations/vacuum/
              if (entityId.startsWith('vacuum.')) {
                homeyDevice.class = (homeyDevice.class && homeyDevice.class !== 'sensor') ? homeyDevice.class : 'vacuumcleaner';
                homeyDevice.iconOverride = (homeyDevice.iconOverride && homeyDevice.class !== 'sensor') ? homeyDevice.iconOverride : 'vacuum-cleaner';

                // Is this device a Vacuum that can turn on/off?
                if (typeof entity.instance.state === 'string') {
                  homeyDevice.capabilities.push('onoff');
                  homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
                  homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
                }

                if (entity.instance.attributes) {
                  const supportedFeatures = entity.instance.attributes['supported_features'] || 0;
                  for (const [key, value] of Object.entries(HomeAssistantConstants.ENTITY_VACUUM_SUPPORTED_FEATURES)) {
                    // Check if the key is part of the supported features binary value.
                    if (supportedFeatures & key) {
                      console.log('capabilityId', value, entityId);
                      value.forEach(capabilityId => {
                        homeyDevice.capabilities.push(capabilityId);
                        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                      });
                    }
                  }
                }
              }

              // Is this entity a Sensor?
              // https://developers.home-assistant.io/docs/core/entity/sensor/
              if (entityId.startsWith('sensor.')) {
                homeyDevice.class = homeyDevice.class || 'sensor';

                if (entity.instance.attributes) {
                  // Is this Home Assistant Entity a known Homey Capability?
                  const capabilityId = entity.instance.attributes[
                    'device_class'
                  ]
                    ? HomeAssistantConstants.ENTITY_SENSOR_CAPABILITY_MAP[
                      entity.instance.attributes['device_class']
                    ]
                    : null;

                  if (capabilityId) {
                    homeyDevice.capabilities.push(capabilityId);
                    homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                    homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                  } else if (entity.instance.attributes.action !== undefined) {
                    homeyDevice.capabilities.push('action');
                    homeyDevice.capabilitiesOptions['action'] = homeyDevice.capabilitiesOptions['action'] || {};
                    homeyDevice.capabilitiesOptions['action'].entityId = entityId;
                  } else if (
                    entityId.endsWith('_power_outage_count')
                    || entityId.endsWith('_motor_state')
                  ) {
                    // ignore!
                  } else if (
                    entityId.endsWith('_noise')
                    && entity.instance.attributes.unit_of_measurement === 'dB'
                  ) {
                    homeyDevice.capabilities.push('measure_noise');
                    homeyDevice.capabilitiesOptions['measure_noise'] = homeyDevice.capabilitiesOptions['measure_noise'] || {};
                    homeyDevice.capabilitiesOptions['measure_noise'].entityId = entityId;
                  } else if (
                    entityId.endsWith('_rain')
                    && entity.instance.attributes.unit_of_measurement === 'mm'
                  ) {
                    homeyDevice.capabilities.push('measure_rain');
                    homeyDevice.capabilitiesOptions['measure_rain'] = homeyDevice.capabilitiesOptions['measure_rain'] || {};
                    homeyDevice.capabilitiesOptions['measure_rain'].entityId = entityId;
                  } else if (
                    entityId.endsWith('_wind_strength')
                    && entity.instance.attributes.unit_of_measurement === 'km/h'
                  ) {
                    homeyDevice.capabilities.push('measure_wind_strength');
                    homeyDevice.capabilitiesOptions['measure_wind_strength'] = homeyDevice.capabilitiesOptions[
                      'measure_wind_strength'
                    ] || {};
                    homeyDevice.capabilitiesOptions[
                      'measure_wind_strength'
                    ].entityId = entityId;
                  } else if (entityId.endsWith('_status')) {
                    homeyDevice.capabilities.push('status');
                    homeyDevice.capabilitiesOptions['status'] = homeyDevice.capabilitiesOptions['status'] || {};
                    homeyDevice.capabilitiesOptions['status'].entityId = entityId;
                  } else {
                    const entityIdWithoutSensor = entityId.substring(
                      'sensor.'.length,
                    );
                    const capabilityType = entity.instance.attributes[
                      'unit_of_measurement'
                    ]
                      ? 'number'
                      : 'string';
                    const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;

                    homeyDevice.capabilities.push(capabilityId);
                    homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                    homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName
                      || entity.instance.attributes['device_class']
                      || entityIdWithoutSensor;
                    homeyDevice.capabilitiesOptions[capabilityId].units = entity.instance.attributes['unit_of_measurement'] || null;
                    homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                  }
                }
              }

              // Is this entity a Binary Sensor?
              // https://developers.home-assistant.io/docs/core/entity/binary-sensor
              if (entityId.startsWith('binary_sensor.')) {
                homeyDevice.class = homeyDevice.class || 'sensor';

                // Ignore Binary Sensors of type "update"
                if (
                  entity.instance.attributes
                  && entity.instance.attributes['device_class'] !== 'update'
                ) {
                  // Is this Home Assistant Entity a known Homey Capability?
                  const capabilityId = entity.instance.attributes[
                    'device_class'
                  ]
                    ? HomeAssistantConstants.ENTITY_ALARM_CAPABILITY_MAP[
                      entity.instance.attributes['device_class']
                    ]
                    : null;

                  if (capabilityId === 'smoke' || capabilityId === 'heat') {
                    homeyDevice.iconOverride = 'smoke-detector';
                  }

                  if (capabilityId) {
                    homeyDevice.capabilities.push(capabilityId);
                    homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                    homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                  } else {
                    const entityIdWithoutSensor = entityId.substring(
                      'binary_sensor.'.length,
                    );
                    const capabilityType = 'boolean';
                    const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;
                    homeyDevice.capabilities.push(capabilityId);
                    homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                    homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName
                      || entity.instance.attributes['device_class']
                      || entityIdWithoutSensor;
                    homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                  }
                }
              }

              // Is this entity a Media Player?
              // https://developers.home-assistant.io/docs/core/entity/media-player
              if (entityId.startsWith('media_player.')) {
                const mediaType = entity.instance.attributes
                  && entity.instance.attributes['device_class']
                  ? HomeAssistantConstants.ENTITY_MEDIAPLAYER_CLASS_MAP[
                    entity.instance.attributes['device_class']
                  ]
                  : 'speaker';
                homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor'
                  ? homeyDevice.class
                  : mediaType;

                if (
                  !homeyDevice.iconOverride
                  || homeyDevice.class === 'sensor'
                ) {
                  switch (mediaType) {
                    case 'tv':
                      homeyDevice.iconOverride = 'tv';
                      break;
                    case 'speaker':
                      homeyDevice.iconOverride = 'speaker';
                      break;
                    case 'amplifier':
                      homeyDevice.iconOverride = 'pre-amp';
                      break;
                    default:
                      homeyDevice.iconOverride = 'multimedia';
                      break;
                  }
                }

                if (entity.instance.attributes) {
                  if (typeof entity.instance.state === 'string') {
                    homeyDevice.capabilities.push('speaker_playing');
                    homeyDevice.capabilitiesOptions['speaker_playing'] = homeyDevice.capabilitiesOptions['speaker_playing'] || {};
                    homeyDevice.capabilitiesOptions['speaker_playing'].title = friendlyName || entityId;
                    homeyDevice.capabilitiesOptions[
                      'speaker_playing'
                    ].entityId = entityId;
                  }

                  const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

                  for (const [key, value] of Object.entries(
                    HomeAssistantConstants.ENTITY_SPEAKER_SUPPORTED_FEATURES,
                  )) {
                    // Check if the key is part of the supported features binary value.
                    if (supportedFeatures & key) {
                      value.forEach(capabilityId => {
                        homeyDevice.capabilities.push(capabilityId);
                        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                        homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName || entityId;
                        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                      });
                    }
                  }
                }
              }

              // Is this entity a Cover?
              // https://developers.home-assistant.io/docs/core/entity/binary-sensor
              if (entityId.startsWith('cover.')) {
                const coveringType = entity.instance.attributes['device_class']
                  ? HomeAssistantConstants.ENTITY_COVER_CLASS_MAP[
                    entity.instance.attributes['device_class']
                  ]
                  : 'windowcoverings';
                homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor'
                  ? homeyDevice.class
                  : coveringType;

                if (
                  !homeyDevice.iconOverride
                  || homeyDevice.class === 'sensor'
                ) {
                  switch (coveringType) {
                    case 'sunshade':
                      homeyDevice.iconOverride = 'sunshade2';
                      break;
                    case 'blinds':
                      homeyDevice.iconOverride = 'blinds';
                      break;
                    case 'curtain':
                      homeyDevice.iconOverride = 'curtains';
                      break;
                    case 'garagedoor':
                      homeyDevice.iconOverride = 'garage-door';
                      break;
                    default:
                      homeyDevice.iconOverride = 'sunshade';
                      break;
                  }
                }

                if (entity.instance.attributes) {
                  const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

                  for (const [key, value] of Object.entries(
                    HomeAssistantConstants.ENTITY_COVER_SUPPORTED_FEATURES,
                  )) {
                    // Check if the key is part of the supported features binary value.
                    if (supportedFeatures & key) {
                      value.forEach(capabilityId => {
                        homeyDevice.capabilities.push(capabilityId);
                        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                        homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName || entityId;
                        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                      });
                    }
                  }

                  if (coveringType === 'garagedoor') {
                    homeyDevice.capabilities.push('garagedoor_closed');
                    homeyDevice.capabilitiesOptions['garagedoor_closed'] = homeyDevice.capabilitiesOptions['garagedoor_closed']
                      || {};
                    homeyDevice.capabilitiesOptions['garagedoor_closed'].title = friendlyName || entityId;
                    homeyDevice.capabilitiesOptions[
                      'garagedoor_closed'
                    ].entityId = entityId;
                  }
                }
              }

              /*
               * TODO:
               *  Possible other Home Assistant entities which could be added: climate, camera, device_tracker, weather,
               *  water_heater, siren, select, remote, number, humidifier, alarm, air_quality.
               */
            }

            return homeyDevice;
          })

          // Filter devices
          .filter(homeyDevice => {
            // Filter devices without capabilities
            if (!homeyDevice.capabilities.length) return false;

            // Filter devices without name
            if (!homeyDevice.name) return false;
            return true;
          })
      );
    };

    socket.setHandler('showView', async viewId => {
      currentViewId = viewId;

      if (currentViewId === 'select_server_loading') {
        return onViewSelectServerLoading();
      }

      if (currentViewId === 'configure_server') {
        return onViewConfigureServer();
      }

      if (currentViewId === 'authenticate_server') {
        return onViewAuthenticateServer();
      }
    });

    socket.setHandler('test_server', async ({ host, port, protocol }) => {
      const url = protocol === 'http'
        ? `http://${host}:${port}`
        : `https://${host}:${port}`;
      const res = await fetch(url);
      const body = await res.text();
      if (!body.includes('Home Assistant')) {
        throw new Error(
          'Server responded, but does not seem to be a Home Assistant server?',
        );
      }

      if (typeof protocol !== 'string') {
        throw new Error('Invalid Port');
      }

      if (typeof host !== 'string') {
        throw new Error('Invalid Host');
      }

      if (typeof port !== 'string') {
        throw new Error('Invalid Port');
      }

      servers[currentServerId] = {
        protocol,
        host,
        port,
        name: null,
      };
    });

    socket.setHandler('list_devices', async () => {
      if (currentViewId === 'list_servers') {
        return onListServers();
      }

      return onListServerDevices();
    });

    socket.setHandler('list_servers_selection', async server => {
      currentServerId = server[0].data.id;
    });
  }

  // async onPairListDevices() {
  //   const client = this.homey.app.getClient();
  //   const connection = await client.getConnection();

  //   const deviceRegistry = await connection.sendMessagePromise({ type: "config/device_registry/list" });
  //   const entityRegistry = await connection.sendMessagePromise({ type: "config/entity_registry/list" });
  //   const entities = await client.getEntities();
  //   //console.log(JSON.stringify(deviceRegistry, null, 4));
  //   //console.log(JSON.stringify(entityRegistry, null, 4));
  // }

};
