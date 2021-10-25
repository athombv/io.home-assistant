'use strict';

// here the different entities that were retrieved by the WS will be checked to see if they could be paired together (ex pairing temp, humidity, pressure and battery to form a weather sensor)

const SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP_1 =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': "measure_temperature",
    'humidity': "measure_humidity",
    'pressure': "measure_pressure",
    'battery': "measure_battery"
};

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

class Converter{
    constructor() {
        this.pairDevices = [];
        this.devices = {};
        this.oldEntities = [];
    }
    // gets all home assistant entities compatible with Homey
    getDevices() {
        console.log('getting devices!');
        return this.pairDevices;
    }
    // gives the specific Entity ID, ex. lumi_lumi_weather_temperature or tradfri_motion_onoff
    getEntity(entityId) {
        console.log('getting entity...');
        return this.oldEntities[entityId];
    }

    // registers the device in a list which is saved in the memory of the app, needs to be used to remember what entities are already connected
    registerDevice(deviceId, device) {
        console.log('Registering device');
        this.devices[deviceId] = device;
    }
    // unregisters the device from the list
    unregisterDevice(deviceId) {
        console.log('Unregistering device');
        this.devices[deviceId] = null;
    }
    
    // scans the device list for any changes every 5000 ms (?)
    stateChange = (event) => {
        //stateChange(event){
        try {
        const deviceIds = Object.keys(this.devices);
        const { data } = event;
        if (data) {
            const entityId = data.entity_id;
            deviceIds.forEach(deviceId => {
                const device = this.devices[deviceId];
                if (device != null) {
                    if (deviceId === entityId) {
                        device.entityUpdate(data.newState);
                    }
                }
            });
        }
    } catch (e) {
        console.error(new Error('state changed error'));
    }
    }

    // main function which converts the home assistant entities to readable homey capabilities, ids etc.
    homeyMapper = (entities) => {
        if (this.oldEntities.length !== entities.length) { // !==
            //var tmpEntities = {};
            // Object.assign(tmpEntities, entities);
            const mappedDevices = [];
            console.log('update entities');
            const homeyMap = Object.values(entities);
            homeyMap.map(device => {
                if (device.attributes.device_class) {
                    const deviceClassEntity = {
                        name: device.attributes.friendly_name, 
                        data: {
                            id: device.entity_id,
                            state: device.state
                    }, 
                    capabilities: Object.entries(device.attributes)
                        .map(([key, value]) => { 
                            if (key == 'device_class') {
                                const capabilityId = SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[value];
                                if (!capabilityId) {
                                    return 'measurement';
                                }
                                return capabilityId;
                            }
                        }).filter(capabilityId => {
                           return typeof capabilityId === 'string';
                        })
                    };
                    mappedDevices.push(deviceClassEntity);
                } else if (device.attributes.state_class) {
                    const stateClassEntity = {
                        name: device.attributes.friendly_name,
                        data: {
                            id: device.entity_id
                        },
                        capabilities: device.attributes.state_class
                    }; mappedDevices.push(stateClassEntity); 
                }
            });
            this.pairDevices = mappedDevices;
            console.log(this.pairDevices);
            this.oldEntities = entities;
            const update = this.pairDevices.length === 0;

            if (update) {
                setTimeout(() => {
                    Object.keys(this.oldEntities).forEach(id => {
                        this.stateChange({
                            data: {
                                entity_id: id,
                                newState: this.oldEntities[id],
                            },
                        });
                    });
                }, 5000);
            }
        }
    }
}

// exports module for client class in connecthome.js
module.exports = Converter;