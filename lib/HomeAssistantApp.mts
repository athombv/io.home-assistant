// @ts-nocheck

import Homey from 'homey';
import { v4 } from 'uuid';
import HomeAssistantServer from './HomeAssistantServer.mjs';

export default class HomeAssistantApp extends Homey.App {
  private __servers;

  async onInit() {
    this.__servers = {
      // [serverId]: HomeAssistantServer
    };

    // Initialize all servers
    const serverConfigs = await this.homey.settings.get('servers') || {};
    for (const [serverId, serverConfig] of Object.entries(serverConfigs)) {
      // Migration:
      // Some configs have an empty port.
      // During test_server, this wasn't validated because `https://<ip>:` seems to work...
      // Based on the protocol, we fallback to the default port for http/https.
      if ((serverConfig as any).port === '') {
        if ((serverConfig as any).protocol === 'http') {
          (serverConfig as any).port = '80';
        }

        if ((serverConfig as any).protocol === 'https') {
          (serverConfig as any).port = '443';
        }

        // Save the fixed server config
        this.homey.settings.set('servers', serverConfigs);
      }

      await this.getServer(serverId).catch(this.error);
    }
  }

  async getServers() {
    return this.__servers;
  }

  async getServer(serverId) {
    if (!this.__servers[serverId]) {
      const serverConfigs = await this.homey.settings.get('servers') || {};
      const serverConfig = serverConfigs[serverId];
      if (!serverConfig) {
        throw new Error(`Invalid Server ID: ${serverId}`);
      }

      this.__servers[serverId] = new HomeAssistantServer(
        serverConfig.protocol,
        serverConfig.host,
        serverConfig.port,
        serverConfig.name,
        serverConfig.token,
        this.homey,
      );
      this.__servers[serverId].on('__log', (...props) => this.log(`[HomeAssistantServer:${serverId}]`, ...props));
      this.__servers[serverId].on('__error', (...props) => this.error(`[HomeAssistantServer:${serverId}]`, ...props));
    }

    return this.__servers[serverId];
  }

  async createServer({
    protocol,
    host,
    port,
    name,
    token,
  }) {
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
    const serverConfigs = await this.homey.settings.get('servers') || {};
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

}
