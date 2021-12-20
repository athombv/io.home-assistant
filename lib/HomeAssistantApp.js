'use strict';

const Homey = require('homey');
const HomeAssistantUtil = require('./HomeAssistantUtil');
const HomeAssistantServer = require('./HomeAssistantServer');

module.exports = class HomeAssistantApp extends Homey.App {

  __servers = {};

  async getServers() {
    return this.__servers;
  }

  async getServer(serverId) {
    if (!this.__servers[serverId]) {
      const serverConfigs = await this.homey.settings.get('servers') || {};
      const serverConfig = serverConfigs[serverId];
      if (!serverConfig) {
        throw new Error(`Invalid Server: ${serverId}`);
      }

      return this.__initServer(serverId, serverConfig);
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
    return this.__initServer(serverId, serverConfigs[serverId]);
  }

  __initServer(serverId, {
    protocol,
    host,
    port,
    name,
    token,
  }) {
    this.__servers[serverId] = new HomeAssistantServer({
      protocol,
      host,
      port,
      name,
      token,
    });
    return this.__servers[serverId];
  }

};
