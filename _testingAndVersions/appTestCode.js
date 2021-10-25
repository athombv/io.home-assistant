const Hass = require('../node_modules/home-assistant-js-websocket');
const WebSocket = require('ws');

global.WebSocket = WebSocket;

const HA_Attributes = {
    'state_class': 'value',
    'unit_of_measurement': 'value',
    'friendly_name': 'friendly_name',
    'device_class': 'device_class'
};

const HA_DATA = {
    'entity_id': 'value',
    'state': 'value',
    'attributes': HA_Attributes
    // throw the rest
};
const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';
const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'co': 'measure_co',
    'co2': 'measure_co2',
    'pm25': 'measure_pm25',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'noise': 'measure_noise',
    'rain': 'measure_rain',
    'wind_strength': 'measure_wind_strength',
    'wind_angle': 'measure_wind_angle',
    'gust_strength': 'measure_gust_strength',
    'gust_angle': 'measure_gust_angle',
    'battery': 'measure_battery',
    'power': 'measure_power',
    'voltage': 'measure_voltage',
    'current': 'measure_current',
    'luminance': 'measure_luminance',
    'ultraviolet': 'measure_ultraviolet',
    'water_flow': 'measure_water',
    'water': 'measure_water',
    'energy': 'meter_power'
};

const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1 =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};

async function connect() {
    let auth;
    auth = new Hass.Auth({
        hassUrl: address,
        access_token: token,
        expires: new Date(new Date().getTime() + 1e11),
    });
    const connection = await Hass.createConnection({ auth });
    Hass.subscribeEntities(connection, homeyMapper.bind(this));
}

const homeyMapper = (entities) => { // const homeyMapper = (entities) => {}
    var tmpEntities = {};
    Object.assign(tmpEntities, entities);
    console.log('update entities');
    // console.log(entities);
    const homeyMap = Object.values(tmpEntities);
    const doubleMap = homeyMap.map(device => {
        if(device.attributes.device_class) {
            return {
                ID: device.entity_id,
                name: device.attributes.friendly_name, // new
                state: device.state,
                // add supported features and supported color modes
                capabilities: Object.entries(device.attributes)
                .map(([key,value]) => { //map(([key, value]))
                        if (key == 'device_class' ) {
                            const capabilityId = SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1[value];
                            if (!capabilityId) {
                                return null;
                            }
                            return capabilityId;
                        } else {
                            const capabilityId = value;
                            return capabilityId;
                        }              
                }).filter(capabilityId => {
                    return typeof capabilityId === 'string';
                }),
            }
        } else {
            return {
                ID: device.entity_id,
                name: device.attributes.friendly_name, // new
                state: device.state,
            }
        }
        
    }); console.log(doubleMap); 
    module.exports = doubleMap;
}
connect();

// map the homeyMap constant to expand the keys and values of that object