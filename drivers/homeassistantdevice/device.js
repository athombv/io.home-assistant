'use strict';

const Homey = require('homey');
class MyDevice extends Homey.Device {
  async onInit() {
    this.log('MyDevice has been initialized: ');

    this.client = this.homey.app.getClient();
    this.deviceId = this.getData().id;
    this.capabilities = this.getCapabilities();
    this.store = this.getStore();
    this.capabilities.forEach(capabilityId => {
      // the function from the websocket will listen to all events when they say 'state_changed', but you need to filter out when the entity_id of said changed state is IN the 'getStore()' then update capabilities
      // i said it like this because then not only will it work for the lights, but also for the weather sensor.
      this.registerCapabilityListener(capabilityId, async (value, opts) => {
        this.log('value', value);
        this.log('opts', opts);
        const data = {
          device_id: this.getData().id // you can also turn on a device through its deviceId. Error message: message: 'must contain at least one of entity_id, device_id, area_id.'
        }
        if (capabilityId == 'dim') {
          data.brightness_pct = value * 100; // brightness percentage
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
    this.log("capabilities:", this.capabilities);
    this.log("name:", this.getName());
    this.log("store: ", this.store.deviceEntities);
    const entities = await this.client.getEntities();

    // -- retrieving entities -- // 

    if (entities) {
      console.log("entities given");
      const entityData = { entities };
      const entityName = Object.keys(entityData.entities);
      //console.log("names: ", entityName);
      console.log("Name device: ", this.getName());

      // -- Placing first time values in the capabilities -- // 

      Object.keys(entityData.entities).forEach(key => {

        if (this.store.deviceEntities[key] && this.store.deviceEntities[key].capabilityId && Array.isArray(this.store.deviceEntities[key].capabilityId)) {
          console.log("Array: ", Array.isArray(this.store.deviceEntities[key].capabilityId))
          const capabilityIds = this.store.deviceEntities[key].capabilityId;
          capabilityIds.forEach(id => {
            switch (id) {
              case 'onoff':
                console.log("setting state to on or off");
                if (entityData.entities[key].state == 'on') {
                  console.log("Setting state to on");
                  this.setCapabilityValue(id, true);
                } else if (entityData.entities[key].state == 'off') {
                  console.log("Setting state to off");
                  this.setCapabilityValue(id, false);
                }
                break;
              case 'dim':
                console.log("setting dim value");
                if (entityData.entities[key].attributes && entityData.entities[key].attributes.brightness) {
                  console.log("Light is on");
                  const brightness = entityData.entities[key].attributes.brightness / 255; // max brightness = 255 , min brightness = 0
                  this.setCapabilityValue(id, brightness);
                } else {
                  console.log("Light is off");
                  this.setCapabilityValue(id, 0);
                }
                break;
              case 'light_temperature':
                console.log('setting temperature');
                break;
              default:
                console.log("meh");
                break;
            }
          })
          console.log("length: ", this.store.deviceEntities[key].capabilityId.length);
        } else if (this.store.deviceEntities[key] && this.store.deviceEntities[key].capabilityId) {
          console.log("Single capability detected");
          this.setCapabilityValue(this.store.deviceEntities[key].capabilityId, parseFloat(entityData.entities[key].state))
        }
      });

      // -- realtime event listener -- //

      this.client.on('state_changed', (data) => { // start listening to 'state_changed' events
        this.capabilities.forEach(capabilityId => {
          if (this.store.deviceEntities[data.entity_id] && this.store.deviceEntities[data.entity_id].capabilityId == capabilityId) { // doesnt work yet (does work with sensors again not with the array capabilities)
            console.log("Capability requesting update: ", this.store.deviceEntities[data.entity_id].capabilityId);
            switch (capabilityId) {
              case 'onoff':
                if (data.new_state.state == 'on') {
                  this.setCapabilityValue(capabilityId, true);
                } else if (data.new_state.state == 'off') {
                  this.setCapabilityValue(capabilityId, false);
                } else {
                  // do nothing
                }
                break;
              case 'dim':
                if (data.new_state.attributes && data.new_state.attributes.brightness) {
                  const brightness = entityData.entities[key].attributes.brightness / 255; // max brightness = 255 , min brightness = 0
                  this.setCapabilityValue(capabilityId, brightness);
                }
                break;
              case 'light_temperature':
                console.log('setting temperature');
                break;
              default:
                console.log("Setting value of sensor...");
                this.setCapabilityValue(capabilityId, parseFloat(data.new_state.state))
                break;
            }
          }
        })
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