// here i will figure out a new way to map the devices and entities
// Currently there is no device registry and the way that i do it makes it not dynamic at all
// now i have found the necessary data to be able to make a registry and export them as devices!

/*  this is the plan: 
* importall 3 json objects 
* map them all out 
* if a key is equal to one of the entity registries, paste the device class or measurement class in there (later necessary for capabilities)
* then check all entiity registries to see what their device_id is. Compare the necessary device_ids to ids of the device registry
*/
const file1 = require("./jsons/device_registry.json");
const file2 = require("./jsons/entity_registry.json");
const file3 = require("./jsons/subscribeEntities.json");

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

class compDevice {
  constructor(deviceName) {
    this.deviceName = deviceName;
    this.deviceId;
    this.subEntities = [];
    this.matchedEntities = [];
  }
  display() {
    console.log("deviceName: ", this.deviceName);
    console.log("deviceId: ", this.deviceId);
    console.log("entity_ids: ", this.matchedEntities);

  }
}

const homeyDevices = [];
const deviceRegistry = [...file1];
const entityRegistry = [...file2];

//const subscribeEntities = [...file3];
//const entityid = ['hello'];
const entityKeys = Object.keys(file3);
// if device_id === id place the device_id object / block in a new array where id the owners is of
function test() {
  const file3_1 = Object.values(file3);
  let buffer = [];
  let entities = [];
  // console.log(deviceRegistry);

  deviceRegistry.forEach(device => { //maps the entity registry
    entityRegistry.forEach(entity => { //maps the device registry
      if (entity.device_id === device.id) { //if the device_id (which the entity is linked to in the registries) equals to the id of the device, this is true
        file3_1.forEach(ent => {
          if (ent.entity_id === entity.entity_id) {
            if (ent.attributes.device_class) {
              entities.push({
                name: ent.attributes.friendly_name,
                data: {
                  id: entity.entity_id,
                },
                capabilities: Object.entries(ent.attributes)
                  .map(([key, value]) => {
                    if (key == 'device_class') {
                      const capabilityId = SENSOR_MAP[value];
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
          }
        })
        while (device.name !== buffer) {
          buffer = device.name;
          // hier zitten alle entities gekoppeld aan de devices
        }
      }
    });
    homeyDevices.push({
      name: device.name,
      deviceId: device.id,
      matchedEntities: entities,
      matchedCapabilities: entities.capabilities,
    });
    entities = [];
  });

}

test();
// for (let i = 0; i < homeyDevices.length; i++) {
//   homeyDevices[i].display();
// }
console.log(JSON.stringify(homeyDevices, null, 4));
//console.log(homeyDevices);

// -- WORKS WITH homeyDevices[i].matchedEntities.push(entity_.entity_id)
/* for(let k = 0; k < homeyDevices[i].matchedEntities.length; k ++){
            entityKeys.forEach(id => {
              if(homeyDevices[i].matchedEntities[k] === id) {
                homeyDevices[i].subEntities.push({
                  friendly: file3[id].attributes.friendly_name
                })
              }
            })
          }
          */

          /*
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
            });*/