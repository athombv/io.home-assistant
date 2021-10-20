'use strict';
const Homey = require("homey");

const Hass = require('home-assistant-js-websocket');

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
class Client extends Homey.SimpleClass {

    constructor(address, token) {
        super();
        this.authConnection(address, token);
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
        Hass.subscribeEntities(connection, this.homeyMapper.bind(this));
    }

    homeyMapper = (entities) => {
        var tmpEntities = {};
        Object.assign(tmpEntities, entities);
        console.log('update entities');
        const homeyMap = Object.values(tmpEntities);
        const doubleMap = homeyMap.map(device => {
            if (device.attributes.device_class) {
                return {
                    ID: device.entity_id,
                    name: device.attributes.friendly_name, // new
                    state: device.state,
                    // add supported features and supported color modes
                    capabilities: Object.entries(device.attributes)
                        .map(([key, value]) => { //map(([key, value]))
                            if (key == 'device_class') {
                                const capabilityId = SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1[value];
                                if (!capabilityId) {
                                    return null;
                                }
                                return capabilityId;
                            }
                        }).filter(capabilityId => {
                            return typeof capabilityId === 'string';
                        }),
                }
            }
        });
        Object.keys(doubleMap).forEach(key => doubleMap[key] === undefined && delete doubleMap[key]);
        this.devices = doubleMap.filter((a) => a);
        console.log(this.devices);
    }

    getDevices() {
        console.log('getting devices!');
        return this.devices;
    }
}

module.exports = Client;
