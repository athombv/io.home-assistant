'use strict';

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

// const address = 'http://homeassistant.local:8123';
// const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

class Client extends Converter {

    constructor(address, token) {
        super();
        this.authConnection(address, token);
        Converter.prototype.homeyMapper = this.homeyMapper.bind(this);
        Converter.prototype.stateChange = this.stateChange.bind(this);
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
        connection.subscribeEvents(Converter.prototype.stateChange), 'state_changed';
    }
}

// const testClient = new Client(address, token);
// console.log(testClient);
module.exports = Client;
