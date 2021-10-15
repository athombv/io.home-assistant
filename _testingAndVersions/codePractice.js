
const name = "Sammy"
const map = Array.prototype.map

const newName = map.call(name, eachLetter => {
    return `${eachLetter}a`
})

console.log(newName)


const HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP =// type: number
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

// failed attempt 2, now knowing what was wrong, thanks to the console log of device.attributes.device_class:

const loadData = [...jsonData]; // myfunction.apply(null,args); --> nyfunction(...args);
// function Mapper() {
    //console.log(loadData);
const homeyMapper = loadData.map(device => {
    if (device.attributes.device_class) { // if the object attributes (of device) has a device_class, map the object 'device'.
        // This is different for lights, so maybe check for the supported_colormodes and/or features
        // the device_class is basically for binary_sensor or sensor. The media_player or light dont have a device class but use supported_features
        // console.log(device.entity_id);    
        return {
            name: device.entity_id,  // capabilities: Object.entries(device.attributes.device_class)
            capabilities: Object.entries(device.attributes)
                .map(([key,value]) => { //map(([key, value]))
                    console.log(`Content: ${Object.entries(device.attributes)}`);
                    // console.log(`Content: ${Object.entries(device.attributes.device_class)}`);
                    const capabilityId = HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP[key];
                    if (!capabilityId) {
                        // console.error('error');
                        return null;
                    }
                    console.log(`device class: ${device.attributes.device_class}`);
                    console.log(`Key: ${key}`);
                    console.log(`device Name: ${device.entity_id}`);
                    console.log(`Attached Capability: ${capabilityId}`);
                    return capabilityId;
                }).filter(capabilityId => {
                    // console.log(capabilityId);
                    return typeof capabilityId === 'string';
                }),
        };
    }
});
console.log(homeyMapper);

// WORKS!!!!!!!!!

const jsonData = require('./apiget.json');

const HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};

const dataEx = [    // const dataEx = [{}, {}, {},]
    {
        entity_id: 'sensor.lumi_lumi_weather_temperature',
        state: '21.4',
        attributes: {
            state_class: 'measurement',
            unit_of_measurement: '°C',
            friendly_name: 'LUMI weather sensor temperature',
            device_class: 'temperature',
        },
        last_changed: '2021-10-11T08:11:02.327347+00:00',
        last_updated: '2021-10-11T08:11:02.327347+00:00',
        context: {
            id: '7658c58457bdc77e2af125861f5d7f23',
            parent_id: null,
            user_id: null,
        },
    },
    {
        entity_id: "sensor.lumi_lumi_weather_pressure",
        state: "1018",
        attributes: {
            state_class: "measurement",
            unit_of_measurement: "hPa",
            friendly_name: "LUMI weather sensor pressure",
            device_class: "pressure"
        },
        last_changed: "2021-10-11T05:18:12.558987+00:00",
        last_updated: "2021-10-11T05:18:12.558987+00:00",
        context: {
            id: "5470e73e1238342b06430c6320639fc1",
            parent_id: null,
            user_id: null
        }
    },
]
console.log(dataEx);

const loadData = [...jsonData]; // myfunction.apply(null,args); --> nyfunction(...args);
// function Mapper() {
    console.log(loadData);
const homeyMapper = loadData.map(device => {
    if (device.attributes.device_class) { // if the object attributes (of device) has a device_class, map the object 'device'.
        // This is different for lights, so maybe check for the supported_colormodes and/or features
        // the device_class is basically for binary_sensor or sensor. The media_player or light dont have a device class but use supported_features
        // console.log(device.entity_id);    
        return {
            name: device.entity_id,  // capabilities: Object.entries(device.attributes.device_class)
            capabilities: Object.entries(device.attributes)
                .map(([key,value]) => { //map(([key, value]))
                    for (const [key, value] of Object.entries(device.attributes)) {
                        //console.log(`key: ${key}; value: ${value}`);
                        // for key == device_class && value == HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[value]{ const capabilityId = HA_SENSOR}
                        if (key == 'device_class' ) {
                            const capabilityId = HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP[value];
                            if (!capabilityId) {
                                // console.error('error');
                                return null;
                            }
                            // console.log(`device class: ${device.attributes.device_class}`);
                            // console.log(`Key: ${key}`);
                            // console.log(`device Name: ${device.entity_id}`);
                            // console.log(`Attached Capability: ${capabilityId}`);
                            return capabilityId;
                        }
                      }
                    // console.log(`Content: ${Object.entries(device.attributes)}`);
                    // console.log(`Content: ${Object.entries(device.attributes.device_class)}`);
                    //const capabilityId = HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP[key];
                    
                }).filter(capabilityId => {
                    // console.log(capabilityId);
                    return typeof capabilityId === 'string';
                }),
        };
    }
});

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

/* else if (key == 'friendly_name') {
                            const friendlyName = value;
                            return friendlyName;
                        } */

                        // const deviceContent =  [
                        //     {
                        //     name : Object.keys(entities)
                        //     .forEach(name in Object.entries(entities)
                        //         .map(([key, value]) => {
                        //            console.log(`key: ${key}; value: ${value}`)
                        //            return key, value;
                        //         })),
                        //     }];