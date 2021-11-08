'use strict';

// here the different entities that were retrieved by the WS will be checked to see if they could be paired together (ex pairing temp, humidity, pressure and battery to form a weather sensor)

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

class Converter {
    constructor() {
        this.compatibleDevices = []; 
        this.listOfDevices = {}; //this._devices
        this.prevEntities = [];
        this.deviceSubIds = [];
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
            const { data } = event;
            //console.log(data);
            if (data) {
                const entityId = data.entity_id;
                // const compoundFilter = deviceIds.filter(compound=>compound.length < 12);
                for(let i = 0; i < deviceIds.length; i++) {
                    if(deviceIds[i] === 'sensor.gm1913' && !this.compoundcheck){
                        console.log('Phone compound detected');
                        this.compoundcheck = true;
                        Object.keys(PHONE_CAPABILITIES).forEach(id => {
                            const device = this._devices['sensor.gm1913'];
                            if(device) {
                                if(data.entity_id === id) {
                                    //console.log('updating: ', id);
                                    device.entityUpdate(data.new_state);
                                }
                            }
                        });   
                    } else if(deviceIds[i] === 'sensor.lumi_lumi_weather' && !this.compoundcheck){
                        console.log('compound detected');
                        this.compoundcheck = true;
                        Object.keys(WEATHER_CAPABILITIES).forEach(id => {
                            const device = this._devices['sensor.lumi_lumi_weather'];
                            //console.log(device);
                            if (device) {
                                if (data.entity_id === id) {
                                    //console.log(device);
                                    //console.log(data);
                                    //console.log('updating: ', id);
                                    //if(entityId === id)
                                    //console.log('updating with: ', data.new_state);
                                    device.entityUpdate(data.new_state);
                                }
                                }
                            });
                    } else {
                        deviceIds.forEach(deviceId => {
                            const device = this._devices[deviceId];
                            //console.log(device);
                            if (device !== null) {
                                if (deviceId === entityId) {
                                    device.entityUpdate(data.new_state);
                                }
                            }
                        });
                    }
                    this.compoundcheck = false;
                }
            }
        } catch (e) {
            console.error(new Error('state changed error'));
        }
    }
    // main function which converts the home assistant entities to readable homey capabilities, ids etc.
    // -- REDO THIS IN TEST.JS IN FOLDER _testingAndVersions
    homeyMapper(entities) {
        if (this.prevEntities.length !== entities.length) { // !==
            console.log('update entities');
            const entityKey = Object.keys(entities);
            const devArray = [];
            const homeyDevices = [];
            const entityData = [];
            // before i already had this.entityRegistry = [] placed in the constructor of Converter. 
            // but, because I placed the data of entityRegistry etc.. in the prototype of Converter, the data actually never got placed in the constructor part.
            const entityRegistry = this.entityRegistry; 
            const deviceRegistry = this.deviceRegistry;

            entityRegistry.forEach(entity => {  // maps the entity registry
                deviceRegistry.forEach(device => { //maps the device registry
                    if(entity.device_id === device.id) { //if the entity device id equals to the device ID this is true
                        entityKey.forEach(id => { //map the names of 'entitites' 
                            if(entity.entity_id === id){ // if the entity id of the entity registry is equal to this id, a compatible entity was found
                                console.log('compatible entity found: ', id);
                                entityData.push({
                                    name: entities[id].attributes.friendly_name,
                                    data: {
                                        id: entities[id].entity_id,
                                    },
                                    capabilities: Object.entries(entities[id].attributes)
                                    .map(([key,value]) => {
                                        if(key === 'device_class') {
                                            const capabilityId = SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[value];
                                            if(!capabilityId) {
                                                return 'measure_generic';
                                            }
                                            return capabilityId;
                                        }
                                    }).filter(capabilityId =>{
                                        return typeof capabilityId === 'string';
                                    })
                                });
                                
                                console.log('device class: ', entities[id].attributes.friendly_name);
                                if(!homeyDevices.includes(device.name) && device.name !== 'device1-wrk' && !id.startsWith('media_player') && !id.startsWith('light.')){
                                    homeyDevices.push(device.name);
                                    
                                }
                            }
                        });
                    }
                });
            });

            console.log('devices compatible with Homey: ', homeyDevices);
            console.log('entities that need values: ', entityData);
            this.compatibleDevices = entityData;
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