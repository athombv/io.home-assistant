"use strict";

const WebSocket = require("ws");
global.WebSocket = WebSocket;

const Hass = require("home-assistant-js-websocket");
const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

const sensorIcons = {
  measure_battery: 'measure_battery',
  measure_humidity: 'measure_humidity',
  measure_luminance: 'measure_luminance',
  measure_temperature: 'measure_temperature',
  measure_power: 'measure_power',
  measure_co2: 'co2',
  measure_noise: 'noise',
  meter_power: 'meter_power',
  alarm_contact: 'alarm_contact',
  alarm_heat: 'alarm_heat',
  alarm_motion: 'alarm_motion',
  alarm_pressure: 'alarm_pressure',
  alarm_smoke: 'alarm_smoke',
  alarm_tamper: 'alarm_tamper',
  alarm_water: 'alarm_water',
  alarm_generic: 'alarm_generic',
};

class Client {

  constructor(address, token) {
    this._entities = [];
    this._lights = [];
    this._scenes = [];
    this._scripts = [];
    this._switches = [];
    this._sensors = [];
    this._binary_sensors = [];
    this._compounds = [];
    this._automation = [];

    this._devices = {};
    this._connection = null;

    this.connect(address, token);
  }

  connect(address, token, notify) {
    console.log('connecting to home-assistant');
    this._haConnect = false;

    if (this._connection != null) {
      this._connection.close();
      console.log('?');
    }

    // clear any previously discovered devices
    this._lights = [];
    this._scenes = [];
    this._scripts = [];
    this._switches = [];
    this._sensors = [];
    this._compounds = [];
    this._binary_sensors = [];

    if (address && address !== '' && token && token !== '') { // != en !=
      const auth = new Hass.Auth({
        hassUrl: address,
        access_token: token,
        expires: new Date(new Date().getTime() + 1e11),
      });

      Hass.createConnection({ auth })
        .then(conn => {
          console.log('succesfully connected... subscribing to entities and events');
          if (notify) {
            this.emit('connection_update', { connected: true });
          }
          this._connection = conn;
          Hass.subscribeEntities(conn, this._onEntitiesUpdate.bind(this)); // this is the key function
          conn.subscribeEvents(this._onStateChanged.bind(this),
            'state_changed');
        })
        .catch(err => {
          this._connection = null;
          this.emit('connection_update', { connected: false });
          console.log('failed to connect:', err);
        });
    }
  }

  _onStateChanged(event) {
    try {
      const deviceIds = Object.keys(this._devices);
      const { data } = event;
      if (data) {
        const entityId = data.entity_id;
        console.log(`entity id: ${data.entity_id}`);
        deviceIds.forEach(deviceId => {
          const device = this._devices[deviceId];
          if (device != null) {
            if (deviceId === entityId) { // ==
              device.onEntityUpdate(data.new_state);
            }
          }
        });
      }
    } catch (e) {
      console.error(new Error('onStateChanged error'));
    }
  }

