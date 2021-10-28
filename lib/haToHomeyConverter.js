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
const WEATHER_CAPABILITIES = {
    'sensor.lumi_lumi_weather_temperature': 'measure_temperature',
    'sensor.lumi_lumi_weather_power': 'measure_battery',
    'sensor.lumi_lumi_weather_pressure': 'measure_pressure',
    'sensor.lumi_lumi_weather_humidity': 'measure_humidity'
};

const PHONE_CAPABILITIES = {
    1: 'measure_temperature',
    2: 'measure_battery'
};

class Converter {
    constructor() {
        this.pairDevices = [];
        this._devices = {};
        this.oldEntities = [];
        this.deviceSubIds = [];
        this.compoundcheck = false;
    }

    // gets all home assistant entities compatible with Homey
    getDevices() {
        console.log('getting devices!');
        return this.pairDevices;
    }

    // registers the device in a list which is saved in the memory of the app, needs to be used to remember what entities are already connected
    registerDevice(deviceId, device) {
        console.log('Registering device');
        //console.log('DeviceId:', deviceId); console.log('device:', device);
        this._devices[deviceId] = device;
    }

    unregisterDevice(deviceId) {
        console.log('Unregistering device');
        this._devices[deviceId] = null;
    }

    // gives the specific Entity ID, ex. lumi_lumi_weather_temperature or tradfri_motion_onoff
    getEntity(entityId) {
        console.log('getting entity...');
        return this.oldEntities[entityId];
        //return this.pairDevices[entityId];
    }
    // scans the device list for any changes every 5000 ms (?)
    stateChange(event) {
        try {
            const deviceIds = Object.keys(this._devices);
            //console.log(this._devices);
            console.log(deviceIds);
            const { data } = event;
            //console.log(data);
            if (data) {
                const entityId = data.entity_id;
                if (deviceIds[4] === 'sensor.lumi_lumi_weather' && !this.compoundcheck) {
                    console.log('compound detected');
                    this.compoundcheck = true;
                    Object.keys(WEATHER_CAPABILITIES).forEach(id => {
                        const device = this._devices['sensor.lumi_lumi_weather']
                        //console.log(device);
                        if (device) {
                            if (data.entity_id === id) {
                                //console.log(device);
                                //console.log(data);
                                console.log('updating: ', id);
                                //if(entityId === id)
                                console.log('updating with: ', data.new_state);
                                device.entityUpdate(data.new_state);
                                //for (const [key,value] in Object.entries(WEATHER_CAPABILITIES)) {
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
        } catch (e) {
            console.error(new Error('state changed error'));
        }
    }

    // main function which converts the home assistant entities to readable homey capabilities, ids etc.
    homeyMapper(entities) {
        if (this.oldEntities.length !== entities.length) { // !==
            console.log('update entities');
            const mappedDevices = [];
            const homeyMap = Object.values(entities);
            homeyMap.forEach(device => {
                if (device.attributes.device_class) {
                    //const deviceClassEntity = {
                    mappedDevices.push({
                        name: device.attributes.friendly_name,
                        data: {
                            id: device.entity_id,
                        },
                        capabilities: Object.entries(device.attributes)
                            .map(([key, value]) => {
                                if (key == 'device_class') {
                                    const capabilityId = SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[value];
                                    if (!capabilityId) {
                                        return 'measure_generic';
                                    }
                                    return capabilityId;
                                }
                            }).filter(capabilityId => {
                                return typeof capabilityId === 'string';
                            })
                    });
                }
            });
            for (let i = 0; i < mappedDevices.length; i++) {
                //console.log(mappedDevices[i]);
                if (i >= 4 && mappedDevices[i].name === 'LUMI weather sensor temperature' && mappedDevices[i - 1].name === 'LUMI weather sensor pressure' && mappedDevices[i - 2].name === 'LUMI weather sensor power' && mappedDevices[i - 3].name === 'LUMI weather sensor humidity') {
                    //mappedDevices[i].name = 'Update_check';
                    mappedDevices.push({
                        name: "LUMI weather sensor",
                        data: {
                            id: "sensor.lumi_lumi_weather", // changed from sensor.lumi_lumi_weather
                            //key: Object.keys(WEATHER_CAPABILITIES),
                        },
                        capabilities: Object.values(WEATHER_CAPABILITIES),
                    });
                }
            }
            const update = this.oldEntities.length === 0;
            this.pairDevices = mappedDevices;

            console.log(this.pairDevices);
            this.oldEntities = entities;

            if (update) {
                setTimeout(() => {
                    console.log('calling update');
                    Object.keys(this.oldEntities).forEach(id => { //sensor.lumi_lumi_weather is not included here
                        //console.log(`device ID: ${id}`); 
                        this.stateChange({ //this.stateChange({data})
                            data: {
                                entity_id: id || 'sensor.lumi_lumi_weather',
                                new_state: this.oldEntities[id],
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