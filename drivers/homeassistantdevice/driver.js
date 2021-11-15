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
    //console.log(JSON.stringify(deviceRegistry, null, 4));
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
        const deviceClass = 'other';
        const deviceCapabilities = [];
        const deviceStore = {}; // capabilities: "", 

        device.entities.forEach(({ entity_id: entityId }) => {
          const entity = entities[entityId];
          if (!entity) return;

          const capabilityId = HAUtil.getCapabilityFromEntity(entity);
          if (!capabilityId) return;
          // something is wrong here it executes the devicestore stuff as many times as that there are entities connected to said device -- ? possible issue, keep tracking it
          deviceCapabilities.push(capabilityId);
          deviceStore.capabilities = deviceStore.capabilities || {};
          deviceStore.capabilities[capabilityId] = { entityId };
        });
        // TODO: deviceClass like blinds, windows, sensors etc.

        return {
          class: deviceClass,
          capabilities: deviceCapabilities,
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