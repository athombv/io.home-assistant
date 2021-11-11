'use strict';

// here the different entities that were retrieved by the WS will be checked to see if they could be paired together (ex pairing temp, humidity, pressure and battery to form a weather sensor)
const file1 = require("../_testingAndVersions/jsons/device_registry.json");
const file2 = require("../_testingAndVersions/jsons/entity_registry.json");
const SENSOR_MAP =// type: number
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

class Converter {
    constructor() {
        this.compatibleDevices = [];
        this.listOfDevices = {}; //this._devices
        this.prevEntities = [];
        
        this.compoundcheck = false;
    }

    // gets all home assistant entities compatible with Homey
    getDevices() {
        console.log('getting devices!');
        return this.compatibleDevices;
    }

    // registers the device in a list which is saved in the memory of the app, needs to be used to remember what entities are already connected
    registerDevice(deviceId, device) {
        console.log('Registering device');
        //console.log('DeviceId:', deviceId); console.log('device:', device);
        this.listOfDevices[deviceId] = device;
    }

    unregisterDevice(deviceId) {
        console.log('Unregistering device');
        this.listOfDevices[deviceId] = null;
    }

    // gives the specific Entity ID, ex. lumi_lumi_weather_temperature or tradfri_motion_onoff
    getEntity(entityId) {
        console.log('getting entity...');
        return this.prevEntities[entityId];
    }

    // scans the device list for any changes every 5000 ms (?)
    stateChange(event) {
        try {
            const deviceIds = Object.keys(this.listOfDevices);
            //console.log(deviceIds);
            const { data } = event;
            //console.log(data);
            if (data) {
                const entityId = data.entity_id;
                console.log(entityId); // any time an entity updates data gets called
                deviceIds.forEach(deviceId => {
                    // hij komt nooit voorbij de eerste deviceId
                    console.log('device:', deviceId);
                    const device = this.listOfDevices[deviceId]; 
                    //console.log('device:', device);
                    if (device) {
                        this.compatibleDevices.map(idOfDevice => {
                            //console.log("id", idOfDevice);
                            if(idOfDevice.data.id === deviceId) {
                                idOfDevice.matchedEntities.forEach(id => {
                                    console.log('id::',id);
                                    if(entityId == id.data.id) {
                                        device.entityUpdate(data.new_state);
                                    }
                                })
                                
                            }
                        })
                        // where do you find the fact that there are more ids coupled to this deviceId
                        // for each entity of the device do a data.new_state update
                        //device.entityUpdate(data.new_state);
                        }
                    
                });
            }
        } catch (e) {
            console.error(new Error('state changed error'));
        }
    }
    // main function which converts the home assistant entities to readable homey capabilities, ids etc.
    // functional huehue
    homeyMapper(entities) {
        const homeyDevices = [];
        const deviceRegistry = [...file1];
        const entityRegistry = [...file2];
        let buffer = [];
        let matchingEntities = [];
        if (this.prevEntities.length !== entities.length) { // !==
            console.log('update entities');
            const file3_1 = Object.values(entities);

            // before i already had this.entityRegistry = [] placed in the constructor of Converter. 
            // but, because I placed the data of entityRegistry etc.. in the prototype of Converter, the data actually never got placed in the constructor part.
            deviceRegistry.forEach(device => { //maps the device registry
                entityRegistry.forEach(entity => { //maps the entity registry
                    if (entity.device_id === device.id) { //if the device_id (which the entity is linked to in the registries) equals to the id of the device, this is true
                        file3_1.forEach(ent => {
                            if (ent.entity_id === entity.entity_id) {
                                if (ent.attributes.device_class) {
                                    const array1 = Object.entries(ent.attributes) // this returns a string [key, value] so like [ [ "a", "measure_temperature"], ["b", "measure_generic"]] which is the whole reason why the capabilities parameter gets turned into an array
                                        .map(([key, value]) => {
                                            if (key == 'device_class') {
                                                const capabilityId = SENSOR_MAP[value];
                                                //console.log(capabilityId);
                                                if (!capabilityId) {
                                                    return 'measure_generic';
                                                }
                                                return capabilityId;
                                            }
                                        }).filter(capabilityId => {
                                            return capabilityId;
                                        });
                                    matchingEntities.push({
                                        name: ent.attributes.friendly_name, //strng
                                        data: {
                                            id: entity.entity_id, // string
                                        },
                                        capabilities: array1.toString(),
                                    });
                                }
                            }
                        });
                        while (device.name !== buffer) {
                            buffer = device.name;
                            // hier zitten alle entities gekoppeld aan de devices
                        }
                    }
                });
                if (matchingEntities.length > 0) {
                    homeyDevices.push({
                        name: device.name,
                        data: {
                            id: device.id,
                        },
                        matchedEntities: matchingEntities,
                        capabilities: matchingEntities.map(({ capabilities }) => capabilities),
                    });
                }
                matchingEntities = [];
            });
            //console.log(JSON.stringify(homeyDevices, null, 4));

            this.compatibleDevices = homeyDevices;
            const update = this.prevEntities.length === 0;
            this.prevEntities = entities;

            if (update) {
                setTimeout(() => {
                    console.log('calling update');
                    Object.keys(this.prevEntities).forEach(id => {
                        this.stateChange({
                            data: {
                                entity_id: id,
                                new_state: this.prevEntities[id],
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