'use strict';

const Homey = require('homey');
const HAUtil = require('../../lib/HAUtil');

module.exports = class HomeAssistantDriver extends Homey.Driver {

  async onPairListDevices() {
    const client = this.homey.app.getClient();
    const connection = await client.getConnection();

    const deviceRegistry = await connection.sendMessagePromise({ type: "config/device_registry/list" });
    const entityRegistry = await connection.sendMessagePromise({ type: "config/entity_registry/list" });
    const entities = await client.getEntities();
    console.log(JSON.stringify(deviceRegistry, null, 4));
    //console.log(JSON.stringify(entityRegistry, null, 4));
    return deviceRegistry
      .map(device => {
        return {
          entities: entityRegistry.filter(entity => {
            return entity.device_id === device.id;
          }),
          ...device,
        };
      })
      .filter(device => {
        if (device.entities.length === 0) return false;
        // TODO
        return true;
      })
      .map(device => {
        // const deviceClass = 'other';
        let deviceEntities = [];
        const deviceStore = {}; // capabilities: "", 
        device.entities.forEach(({ entity_id: entityId }) => {
          console.log("Entity ID: ", entityId);
          const entity = entities[entityId];
          //console.log("entity:", entity);
          if (!entity) return;
          console.log("test");
          //TODO make 1 entity have 1 capability, if it needs more capabilities, duplicate entity
          // if capability length != 1 -> getcapabilityfromentity
          const capabilityId = HAUtil.getCapabilityFromEntity(entity);
          console.log("Capability: ", capabilityId);
          if (!capabilityId) return;
          // the light is 1 device with mutiple entities, already making capabilityId an entire array. when you want to push the capabilityId in deviceCapabilities, you get an array inside of an array
          // something is wrong here it executes the devicestore stuff as many times as that there are entities connected to said device -- ? possible issue, keep tracking it
          deviceEntities = deviceEntities.concat(capabilityId);
          deviceStore.deviceEntities = deviceStore.deviceEntities || {};
          deviceStore.deviceEntities[entityId] = { capabilityId };
        });
        const deviceClass = HAUtil.getClassFromCapabilities(deviceEntities);
        // TODO: deviceClass like blinds, windows, sensors etc.
        console.log("stored:", deviceStore);
        console.log("data: ", device.id);
        return {
          class: deviceClass,
          capabilities: deviceEntities,
          store: deviceStore,
          name: device.name,
          data: {
            id: device.id,
          },
        }
      })
      // the below filter is the issue, when the code doesnt recognize any capabilities (what i had with the light) it wont show it in onPairlistDevices
      .filter(device => {
        if (device.capabilities.length === 0) return false;
        return true;
      })
  }
}