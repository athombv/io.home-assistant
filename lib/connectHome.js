'use strict';
const Homey = require("homey");

const Hass = require('home-assistant-js-websocket');
const Converter = require('./haToHomeyConverter')
const webSocket = require('ws');

global.WebSocket = webSocket;
const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1 =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};
// class Client extends Homey.SimpleClass {
class Client extends Converter {

    constructor(address, token) {
        super();
        this.authConnection(address, token);
        Converter.prototype.homeyMapper = this.homeyMapper.bind(this);
    }

    async authConnection(address, token) {
        console.log('Authenticating');
        let auth;
        auth = new Hass.Auth({
            hassUrl: address,
            access_token: token,
            expires: new Date(new Date().getTime() + 1e11),
        });
        const connection = await Hass.createConnection({ auth });
        Hass.subscribeEntities(connection, Converter.prototype.homeyMapper);
    }

}

module.exports = Client;
