'use strict';

const { EventEmitter } = require('events');

const Hass = require('home-assistant-js-websocket');
const ws = require('ws');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Bind modules to global scope for `home-assistant-js-websocket` package.
global.WebSocket = ws;
global.fetch = fetch;
global.FormData = FormData;

module.exports = class HomeAssistantServer extends EventEmitter {

  constructor({
    protocol,
    host,
    port = 8123,
    name,
    token,
  }) {
    super();
    this.onEventStateChanged = this.onEventStateChanged.bind(this);

    this.protocol = protocol;
    this.name = name;
    this.host = host;
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
        const connection = await Hass.createConnection({ auth });
        console.log(connection);
        await connection.subscribeEvents(this.onEventStateChanged, "state_changed");
        return connection;
      });
    }
    return this.connection;
  }

  onEventStateChanged(event) {
    const { data } = event;
    this.emit('state_changed', data);
  }

  async getEntities() {
    if (!this.entities) { // gets list of entities 
      this.entities = Promise.resolve().then(async () => {
        const connection = await this.getConnection();
        // TODO: timeout
        return new Promise((resolve, reject) => {
          Hass.subscribeEntities(connection, entities => {
            this.entities = entities;
            //console.log(this.entities);
            resolve(entities);
          });
        });
      });
    }
    console.log("entities already given");
    return this.entities;
  }

  async updateLight(on, deviceClass, data) {
    const connection = await this.getConnection(); //domain "switch"
    if (connection) {
      if (deviceClass == 'socket') {
        Hass.callService(connection, "switch", on ? "turn_on" : "turn_off", data)
          .catch((error) => {
            console.log("error: ", error);
          });
      } else {
        Hass.callService(connection, "light", on ? "turn_on" : "turn_off", data)
          .catch((error) => {
            console.log("error:", error);
          });
      }

    }
  }
  async pausePlay(on, capability, data) {
    const connection = await this.getConnection();
    if (connection) {
      if (capability == "speaker_playing") {
        Hass.callService(connection, "media_player", on ? "media_play" : "media_pause", data)
          .catch((error) => {
            console.log("Error: ", error);
          });
      } else if (capability == "volume_set") {
        Hass.callService(connection, "media_player", "volume_set", data)
          .catch((error) => {
            console.log("Error: ", error);
          });
      }
    }
  }
}