  _onEntitiesUpdate(entities) {
    if (this._entities.length !== entities.length) { // !==
      console.log('update entities');

      const lights = []; // call function _onEntitiesUpdate->Lights(entities)
      const scenes = [];
      const scripts = [];
      const switches = [];
      const sensors = [];
      const binarySensors = [];
      const compounds = [];
      const automation = [];

      Object.keys(entities).forEach(id => {
        // binary / boolean sensors
        if (id.startsWith('binary_sensor.')) {
          const entity = entities[id];
          const entityName = entity.attributes['friendly_name'] || id;
          const deviceClass = entity.attributes['device_class'];

          let sensorCapability = null;

          switch (deviceClass) {
            case 'battery':
              sensorCapability = 'alarm_battery';
              break;
            case 'gas':
              sensorCapability = 'alarm_co';
              break;
            case 'opening':
              sensorCapability = 'alarm_contact';
              break;
            case 'door':
              sensorCapability = 'alarm_contact';
              break;
            case 'garage_door':
              sensorCapability = 'alarm_contact';
              break;
            case 'window':
              sensorCapability = 'alarm_contact';
              break;
            case 'fire':
              sensorCapability = 'alarm_fire';
              break;
            case 'heat':
              sensorCapability = 'alarm_heat';
              break;
            case 'motion':
              sensorCapability = 'alarm_motion';
              break;
            case 'smoke':
              sensorCapability = 'alarm_smoke';
              break;
            case 'moisture':
              sensorCapability = 'alarm_water';
              break;
            default:
              sensorCapability = 'alarm_generic';
              break;
          }

          const binarySensor = {
            name: entityName,
            data: {
              id,
            },
            capabilities: [sensorCapability],
          };

          if (typeof sensorIcons[sensorCapability] === 'string') {
            binarySensor.icon = `/icons/${sensorIcons[sensorCapability]}.svg`;
          }

          binarySensors.push(binarySensor);
        }

        // sensors
        if (id.startsWith('sensor.')) {
          const entity = entities[id];
          const entityName = entity.attributes['friendly_name'] || id;
          const deviceClass = entity.attributes['device_class'];

          let sensorCapability = null;

          switch (deviceClass) {
            case 'battery':
              sensorCapability = 'measure_battery';
              break;
            case 'humidity':
              sensorCapability = 'measure_humidity';
              break;
            case 'illuminance':
              sensorCapability = 'measure_luminance';
              break;
            case 'temperature':
              sensorCapability = 'measure_temperature';
              break;
            case 'pressure':
              sensorCapability = 'measure_pressure';
              break;
            default:
              const unitOfMeasurement = entity.attributes['unit_of_measurement'];
              switch (unitOfMeasurement) {
                case 'kWh':
                  sensorCapability = 'meter_power';
                  break;
                case 'A':
                  sensorCapability = 'measure_current';
                  break;
                case 'W':
                  sensorCapability = 'measure_power';
                  break;
                case 'V':
                  sensorCapability = 'measure_voltage';
                  break;
                case 'ppm':
                  sensorCapability = 'measure_co2';
                  break;
                case 'dB':
                  sensorCapability = 'measure_noise';
                  break;
                default: {
                  if (!Number.isNaN(parseFloat(entity.state))) {
                    sensorCapability = 'measure_numeric';
                  } else {
                    sensorCapability = 'measure_generic';
                  }
                  break;
                }
              }
          }      
            sensors.push({
              name: entityName,
              data: {
                id,
              },
              capabilities: sensorCapability,
            });

          if (typeof sensorIcons[sensorCapability] === 'string') {
            sensors.icon = `/icons/${sensorIcons[sensorCapability]}.svg`;
          }
        }
        // automation
        if (id.startsWith('automation.')) {
          const entity = entities[id];
          const entityName = entity.attributes['friendly_name'] || id;

          automation.push({
            name: entityName,
            data: {
              id,
            },
          });
        }

        // lights
        if (id.startsWith('light.')) {
          const entity = entities[id];
          const entityName = entity.attributes['friendly_name'] || id;
          const lightCapabilities = ['onoff']; // const lightCapabilities = entity.states;

          const features = entity.attributes['supported_features'] || 0;

          if ((features & 1) === 1) lightCapabilities.push('dim');
          if ((features & 2) === 2) lightCapabilities.push('light_temperature');
          if ((features & 16) === 16) lightCapabilities.push('light_hue', 'light_saturation');

          if (
            lightCapabilities.includes('light_temperature') && lightCapabilities.includes('light_hue')) {
            lightCapabilities.push('light_mode');
          }

          lights.push({
            name: entityName,
            data: {
              id,
            },
            capabilities: lightCapabilities,
          });
        }
      });

      const update = this._entities.length === 0;

      this._lights = lights;
      this._scenes = scenes;
      this._scripts = scripts;
      this._switches = switches;
      this._sensors = sensors;
      this._binary_sensors = binarySensors;
      this._compounds = compounds;
      this._automation = automation;
      this._entities = entities;
      console.log(this._lights);
      console.log(this._sensors); 
      console.log(this._binary_sensors);
      if (update) {
        setTimeout(() => {
          Object.keys(this._entities).forEach(id => {
            this._onStateChanged({
              data: {
                entity_id: id,
                new_state: this._entities[id],
              },
            });
          });
        }, 5000);
      }
    }
  }
}

const testClient = new Client(address, token);
console.log(testClient);
module.exports = Client;