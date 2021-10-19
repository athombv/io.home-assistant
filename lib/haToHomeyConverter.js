'use strict';

// here the different entities that were retrieved by the WS will be checked to see if they could be paired together (ex pairing temp, humidity, pressure and battery to form a weather sensor)
import Connect from "./connectHome";

const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1 =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};

class converter extends Connect {
    
    homeyMapper = (entities) => { // const homeyMapper = (entities) => {}
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

}
}
module.exports = converter;