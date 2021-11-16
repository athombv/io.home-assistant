'use strict';

const Homey = require('homey');
const HAUtil = require('../../lib/HAUtil');

class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized: ');

    this.client = this.homey.app.getClient();
    this.deviceId = this.getData().id;
    this.capabilities = this.getCapabilities();
    console.log('capabilities:', this.capabilities);
    this.capabilities.forEach(capabilityId => {
      console.log(capabilityId);

      // TODO: Register Capability Listener
      // Missing Capability Listener: light_temperature
      // TODO: Register Realtime Entity Update
      this.registerCapabilityListener(capabilityId, async (value, opts) => {
        this.log('value', value);
        this.log('opts', opts);
        const data = {
          device_id: this.getData().id // you can also turn on a device through its deviceId. Error message: message: 'must contain at least one of entity_id, device_id, area_id.'
        }
        if (capabilityId == 'dim') {
          data.brightness_pct = value * 100;
        }
        // homey value: between 1 and 0
        // ha value: 250 ( cold) en 454 (warm)
        if (capabilityId == 'light_temperature') {
          data.color_temp = 204 * value + 250
        }
        this.log(data);
        this.client.updateLight(value, data);
      });
      //TODO Make Light dimmable (e14 or the e27), they both work with 'onoff'
    });

    this.log('device initialized');
    this.log('id: ', this.deviceId);
    this.log('name: ', this.getName());
    this.log('class: ', this.getClass());
    this.log('capabilities: ', this.capabilities);
    this.log('store: ', this.getStore());
    const entity = this.client.getEntities(this.entityId);
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
  //TODO make async
  async entityUpdate(data) {
    console.log('updating capabilities');
    try {
      this.capabilities.forEach(capabilityId => {
        this.setCapabilityValue(capabilityId, parseFloat(data.state)); //dont set other capabilities to null   
      });
    } catch (ex) {
      console.log('error', ex);
    }
  }
}

module.exports = MyDevice;

/*
send fired events from homey to home assistant (capability listener)

add app icon

add device icons

issue: rgb light isnt working

classes: dan weet homey ook of het een lamp is of niet
*/