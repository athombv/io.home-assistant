import Homey from 'homey';
import { v4 } from 'uuid';
import HomeAssistantServer from './HomeAssistantServer.mjs';

type HomeyHomeAssistantServerConfig = {
  name: string;
  host: string;
  port: string;
  protocol: string;
  token: string;
};

export default class HomeAssistantApp extends Homey.App {
  private __servers: Record<string, HomeAssistantServer> = {};

  async onInit(): Promise<void> {
    this.__servers = {};

    // Initialize all servers
    const serverConfigs = await this.getServerConfigs();
    for (const [serverId, serverConfig] of Object.entries(serverConfigs)) {
      // Migration:
      // Some configs have an empty port.
      // During test_server, this wasn't validated because `https://<ip>:` seems to work...
      // Based on the protocol, we fallback to the default port for http/https.
      if (serverConfig.port === '') {
        if (serverConfig.protocol === 'http') {
          serverConfig.port = '80';
        }

        if (serverConfig.protocol === 'https') {
          serverConfig.port = '443';
        }

        // Save the fixed server config
        this.homey.settings.set('servers', serverConfigs);
      }

      await this.getServer(serverId).catch(this.error);
    }
  }

  async getServers(): Promise<Record<string, HomeAssistantServer>> {
    return this.__servers;
  }

  async getServer(serverId: string): Promise<HomeAssistantServer> {
    if (!this.__servers[serverId]) {
      const serverConfigs = await this.getServerConfigs();
      const serverConfig = serverConfigs[serverId];
      if (!serverConfig) {
        throw new Error(`Invalid Server ID: ${serverId}`);
      }

      this.__servers[serverId] = new HomeAssistantServer(
        serverConfig.name,
        serverConfig.protocol,
        serverConfig.host,
        serverConfig.port,
        serverConfig.token,
      );
      this.__servers[serverId].on('__log', (...props) => this.log(`[HomeAssistantServer:${serverId}]`, ...props));
      this.__servers[serverId].on('__error', (...props) => this.error(`[HomeAssistantServer:${serverId}]`, ...props));
    }

    return this.__servers[serverId];
  }

  async createServer(name: unknown, host: unknown, port: unknown, protocol: unknown, token: unknown): Promise<string> {
    if (typeof protocol !== 'string') {
      throw new Error('Invalid Protocol');
    }

    if (!['http', 'https'].includes(protocol)) {
      throw new Error('Invalid Protocol');
    }

    if (typeof host !== 'string') {
      throw new Error('Invalid Host');
    }

    if (typeof port !== 'string') {
      throw new Error('Invalid Port');
    }

    if (typeof name !== 'string') {
      throw new Error('Invalid Name');
    }

    if (typeof token !== 'string') {
      throw new Error('Invalid Token');
    }

    // todo: use home assistant instance id
    const serverId = v4();
    const serverConfigs = await this.getServerConfigs();
    serverConfigs[serverId] = {
      protocol,
      host,
      port,
      name,
      token,
    };
    this.homey.settings.set('servers', serverConfigs);
    return serverId;
  }

  private async getServerConfigs(): Promise<Record<string, HomeyHomeAssistantServerConfig>> {
    return (await this.homey.settings.get('servers')) || {};
  }
}
