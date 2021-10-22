'use strict';

// here the different entities that were retrieved by the WS will be checked to see if they could be paired together (ex pairing temp, humidity, pressure and battery to form a weather sensor)

const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1 =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};

class Converter {
    constructor () {
        this.devices = {};
        //this.entities = [];
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
            } else if (device.attributes.state_class) {
                return {
                ID: device.entity_id,
                name: device.attributes.friendly_name,
                state: device.state,
                capabilities: device.attributes.state_class,
                }
            }
        });
        Object.keys(doubleMap).forEach(key => doubleMap[key] === undefined && delete doubleMap[key]);
        this.devices = doubleMap.filter((a) => a);
        console.log(this.devices);
        const update = this.devices.length === 0;

        if (update) {
            setTimeout(() => {
              Object.keys(this.entities).forEach(id => {
                this.stateChange({
                  data: {
                    entity_id: id,
                    new_state: this.entities[id],
                  },
                });
              });
            }, 5000);
          }

    }

    getDevices() {
        console.log('getting devices!');
        return this.devices;
    }

    getEntity(entityId) {
        console.log('getting entity...');
        return this.entities[entityId];
    }

    registerDevice(deviceId, device) {
        console.log('Registering device');
        this.devices[deviceId] = device;
    }

    unregisterDevice(deviceId) {
        console.log('Unregistering device');
        this.devices[deviceId] = null;
    }

    
}
module.exports = Converter;