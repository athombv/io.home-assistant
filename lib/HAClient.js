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
      //return this;
      //return this; if i dont do a return this, then a this.entities in device.js stays undefined
    }
    console.log("entities already given");
    //this.emit('listedEntities', this.entities);
    return this.entities; // if there already are entities just return this.entities
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
}

// this.getStore() --> 'onoff', 'dim', 'light_temperature' : { entityid: 'light.ikea_light_e14' } -> capabilities[]
// this.getStore() --> 'measure_temperature' : {entity_id: 'lumi.weather_measure_temperature' } -> capabilities

// this.getStore() ==> (store:) {
//   capabilities: {
//     'onoff,dim,light_temperature,light_hue,light_saturation': { entityId: 'light.ikea_of_sweden_tradfri_bulb_e14_cws_470lm' }
//   };

/* TO DO
Make each capability connected to the entityId
like  'onoff' : { entityId: 'light.ikea_of_sweden_tradfri_bulb_e14_cws_470lm' }
      'dim': {entityId: 'light.ikea_of_sweden_tradfri_bulb_e14_cws_470lm'}
of:
entities: {
  'light.ikea_of_sweden_tradfri_bulb_e14_cws_470lm': {
    capabilities: [
    'onoff',
    'dim',
    'light_temperature'
  ]
} --> capabilities[0], capabilities[1], capabilities[2]
  'sensor.lumi_weather_humidity' : {
    capabilities: [
      'measure_humidity'
    ]
  }
}


*/
