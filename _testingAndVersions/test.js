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

var homeyDevices = [];


const deviceRegistry = [...file1];
const entityRegistry = [...file2];
const entityData = [];
//const subscribeEntities = [...file3];
//const entityid = ['hello'];
const entityKeys = Object.keys(file3);
// if device_id === id place the device_id object / block in a new array where id the owners is of
function test() {
  let i = 0;
  let buffer = "test";
  // console.log(deviceRegistry);
  entityRegistry.forEach(entity => { //maps the entity registry
    deviceRegistry.forEach(device => { //maps the device registry
      if (entity.device_id === device.id) { //if the device_id (which the entity is linked to in the registries) equals to the id of the device, this is true
        if (device.name !== buffer) {
          homeyDevices[i] = new compDevice(device.name);
          homeyDevices[i].deviceId = device.id;
          buffer = device.name;
          entityRegistry.forEach(entity_ => {
            if (homeyDevices[i].deviceId === entity_.device_id) {
              // homeyDevices[i].matchedEntities.push({
              // name: entity_.entity_id,
              // });
              homeyDevices[i].matchedEntities.push(entity_.entity_id);
            }
          });
          const lengthOfEntities = Object.keys(homeyDevices[i].matchedEntities).length;
          console.log(lengthOfEntities);
          entityKeys.forEach(id => {
            
          });
          
          // match the entities subclass stuff to this
          
          i++;
        }
        // hier zitten alle entities gekoppeld aan de devices

      }
    });
  });
}

test();
for (let i = 0; i < homeyDevices.length; i++) {
  homeyDevices[i].display();
}
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