'use strict';

const Homey = require('homey');
const Hass = require('home-assistant-js-websocket');
const ws = require('ws');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Bind modules to global scope for `home-assistant-js-websocket` package.
global.WebSocket = ws;
global.fetch = fetch;
global.FormData = FormData;

module.exports = class HomeAssistantServer extends Homey.SimpleClass {

  constructor({
    homey,
    token,
    protocol,
    host,
    port = 8123,
    name = 'Home Assistant',
  }) {
    super();

    this.homey = homey;
    this.token = token;
    this.protocol = protocol;
    this.name = name;
    this.host = host;
    this.port = port;

    if (!this.protocol) {
      throw new Error('Missing Protocol');
    }

    if (!this.host) {
      throw new Error('Missing Host');
    }

    if (!this.port) {
      throw new Error('Missing Port');
    }

    if (!this.token) {
      throw new Error('Missing Token');
    }

    this.connection = null;
    this.entities = null;
  }

  async init() {
    await this.getConnection();
  }

  async getConnection() {
    if (!this.connection) {
      this.connection = Promise.resolve().then(async () => {
        // Create Auth
        const auth = new Hass.Auth({
          hassUrl: `${this.protocol}://${this.host}:${this.port}`,
          access_token: this.token,
          expires: new Date(new Date().getTime() + 1e11),
        });

        // Create Connection
        const connection = await Hass.createConnection({ auth });
        this.log('Connected');

        // Subscribe to events
        await connection.subscribeEvents(this.onEventStateChanged, 'state_changed');
        this._states = await connection.sendMessagePromise({ type: 'get_states' });

        // Subscribe to entities
        // await connection.subscribeEntities(console.log);

        return connection;
      });
    }
    return this.connection;
  }

  onEventStateChanged = event => {
    const { data } = event;
    this.emit('state_changed', data);

    if (typeof data.entity_id === 'string') {
      this.emit(`state_changed_entity:${data.entity_id}`, data.new_state);
    }
  }

  async getEntities() {
    if (!this.entities) {
      this.entities = Promise.resolve().then(async () => {
        const connection = await this.getConnection();
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

  async getEntityState({ entityId }) {
    if (!this._states) {
      await this.getConnection();
    }

    const entityState = this._states.find(state => state.entity_id === entityId);
    if (!entityState) {
      throw new Error(`Invalid Entity State: ${entityId}`);
    }

    return entityState;
  }

  // async updateLight(on, deviceClass, data) {
  //   const connection = await this.getConnection(); //domain "switch"
  //   if (connection) {
  //     if (deviceClass == 'socket') {
  //       Hass.callService(connection, "switch", on ? "turn_on" : "turn_off", data)
  //         .catch((error) => {
  //           console.log("error: ", error);
  //         });
  //     } else {
  //       Hass.callService(connection, "light", on ? "turn_on" : "turn_off", data)
  //         .catch((error) => {
  //           console.log("error:", error);
  //         });
  //     }

  //   }
  // }
  // async pausePlay(on, capability, data) {
  //   const connection = await this.getConnection();
  //   if (connection) {
  //     if (capability == "speaker_playing") {
  //       Hass.callService(connection, "media_player", on ? "media_play" : "media_pause", data)
  //         .catch((error) => {
  //           console.log("Error: ", error);
  //         });
  //     } else if (capability == "volume_set") {
  //       Hass.callService(connection, "media_player", "volume_set", data)
  //         .catch((error) => {
  //           console.log("Error: ", error);
  //         });
  //     }
  //   }
  // }

};
