'use strict';

const Homey = require('homey');

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

class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized: ');

    this.client = await this.homey.app.getClient();
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
          for(const [id,value] of Object.entries(SENSOR_MAP)) {
          console.log(id);
          if(data.attributes.device_class === id && capability === value) {
            this.setCapabilityValue(capability, parseFloat(data.state)); //dont set other capabilities to null
           }
          }
      });
    } catch(ex) {
      console.log('error', ex);
    }
  }
}

module.exports = MyDevice;
