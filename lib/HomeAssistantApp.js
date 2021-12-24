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
    for (const serverId of Object.keys(serverConfigs)) {
      await this.getServer(serverId);
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
