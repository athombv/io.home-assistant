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
// console.log(HA_Attributes);
// console.log(HA_DATA);

/* what if you would just paste the informationfrom the subscribed entity (ex sensor.lumi_lumi_weather_humidity) in the HA_data first, like entity_id.
then the value of entity_id would become sensor.lumi_lumi_weather_humidity
then go to attributes and like push the values of the attributes into there. Then any unknown attributes wouldn't get thrown.
Then go to HA_attributes and just paste/push the data from the API array into there.

*/
const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';
const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'device_class.temperature': 'measure_temperature',
    'device_class.co': 'measure_co',
    'device_class.co2': 'measure_co2',
    'device_class.pm25': 'measure_pm25',
    'device_class.humidity': 'measure_humidity',
    'device_class.pressure': 'measure_pressure',
    'device_class.noise': 'measure_noise',
    'device_class.rain': 'measure_rain',
    'device_class.wind_strength': 'measure_wind_strength',
    'device_class.wind_angle': 'measure_wind_angle',
    'device_class.gust_strength': 'measure_gust_strength',
    'device_class.gust_angle': 'measure_gust_angle',
    'device_class:battery': 'measure_battery',
    'device_class.power': 'measure_power',
    'device_class.voltage': 'measure_voltage',
    'device_class.current': 'measure_current',
    'device_class.luminance': 'measure_luminance',
    'device_class.ultraviolet': 'measure_ultraviolet',
    'device_class.water_flow': 'measure_water',
    'device_class.water': 'measure_water',
    'device_class.energy': 'meter_power'
};
// to do :  connect with the websocket to the home assistant
//          get the entities (type = event)

async function connect() {
    let auth;
    auth = new Hass.Auth({
        hassUrl: address,
        access_token: token,
        expires: new Date(new Date().getTime() + 1e11),
    });
    const connection = await Hass.createConnection({ auth });
    Hass.subscribeEntities(connection, homeyMapper.bind(this));
    //  homeyMapper.bind(this)
    // 
}

async function homeyMapper(entities) {
    console.log('update entities');
    // console.log(entities);
    const HomeyMap = {
        Device: Object.values(entities) // jesus christ. its a list of keys and values and the first thing of the value is the entity_id, which is the same as string: entity_id ...
            .forEach(entity => {
                const deviceName = entity.entity_id;
                console.log(`${deviceName}`);
                return deviceName; 
            }).filter(deviceName => {
                // console.log(capabilityId);
                return typeof deviceName === 'string';
            }),
    }
    console.log(HomeyMap);
}
connect();