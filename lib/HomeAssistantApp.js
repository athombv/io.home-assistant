'use strict';

const Homey = require('homey');
const HomeAssistantUtil = require('./HomeAssistantUtil');
const HomeAssistantServer = require('./HomeAssistantServer');

module.exports = class HomeAssistantApp extends Homey.App {

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
      if (serverConfig.port === '') {
        if (serverConfig.protocol === 'http') {
          serverConfig.port = '80';
        }

        if (serverConfig.protocol === 'https') {
          serverConfig.port = '443';
        }

        // Save the fixed server config
        await this.homey.settings.set('servers', serverConfigs);
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

      this.__servers[serverId] = new HomeAssistantServer({
        protocol: serverConfig.protocol,
        host: serverConfig.host,
        port: serverConfig.port,
        name: serverConfig.name,
        token: serverConfig.token,
        homey: this.homey,
      });
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

    const serverId = HomeAssistantUtil.uuid();
    const serverConfigs = await this.homey.settings.get('servers') || {};
    serverConfigs[serverId] = {
      protocol,
      host,
      port,
      name,
      token,
    };
    await this.homey.settings.set('servers', serverConfigs);
    return serverId;
  }

};
