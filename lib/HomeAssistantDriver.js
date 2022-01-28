'use strict';

const fetch = require('node-fetch');
const Hass = require('home-assistant-js-websocket');

const Homey = require('homey');
const HomeAssistantConstants = require('./HomeAssistantConstants');

module.exports = class HomeAssistantDriver extends Homey.Driver {

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

      // TODO: mDNS

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
      const callback = await this.homey.cloud.createOAuth2Callback(authorizationUrl);
      callback
        .on('url', url => {
          socket.emit('url', url).catch(this.error);
        })
        .on('code', authCode => {
          Promise.resolve().then(async () => {
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
      return [
        // Existing Servers
        ...Object.entries(servers).map(([serverId, server]) => ({
          name: `${server.name} (${server.protocol}://${server.host}:${server.port})`,
          data: {
            id: serverId,
          },
        })),

        // TODO: mDNS servers

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
      const deviceRegistry = await connection.sendMessagePromise({ type: 'config/device_registry/list' });
      const entityRegistry = await connection.sendMessagePromise({ type: 'config/entity_registry/list' });
      const entities = await server.getEntities();

      // console.log('deviceRegistry', deviceRegistry)
      // console.log('entityRegistry', entityRegistry)
      // console.log('entities', entities)

      return deviceRegistry
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
            name: typeof homeAssistantDevice.name_by_user === 'string'
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

            // Is this entity a Light?
            // https://developers.home-assistant.io/docs/core/entity/light/
            if (entityId.startsWith('light.')) {
              homeyDevice.class = homeyDevice.class || 'light';

              // Is this device a Light that can turn on/off?
              if (typeof entity.instance.state === 'string') {
                homeyDevice.capabilities.push('onoff');
                homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
                homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;
              }

              if (entity.instance.attributes) {
                // Is this device a Light that can change brightness?
                if (typeof entity.instance.attributes['brightness'] === 'number') {
                  homeyDevice.capabilities.push('dim');
                  homeyDevice.capabilitiesOptions['dim'] = homeyDevice.capabilitiesOptions['dim'] || {};
                  homeyDevice.capabilitiesOptions['dim'].entityId = entityId;
                }

                // Is this device a Light that can change color temperature?
                if (typeof entity.instance.attributes['color_temp'] === 'number') {
                  homeyDevice.capabilities.push('light_temperature');
                  homeyDevice.capabilitiesOptions['light_temperature'] = homeyDevice.capabilitiesOptions['light_temperature'] || {};
                  homeyDevice.capabilitiesOptions['light_temperature'].entityId = entityId;
                }

                // Is this device a Light that can change color?
                if (Array.isArray(entity.instance.attributes['hs_color'])) {
                  homeyDevice.capabilities.push('light_hue');
                  homeyDevice.capabilitiesOptions['light_hue'] = homeyDevice.capabilitiesOptions['light_hue'] || {};
                  homeyDevice.capabilitiesOptions['light_hue'].entityId = entityId;

                  homeyDevice.capabilities.push('light_saturation');
                  homeyDevice.capabilitiesOptions['light_saturation'] = homeyDevice.capabilitiesOptions['light_saturation'] || {};
                  homeyDevice.capabilitiesOptions['light_saturation'].entityId = entityId;
                }

                // Set light_mode if both color & temperature are supported
                if (homeyDevice.capabilities.includes('light_temperature')
                  && homeyDevice.capabilities.includes('light_hue')) {
                  homeyDevice.capabilities.push('light_mode');

                  homeyDevice.capabilities.push('light_mode');
                  homeyDevice.capabilitiesOptions['light_mode'] = homeyDevice.capabilitiesOptions['light_mode'] || {};
                  homeyDevice.capabilitiesOptions['light_mode'].entityId = entityId;
                }
              }
            }

            // Is this entity a Sensor?
            // https://developers.home-assistant.io/docs/core/entity/sensor/
            if (entityId.startsWith('sensor.')) {
              homeyDevice.class = homeyDevice.class || 'sensor';

              if (entity.instance.attributes) {
                // Is this Home Assistant Entity a known Homey Capability?
                const capabilityId = entity.instance.attributes['device_class']
                  ? HomeAssistantConstants.ENTITY_SENSOR_CAPABILITY_MAP[entity.instance.attributes['device_class']]
                  : null;

                if (capabilityId) {
                  homeyDevice.capabilities.push(capabilityId);
                  homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                  homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                } else {
                  const entityIdWithoutSensor = entityId.substring('sensor.'.length);
                  const capabilityType = entity.instance.attributes['unit_of_measurement']
                    ? 'number'
                    : 'string';
                  const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;
                  homeyDevice.capabilities.push(capabilityId);
                  homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                  homeyDevice.capabilitiesOptions[capabilityId].title = entity.instance.attributes['friendly_name'] || entity.instance.attributes['device_class'] || entityIdWithoutSensor;
                  homeyDevice.capabilitiesOptions[capabilityId].units = entity.instance.attributes['unit_of_measurement'] || null;
                  homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                }
              }
            }

            // Is this entity a Binary Sensor?
            // https://developers.home-assistant.io/docs/core/entity/binary-sensor
            if (entityId.startsWith('binary_sensor.')) {
              homeyDevice.class = homeyDevice.class || 'sensor';

              this.log('_Device_class', entity.instance.attributes['device_class']);

              if (entity.instance.attributes) {
                // Is this Home Assistant Entity a known Homey Capability?
                const capabilityId = entity.instance.attributes['device_class']
                  ? HomeAssistantConstants.ENTITY_ALARM_CAPABILITY_MAP[entity.instance.attributes['device_class']]
                  : null;

                if (capabilityId) {
                  homeyDevice.capabilities.push(capabilityId);
                  homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                  homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                } else {
                  const entityIdWithoutSensor = entityId.substring('binary_sensor.'.length);
                  const capabilityType = 'string';
                  const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;
                  homeyDevice.capabilities.push(capabilityId);
                  homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
                  homeyDevice.capabilitiesOptions[capabilityId].title = entity.instance.attributes['friendly_name'] || entity.instance.attributes['device_class'] || entityIdWithoutSensor;
                  homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
                }
              }
            }
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
        });
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

    socket.setHandler('test_server', async ({
      host,
      port,
      protocol,
    }) => {
      const url = (protocol === 'http')
        ? `http://${host}:${port}`
        : `https://${host}:${port}`;
      const res = await fetch(url);
      const body = await res.text();
      if (!body.includes('Home Assistant')) {
        throw new Error('Server responded, but does not seem to be a Home Assistant server?');
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
