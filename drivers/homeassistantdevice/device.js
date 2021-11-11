'use strict';

const Homey = require('homey');
const HAUtil = require('../../lib/HAUtil');

class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized: ');

    this.client = this.homey.app.getClient();
    this.deviceId = this.getData().id;
    this.capabilities = this.getCapabilities();
    this.capabilities.forEach(capabilityId => {
      const entityId = [];// TODO this.getStore().
      if (!entityId) return;

      // TODO: Register Capability Listener

      // TODO: Register Realtime Entity Update

    });

    this.log('device initialized');
    this.log('id: ', this.entityId);
    this.log('name: ', this.getName());
    this.log('class: ', this.getClass());
    this.log('capabilities: ', this.capabilities);

    const entity = this.client.getEntity(this.entityId);
    if (entity) {
      this.entityUpdate(entity);
    }
  }

  async onAdded() {
    this.log('MyDevice has been added:', this.getName());
  }
  async onRenamed(name) {
    this.log('MyDevice was renamed', name);
  }

  async onDeleted() {
    this.log('MyDevice has been deleted:', this.getName());
  }

  entityUpdate(data) {
    console.log('updating capabilities');
    try {
      this.capabilities.forEach(capability => {
        //console.log(capability);
        //Object.keys(WEATHER_CAPABILITIES).forEach(id => {
        for (const [id, value] of Object.entries(HAUtil.ENTITY_CAPABILITY_MAP)) {
          console.log(id);
          if (data.attributes.device_class === id && capability === value) {
            this.setCapabilityValue(capability, parseFloat(data.state)); //dont set other capabilities to null
          }
        }
      });
    } catch (ex) {
      console.log('error', ex);
    }
  }
}

module.exports = MyDevice;
