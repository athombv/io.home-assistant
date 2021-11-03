
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

const WEATHER_CAPABILITIES = {
    'sensor.lumi_lumi_weather_temperature': 'measure_temperature',
    'sensor.lumi_lumi_weather_power': 'measure_battery',
    'sensor.lumi_lumi_weather_pressure': 'measure_pressure',
    'sensor.lumi_lumi_weather_humidity': 'measure_humidity'
};

const name = "Sammy"
const map = Array.prototype.map

const newName = map.call(name, eachLetter => {
    return `${eachLetter}a`
})

console.log(newName)
// failed attempt 2, now knowing what was wrong, thanks to the console log of device.attributes.device_class:

// WORKS!!!!!!!!! the one below works

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

/* what if you would just paste the information from the subscribed entity (ex sensor.lumi_lumi_weather_humidity) in the HA_data first, like entity_id.
then the value of entity_id would become sensor.lumi_lumi_weather_humidity
then go to attributes and like push the values of the attributes into there. Then any unknown attributes wouldn't get thrown.
Then go to HA_attributes and just paste/push the data from the API array into there.

*/

function comparedevices() {
    
    const devicesAll = [];
    loadData.map(device => {
        devicesAll.push({
            name: device.attributes.friendly_name,
            data: {
                id: device.entity_id,
            },
            capabilities: Object.entries(device.attributes)
            .map(([key, value])=> {
                if(key == 'device_class') {
                    const capabilityId = HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP[value];
                    if(!capabilityId) {
                        return 'measure_generic';
                    }
                    return capabilityId;
                }
            }).filter(capabilityId => {
                return typeof capabilityId === 'string';
            })
        });
    });
    
    for(let i = 0; i < devicesAll.length; i ++) {
        if (i >= 4 && devicesAll[i].name === 'LUMI weather sensor temperature' && devicesAll[i - 1].name === 'LUMI weather sensor pressure' && devicesAll[i - 2].name === 'LUMI weather sensor power' && devicesAll[i - 3].name === 'LUMI weather sensor humidity') {
            //mappedDevices[i].name = 'Update_check';
            devicesAll.push({
                name: "LUMI weather sensor",
                data: {
                    id: "sensor.lumi_lumi_weather", // changed from sensor.lumi_lumi_weather
                    //key: Object.keys(WEATHER_CAPABILITIES),
                },
                capabilities: Object.values(WEATHER_CAPABILITIES),
            });
        } if(i >= 4 && devicesAll[i].name === 'GM1913 Battery Temperature' && devicesAll[i-1].name === 'GM1913 Charger Type' && devicesAll[i-2].name === 'GM1913 Battery State' && devicesAll[i-3].name === 'GM1913 Battery Level'){
            devicesAll.push({
                name: "GM1913",
                data:{
                    id: "sensor.gm1913",
                },
            });
        }
    }//echt kijken of je bij storage kan komen
    console.log(devicesAll); // i want devicesAll.data.id
    const deviceNames = [];
    const deviceIds = Object.values(devicesAll);
    deviceIds.forEach(deviceId => {
        deviceNames.push(deviceId.data.id);
    });
    console.log(deviceNames); // now compare each value of the array to predetermined string values, like sensor.lumi_lumi_weather and sensor.gm1913
    for(let i = 0; i < deviceNames.length; i ++){
        if(deviceNames[i] ==='sensor.gm1913'){
            console.log('Phone detected');
        } else if(deviceNames[i] === 'sensor.lumi_lumi_weather'){
            console.log('Weather sensor detected');
        }
    }
}

comparedevices();