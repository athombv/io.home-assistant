import { createConnection, getAuth, type HassConfig } from 'home-assistant-js-websocket';
import type { DiscoveryResultMDNSSD } from 'homey';
import Homey from 'homey';
import HaDeviceEntityMapper from './HomeAssistant/HaDeviceEntityMapper.mjs';
import type HomeAssistantApp from './HomeAssistantApp.mjs';
import type HomeAssistantDevice from './HomeAssistantDevice.mjs';
import type {
  HomeAssistantDeviceRegistry,
  HomeAssistantEntityRegistry,
  HomeyHomeAssistantDeviceOption,
  HomeyHomeyAssistantPairingServer,
  ProcessedHomeAssistantDevice,
} from './HomeAssistantTypes.mjs';
import { getFormattedDate } from './HomeAssistantUtil.mjs';

function getMDNSHassUrl(server: DiscoveryResultMDNSSD): string {
  return `http://${server.address}:${server.port}`;
}

type FlowDeviceArgs = {
  device: HomeAssistantDevice;
};

export default class HomeAssistantDriver extends Homey.Driver {
  public async onInit(): Promise<void> {
    await super.onInit();

    // Init Action Cards
    this.homey.flow
      .getActionCard('fan_speed_set')
      .registerRunListener(async (args: FlowDeviceArgs & { fan_speed: number }) => {
        return args.device.triggerCapabilityListener('fan_speed', args.fan_speed);
      });

    this.homey.flow
      .getActionCard('fan_mode_set')
      .registerRunListener(async (args: FlowDeviceArgs & { fan_mode: string }) => {
        return args.device.triggerCapabilityListener('fan_mode', args.fan_mode);
      });

    this.homey.flow
      .getActionCard('aircleaner_mode_set')
      .registerRunListener(async (args: FlowDeviceArgs & { aircleaner_mode: string }) => {
        return args.device.triggerCapabilityListener('aircleaner_mode', args.aircleaner_mode);
      });

    this.homey.flow
      .getConditionCard('action_is')
      .registerRunListener(async (args: FlowDeviceArgs & { action: string }) => {
        return args.device.isValueRunListener(args.action, 'action');
      });

    this.homey.flow
      .getConditionCard('status_is')
      .registerRunListener(async (args: FlowDeviceArgs & { status: string }) => {
        return args.device.isValueRunListener(args.status, 'status');
      });

    this.homey.flow.getConditionCard('alarm_charging_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_charging');
    });

    this.homey.flow.getConditionCard('alarm_occupancy_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_occupancy');
    });

    this.homey.flow.getConditionCard('alarm_plugged_in_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_plugged_in');
    });

    this.homey.flow.getConditionCard('alarm_problem_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_problem');
    });

    this.homey.flow.getConditionCard('alarm_running_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_running');
    });

    this.homey.flow.getConditionCard('alarm_safety_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_safety');
    });

    this.homey.flow.getConditionCard('alarm_sound_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_sound');
    });

    this.homey.flow.getConditionCard('alarm_vibration_is').registerRunListener(async (args: FlowDeviceArgs) => {
      return args.device.isOnRunListener('alarm_vibration');
    });
  }

  public onDiscoveryResults = (): Record<string, DiscoveryResultMDNSSD> => {
    const discoveryStrategy = this.homey.discovery.getStrategy('home-assistant');
    return discoveryStrategy.getDiscoveryResults() as Record<string, DiscoveryResultMDNSSD>;
  };

  public async onPair(socket: Homey.Driver.PairSession): Promise<void> {
    const servers: Record<string, HomeyHomeyAssistantPairingServer | null> = {
      new: null,
    };

    let currentViewId = 'list_servers';
    let currentServerId: string | null = null;

    const onViewSelectServerLoading = async (): Promise<void> => {
      if (currentServerId === 'new') {
        return socket.showView('configure_server');
      }

      if (currentServerId?.startsWith('mdns:')) {
        currentServerId = currentServerId.replace('mdns:', '');
        const discoveryResults = this.onDiscoveryResults();
        const server = discoveryResults[currentServerId];

        servers[currentServerId] = {
          protocol: 'http',
          host: server.address,
          port: String(server.port), // Later a typecheck on string is done...
          name: server.name,
        };

        return socket.showView('authenticate_server');
      }

      return socket.showView('list_server_devices');
    };

    const onViewConfigureServer = async (): Promise<void> => {
      // ...
    };

    const onViewAuthenticateServer = async (): Promise<void> => {
      if (!currentServerId) {
        return;
      }

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
          Promise.resolve()
            .then(async () => {
              // Swap authCode for a Regular Access Token
              const hassAuth = await getAuth({
                hassUrl,
                clientId,
                authCode,
              });

              // Create WebSocket Connection
              const hassConnection = await createConnection({
                auth: hassAuth,
              });

              // Create a Long-Lived Access Token
              const hassConnectionLongLivedAccessToken = await hassConnection.sendMessagePromise({
                type: 'auth/long_lived_access_token',
                client_name: `Homey (Created at ${getFormattedDate()})`,
                client_icon: 'https://etc.athom.com/logo/transparent/256.png',
                lifespan: 3650,
              });

              // Close WebSocket Connection
              hassConnection.close();

              // Revoke Regular Access Token
              await hassAuth.revoke();

              // Fetch server config
              const config: HassConfig = await Promise.resolve().then(async () => {
                const res = await fetch(`${hassUrl}/api/config`, {
                  headers: {
                    Authorization: `Bearer ${hassConnectionLongLivedAccessToken}`,
                  },
                });
                return (await res.json()) as HassConfig;
              });

              // Create & Save Server
              currentServerId = await (this.homey.app as HomeAssistantApp).createServer(
                config.location_name,
                server.host,
                server.port,
                server.protocol,
                hassConnectionLongLivedAccessToken,
              );
            })
            .then(() => socket.emit('authorized', true))
            .catch(err => {
              this.error(err);
              socket.emit('error', err.message || err.toString());
            });
        });
    };

    const onListServers = async (): Promise<Array<{ name: string; data: { id: string } }>> => {
      const servers = await (this.homey.app as HomeAssistantApp).getServers();
      const discoveryResults = this.onDiscoveryResults();

      const serverPaths = Object.values(servers).map(server => server.hassUrl);

      return [
        // Existing Servers
        ...Object.entries(servers).map(([serverId, server]) => ({
          name: `${server.name} (${server.hassUrl})`,
          data: {
            id: serverId,
          },
        })),

        // mDNS Servers
        ...Object.values(discoveryResults)
          // You would expect that this filter can be done based on server id of the stored servers, but that is a random
          // v4 uuid that doesn't match the Home assistant one...
          .filter(server => !serverPaths.includes(`http://${server.address}:${server.port}`))
          .map(server => {
            return {
              name: `${server.name} (${getMDNSHassUrl(server)})`,
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

    const onListServerDevices = async (): Promise<HomeyHomeAssistantDeviceOption[]> => {
      if (!currentServerId) {
        throw new Error('Current server identifier not available');
      }
      const listServerId = currentServerId;

      const server = await (this.homey.app as HomeAssistantApp).getServer(listServerId);
      const connection = await server.getConnection();
      const deviceRegistry = (await connection.sendMessagePromise({
        type: 'config/device_registry/list',
      })) as HomeAssistantDeviceRegistry;
      const entityRegistry = (await connection.sendMessagePromise({
        type: 'config/entity_registry/list',
      })) as HomeAssistantEntityRegistry;
      const entities = await server.getEntities();

      // this.log('deviceRegistry', JSON.stringify(deviceRegistry));
      // this.log('entityRegistry', JSON.stringify(entityRegistry));
      // this.log('entities', JSON.stringify(entities));

      return (
        deviceRegistry
          // Add device.entities
          .map((device): ProcessedHomeAssistantDevice => {
            return {
              entities: entityRegistry
                .filter(entity => entity.device_id === device.id)
                .map(entity => ({
                  instance: entities[entity.entity_id],
                  ...entity,
                })),
              ...device,
            };
          })

          // Filter devices without entities
          .filter(device => !(!device.entities || device.entities.length === 0))

          // Map Home Assistant device to Homey Device
          .map(homeAssistantDevice => {
            // this.log(JSON.stringify(homeAssistantDevice, false, 2));

            const homeyDevice: HomeyHomeAssistantDeviceOption = {
              name:
                typeof homeAssistantDevice.name_by_user === 'string'
                  ? homeAssistantDevice.name_by_user
                  : homeAssistantDevice.name,
              data: {
                deviceId: homeAssistantDevice.id,
                serverId: listServerId,
              },
              store: {
                manufacturer: homeAssistantDevice.manufacturer ?? null,
                model: homeAssistantDevice.model ?? null,
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

            // Map HA entities to the Homey device
            HaDeviceEntityMapper.map(homeAssistantDevice, homeyDevice);

            return homeyDevice;
          })

          // Filter devices
          .filter(homeyDevice => {
            // Filter devices without capabilities
            if (!homeyDevice.capabilities.length) {
              return false;
            }

            // Filter devices without name
            return !!homeyDevice.name;
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
      const url = protocol === 'http' ? `http://${host}:${port}` : `https://${host}:${port}`;
      const res = await fetch(url);
      const body = await res.text();

      if (!body.includes('Home Assistant')) {
        throw new Error('Server responded, but does not seem to be a Home Assistant server?');
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

      if (!currentServerId) {
        throw new Error('Server ID not set');
      }

      servers[currentServerId] = {
        protocol,
        host,
        port,
        name: 'Home Assistant',
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
}
