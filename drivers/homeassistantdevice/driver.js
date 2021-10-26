'use strict';

const HA_ENTITIES_TO_HOMEY_CAPABILIIES_MAP = {
  '':'',

}
const Homey = require('homey');

class MyDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
  }
  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices(data) {
    this.log('Pair function called');
    const client = this.homey.app.getClient();
    const haDevices = client.getDevices();
    return haDevices;
  }
}

module.exports = MyDriver;

