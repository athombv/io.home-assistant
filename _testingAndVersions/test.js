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

const deviceRegistry = [...file1];
const entityRegistry = [...file2];
//const subscribeEntities = [...file3];
//const entityid = ['hello'];
const entityid = Object.keys(file3);
const homeyDevices = [];
// if device_id === id place the device_id object / block in a new array where id the owners is of
function test() {
  entityRegistry.forEach(entity => {
    deviceRegistry.forEach(device => {
      if (entity.device_id === device.id) {
        //console.log("match found with device: ", device.name);
        entityid.forEach(id => {
          if (entity.entity_id === id) {
            console.log('compatible entity found: ', id);
            console.log('device class: ', file3[id].attributes.friendly_name);
            if (!homeyDevices.includes(device.name) && (device.manufacturer !== "Google Inc.")) {
              homeyDevices.push(device.name);
            }
          }
        })
      }
    });
  });
}

test();
console.log('devices compatible with Homey:', homeyDevices);