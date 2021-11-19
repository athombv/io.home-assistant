'use strict';

const Homey = require('homey');
const HAUtil = require('../../lib/HAUtil');
class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized: ');

    this.client = this.homey.app.getClient();
    this.deviceId = this.getData().id;
    this.capabilities = this.getCapabilities();
    //this.entities = this.entities.prototype(this);
    this.store = this.getStore();
    this.capabilities.forEach(capabilityId => {
      // TODO: Register Realtime Entity Update
      // the function from the websocket will listen to all events when they say 'state_changed', but you need to filter out when the entity_id of said changed state is IN the 'getStore()' then update capabilities
      // i said it like this because then not only will it work for the lights, but also for the weather sensor.
      // but how do you access the entityId IN capabilities IN store
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
        // ha value: 250 (cold) en 454 (warm)
        if (capabilityId == 'light_temperature') {
          data.color_temp = 204 * value + 250;
        }
        // TODO register mutiple capability listener
        if (capabilityId == 'light_hue') {
          data.hs_color = 360 * value;
        }
        if (capabilityId == 'light_saturation') {
          data.hs_color = 100 * value;
        }
        this.log(data);

        this.client.updateLight(value, data);
      });
    });

    const entity = this.client.getEntities();
    // returns promise
    if (entity) {
      this.client.once('listedEntities', (entities) => {
        this.entities = entities;
        return this.entities;
      });
      this.client.on('state_changed', (data) => {
        if (this.store.deviceEntities[data.entity_id]) {
          this.capabilities.forEach(capabilityId => {
            if (this.store.deviceEntities[data.entity_id].capabilityId == capabilityId) { //pastes the new_state value in the correct capability
              if (data.new_state.state == 'on') {
                this.setCapabilityValue(capabilityId, true);
              } else if (data.new_state.state == 'off') {
                this.setCapabilityValue(capabilityId, false);
              } else {
                this.setCapabilityValue(capabilityId, parseFloat(data.new_state.state));
              }
            }
            if (this.getCapabilityValue(capabilityId) == null) {
              Object.keys(this.entities).forEach(key => {
                if (this.store.deviceEntities[key]) {
                  if (capabilityId == this.store.deviceEntities[key].capabilityId) {
                    this.setCapabilityValue(capabilityId, parseFloat(this.entities[key].state));
                  }
                }
              })
            }
          })
        }
      })
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
}

module.exports = MyDevice;

/*
send fired events from homey to home assistant (capability listener)

add app icon

add device icons

issue: rgb light isnt working

classes: dan weet homey ook of het een lamp is of niet
*/
/*
    this.client.on('state_changed', (data) => {
      console.log('data:', data);
    });*/