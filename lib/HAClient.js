'use strict';

const Hass = require('home-assistant-js-websocket');
const webSocket = require('ws');

global.WebSocket = webSocket;

module.exports = class HAClient {

  constructor({
    address,
    port = 8123,
    token,
  }) {
    this.address = address;
    this.port = port;
    this.token = token;

    this.connection = null;
    this.entities = null;
  }

  async getConnection() {
    if (!this.address) {
      throw new Error('Missing Address');
    }

    if (!this.port) {
      throw new Error('Missing Port');
    }

    if (!this.token) {
      throw new Error('Missing Token');
    }

    if (!this.connection) {
      this.connection = Promise.resolve().then(async () => {
        const auth = new Hass.Auth({
          hassUrl: this.address,
          access_token: this.token,
          expires: new Date(new Date().getTime() + 1e11),
        });
        return Hass.createConnection({ auth });
      });
    }

    return this.connection;
  }

  async getEntities() {
    if (!this.entities) {
      this.entities = Promise.resolve().then(async () => {
        const connection = await this.getConnection();

        // TODO: timeout
        return new Promise((resolve, reject) => {
          Hass.subscribeEntities(connection, entities => {
            this.entities = entities;
            resolve(entities);
          });
        });

      });
    }

    return this.entities;

  }

}