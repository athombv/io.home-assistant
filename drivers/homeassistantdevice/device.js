'use strict';

const Homey = require('homey');

class MyDevice extends Homey.Device {


  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    this.Connect = this.homey.app.getClient();
    this.entityId = this.getData().id;
    
    this.capability = this.getCapabilities(); //had this.getcapabilities()[0];
    
    this.log('id: ', this.entityId);
    this.log('name: ', this.getName());
    this.log('class: ', this.getClass());
    this.log('capabilities: ', this.capability);
    this.Connect.registerDevice(this.entityId, this);

    const entity = this.Connect.getEntity(this.entityId);
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
      switch (this.capability) {
        case 'measure_generic':
          this.setCapabilityValue(this.capability, data.state);
          break;
        default:
          this.setCapabilityValue(this.capability, parseFloat(data.state));
          break;
      }
    } catch (ex) {
      this.log('error', ex);
    }
  }

}

module.exports = MyDevice;
