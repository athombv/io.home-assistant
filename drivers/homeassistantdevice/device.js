'use strict';

const Homey = require('homey');

class MyDevice extends Homey.Device {

  async onInit() {
    this.log('MyDevice has been initialized');

    this.client = this.homey.app.getClient();
    this.entityId = this.getData().id;
    
    this.capabilities = this.getCapabilities(); //had this.getcapabilities()[0];
    
    this.log('device initialized');
    this.log('id: ', this.entityId);
    this.log('name: ', this.getName());
    this.log('class: ', this.getClass());
    this.log('capabilities: ', this.capabilities);

    this.client.registerDevice(this.entityId, this);

    const entity = this.client.getEntity(this.entityId);
    if (entity) {
      this.entityUpdate(entity);
    }
    // this.registerMultipleCapabilityListener(this.getCapabilities(), this.setCapabilities.bind(this), 100);
  }
  async onAdded() {
    this.log('MyDevice has been added');
  }
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

  entityUpdate(data) {
    try {
      this.capabilities.forEach(capability => {
        this.setCapabilityValue(capability, parseFloat(data.state));
      });
    } catch(ex) {
      console.log('error', ex);
    }
  }
}

module.exports = MyDevice;
