'use strict';

const fetch = require('node-fetch');
const Hass = require('home-assistant-js-websocket');

const Homey = require('homey');
const HomeAssistantUtil = require('./HomeAssistantUtil');

module.exports = class HomeAssistantDriver extends Homey.Driver {

  async onPair(socket) {
    const servers = {
      new: null,
    };

    let currentViewId = 'list_servers';
    let currentServer = null;
    let currentServerId = null;

    const onViewSelectServerLoading = async () => {
      if (currentServerId === 'new') {
        return socket.showView('configure_server');
      }
    };

    const onViewConfigureServer = async () => {
      // ...
    };

    const onViewAuthenticateServer = async () => {
      const server = servers[currentServerId];
      if (!server) {
        throw new Error(`Invalid Server: ${currentServerId}`);
      }

      const homeyId = await this.homey.cloud.getHomeyId();
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
              client_name: `Homey (${homeyId})`,
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
            currentServer = await this.homey.app.createServer({
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
          name: server.name,
          data: {
            id: serverId,
          },
        })),

        // TODO: Found servers

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
      // const deviceRegistry = await connection.sendMessagePromise({ type: "config/device_registry/list" });
      // const entityRegistry = await connection.sendMessagePromise({ type: "config/entity_registry/list" });
      // const entities = await client.getEntities();
      // TODO
      return [];
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

      if (currentViewId === 'list_server_devices') {
        return onListServerDevices();
      }
    });

    socket.setHandler('list_servers_selection', async server => {
      currentServerId = server[0].data.id;

      if (currentServerId !== 'new') {
        currentServer = await this.homey.app.getServer(currentServerId);
      }
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
  //   return deviceRegistry
  //     .map(device => {
  //       return {
  //         entities: entityRegistry.filter(entity => {
  //           return entity.device_id === device.id;
  //         }),
  //         ...device,
  //       };
  //     })
  //     .filter(device => {
  //       if (device.entities.length === 0) return false;
  //       // TODO
  //       return true;
  //     })
  //     .map(device => {
  //       let deviceEntities = [];
  //       const deviceStore = {};
  //       device.entities.forEach(({ entity_id: entityId }) => {
  //         console.log("Entity ID: ", entityId);
  //         const entity = entities[entityId];
  //         if (!entity) return;
  //         // if capability length != 1 -> getcapabilityfromentity
  //         const capabilityId = HomeAssistantUtil.getCapabilityFromEntity(entity);
  //         console.log("Capability: ", capabilityId);
  //         if (!capabilityId) return;
  //         // the light is 1 device with mutiple entities, already making capabilityId an entire array. when you want to push the capabilityId in deviceCapabilities, you get an array inside of an array
  //         // something is wrong here it executes the devicestore stuff as many times as that there are entities connected to said device -- ? possible issue, keep tracking it
  //         deviceEntities = deviceEntities.concat(capabilityId);
  //         deviceStore.deviceEntities = deviceStore.deviceEntities || {};
  //         deviceStore.deviceEntities[entityId] = { capabilityId };
  //       });
  //       const deviceClass = HomeAssistantUtil.getClassFromCapabilities(deviceEntities);
  //       const deviceIcon = `/icons/${deviceClass}.svg`;
  //       // TODO: deviceClass like blinds, windows, sensors etc.
  //       console.log("stored:", deviceStore);
  //       console.log("data: ", device.id);
  //       console.log("Name of device: ", device.name);
  //       //console.log("Device: ", device);
  //       return {
  //         class: deviceClass,
  //         capabilities: deviceEntities,
  //         store: deviceStore,
  //         name: device.name,
  //         icon: deviceIcon,
  //         data: {
  //           id: device.id,
  //         },
  //       }
  //     })
  //     // the below filter is the issue, when the code doesnt recognize any capabilities (what i had with the light) it wont show it in onPairlistDevices
  //     .filter(device => {
  //       if (device.capabilities.length === 0) return false;
  //       return true;
  //     })
  // }

};
