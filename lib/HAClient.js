'use strict';

const Hass = require('home-assistant-js-websocket');
const EventEmitter = require('events');
const webSocket = require('ws');

global.WebSocket = webSocket;
module.exports = class HAClient extends EventEmitter {

  constructor({
    address,
    port = 8123,
    token,
  }) {
    super();
    this.onEventStateChanged = this.onEventStateChanged.bind(this);

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

  async updateLight(on, data) {
    const connection = await this.getConnection();
    if (connection) {
      Hass.callService(connection, "light", on ? "turn_on" : "turn_off", data)
        .catch((error) => {
          console.log("error: ", error);
        });
    }
  }
  async pausePlay(on, entity, data) {
    const connection = await this.getConnection();
    if (connection) {
      if (entity == "speaker_playing") {
        Hass.callService(connection, "media_player", on ? "media_play" : "media_pause", data)
          .catch((error) => {
            console.log("Error: ", error);
          });
      } else if (entity == "volume_set") {
        Hass.callService(connection, "media_player", "volume_set", data)
          .catch((error) => {
            console.log("Error: ", error);
          });
      }
    }
  }
}
