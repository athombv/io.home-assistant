'use strict';

const Homey = require('homey');
const WEATHER_CAPABILITIES = {
  'sensor.lumi_lumi_weather_temperature': 'measure_temperature',
  'sensor.lumi_lumi_weather_power': 'measure_battery',
  'sensor.lumi_lumi_weather_pressure': 'measure_pressure',
  'sensor.lumi_lumi_weather_humidity': 'measure_humidity'
};
class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized');

    this.client = this.homey.app.getClient();
    this.entityId = this.getData().id;
    this.capabilities = this.getCapabilities();
    //if (this.capabilities.length != 0) { this.getCapabilities()[0];} else {this.getCapabilities();}

    //this.capabilities = this.getCapabilities(); //had this.getcapabilities()[0];
    
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
    console.log('updating capabilities');
    try {
      this.capabilities.forEach(capability => {
        console.log(capability);
        //Object.keys(WEATHER_CAPABILITIES).forEach(id => {
          for(const [id,value] of Object.entries(WEATHER_CAPABILITIES)) {
          console.log(id);
          if(data.entity_id === id && capability === value) {
            this.setCapabilityValue(capability, parseFloat(data.state)); //dont set other capabilities to null
           }
          }
        //});
      });
    } catch(ex) {
      console.log('error', ex);
    }
  }
}

module.exports = MyDevice;
