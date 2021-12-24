'use strict';

const Homey = require('homey');

module.exports = class HomeAssistantDevice extends Homey.Device {

  async onInit() {
    const {
      deviceId,
      serverId,
    } = this.getData();

    const {
      entityIds,
    } = this.getStore();

    this.log(`Device ${deviceId} at Server ${serverId}`);
    this.log('Entity IDs:', entityIds);

    this.server = await this.homey.app.getServer(serverId);
    this.server.init().catch(err => {
      this.setUnavailable(err);
    });

    entityIds.forEach(entityId => {
      this.server.on(`state_changed_entity:${entityId}`, entityState => {
        this.log('Entity State:', entityState);
        this.onEntityStateChanged({
          entityId,
          entityState,
        }).catch(this.error);
      });
    });
  }

  async onEntityStateChanged({
    entityId,
    entityState,
  }) {
    // 'EntityState.state'
    if (typeof entityState['state'] === 'string') {
      switch (entityState['state']) {
        case 'on': {
          if (this.hasCapability('onoff')) {
            this.setCapabilityValue('onoff', true).catch(this.error);
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'off': {
          if (this.hasCapability('onoff')) {
            this.setCapabilityValue('onoff', false).catch(this.error);
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'unavailable': {
          this.setUnavailable().catch(this.error);
          break;
        }
        default: {
          this.log(`Unknown EntityState.state: ${entityState['state']}`);
          break;
        }
      }
    }

    // EntityState.attributes
    if (entityState.attributes) {
      // EntityState.attributes.color_mode
      if (typeof entityState.attributes['color_mode'] === 'string') {
        switch (entityState.attributes['color_mode']) {
          case 'color_temp': {
            if (this.hasCapability('light_mode')) {
              this.setCapabilityValue('light_mode', 'temperature').catch(this.error);
            }
            break;
          }
          case 'xy':
          case 'rgb': {
            if (this.hasCapability('light_mode')) {
              this.setCapabilityValue('light_mode', 'color').catch(this.error);
            }
            break;
          }
          default: {
            this.log(`Unknown EntityState.attributes.color_mode: ${entityState.attributes['color_mode']}`);
            break;
          }
        }
      }
    }

    // EntityState.attributes.brightness
    if (typeof entityState.attributes['brightness'] === 'number') {
      if (this.hasCapability('dim')) {
        this.setCapabilityValue('dim', entityState.attributes['brightness'] / 255).catch(this.error);
      }
    }

    // EntityState.attributes.hs_color
    if (Array.isArray(entityState.attributes['hs_color'])) {
      const [hue, saturation] = entityState.attributes['hs_color'];

      if (this.hasCapability('light_hue')) {
        this.setCapabilityValue('light_hue', hue / 360).catch(this.error);
      }

      if (this.hasCapability('light_saturation')) {
        this.setCapabilityValue('light_saturation', saturation / 100).catch(this.error);
      }
    }

    // EntityState.attributes.color_temp
    if (typeof entityState.attributes['color_temp'] === 'number') {
      const min = typeof entityState.attributes['min_mireds'] === 'number'
        ? entityState.attributes['min_mireds']
        : 153;

      const max = typeof entityState.attributes['max_mireds'] === 'number'
        ? entityState.attributes['max_mireds']
        : 500;

      if (this.hasCapability('light_temperature')) {
        this.setCapabilityValue('light_temperature', (entityState.attributes['color_temp'] - min) / (max - min)).catch(this.error);
      }
    }
  }

};

// 'use strict';

// const Homey = require('homey');
// class MyDevice extends Homey.Device {
//   async onInit() {
//     this.log('MyDevice has been initialized: ');

//     this.client = this.homey.app.getClient();
//     this.deviceId = this.getData().id;
//     this.capabilities = this.getCapabilities();
//     this.store = this.getStore();
//     this.capabilities.forEach(capabilityId => {
//       // the function from the websocket will listen to all events when they say 'state_changed',
//       // but you need to filter out when the entity_id of said changed state is IN the 'getStore()' then update capabilities
//       // i said it like this because then not only will it work for the lights, but also for the weather sensor.
//       this.registerCapabilityListener(capabilityId, async (value, opts) => {
//         console.log("Capability:", capabilityId);
//         console.log("Class: ", this.getClass());
//         this.log('value', value);
//         this.log('opts', opts);
//         const data = {
//           device_id: this.getData().id // you can also turn on a device through its deviceId. Error message: message: 'must contain at least one of entity_id, device_id, area_id.'
//         }
//         if (capabilityId == 'onoff' && this.getClass() == "socket") {
//           console.log("Updating Socket");
//           this.client.updateLight(value, this.getClass(), data);
//         }
//         if (capabilityId == 'dim') {
//           data.brightness_pct = value * 100; // brightness percentage
//         }
//         // homey value: between 1 and 0
//         // ha value: 250 (cold) en 454 (warm)
//         if (capabilityId == 'light_temperature') {
//           data.color_temp = 204 * value + 250;
//         }
//         // TODO register mutiple capability listener
//         if (capabilityId == 'light_hue') {
//           data.hs_color = 360 * value;
//         }
//         if (capabilityId == 'light_saturation') {
//           data.hs_color = 100 * value;
//         }
//         if (capabilityId == 'speaker_playing') {
//           this.client.pausePlay(value, capabilityId, data);
//         }
//         if (capabilityId == 'volume_set') {
//           data.volume_level = value;
//           this.client.pausePlay(value, capabilityId, data);
//         }
//         //this.log(data);
//         //TODO ADD LISTENER TO PAUSE MUSIC FROM HOMEY AND TO FORWARD AND GO BACK
//         this.client.updateLight(value, this.getClass(), data);
//       });
//     });
//     this.log("capabilities:", this.capabilities);
//     this.log("name:", this.getName());
//     this.log("store: ", this.store.deviceEntities);
//     const entities = await this.client.getEntities();

//     // -- retrieving entities -- //

//     if (entities) {
//       console.log("entities given");
//       const entityData = { entities };
//       console.log("Name device: ", this.getName());

//       // -- Placing first time values in the capabilities -- //

//       Object.keys(entityData.entities).forEach(key => {

//         if (this.store.deviceEntities[key] && this.store.deviceEntities[key].capabilityId && Array.isArray(this.store.deviceEntities[key].capabilityId)) {
//           console.log("Array: ", Array.isArray(this.store.deviceEntities[key].capabilityId))
//           const capabilityIds = this.store.deviceEntities[key].capabilityId;
//           capabilityIds.forEach(id => {
//             switch (id) {
//               case 'onoff':
//                 console.log("setting state to on or off");
//                 if (entityData.entities[key].state == 'on') {
//                   console.log("Setting state to on");
//                   this.setCapabilityValue(id, true);
//                 } else if (entityData.entities[key].state == 'off') {
//                   console.log("Setting state to off");
//                   this.setCapabilityValue(id, false);
//                   this.setCapabilityValue('dim', 0);
//                 }
//                 break;
//               case 'dim':
//                 console.log("setting dim value");
//                 if (entityData.entities[key].attributes && entityData.entities[key].attributes.brightness) {
//                   console.log("Light is on");
//                   const brightness = entityData.entities[key].attributes.brightness / 255; // max brightness = 255 , min brightness = 0
//                   this.setCapabilityValue(id, brightness);
//                 } else {
//                   console.log("Light is off");
//                   this.setCapabilityValue(id, 0);
//                   this.setCapabilityValue('onoff', false);
//                 }
//                 break;
//               case 'light_temperature':
//                 console.log('setting temperature');
//                 break;
//               case 'speaker_playing':
//                 console.log("Setting true/false of speaker playing");
//                 if (entityData.entities[key].state == 'paused') {
//                   console.log("Speaker not playing");
//                   this.setCapabilityValue(id, false);
//                 } else if (entityData.entities[key].state == 'playing') {
//                   console.log("Speaker playing");
//                   this.setCapabilityValue(id, true);
//                 }
//                 break;
//               case 'speaker_artist':
//                 console.log("Pasting Artist Name in capability");
//                 this.setCapabilityValue(id, entityData.entities[key].attributes.media_artist);
//                 break;
//               case 'speaker_album':
//                 console.log("Pasting Artists album in capability");
//                 this.setCapabilityValue(id, entityData.entities[key].attributes.media_album_name);
//                 break;
//               case 'speaker_track':
//                 console.log("Pasting speaker track name in capability");
//                 this.setCapabilityValue(id, entityData.entities[key].attributes.media_title);
//                 break;
//               case 'volume_mute':
//                 console.log("Setting volume mute true/false");
//                 this.setCapabilityValue(id, entityData.entities[key].attributes.is_volume_muted);
//                 break;
//               case 'volume_set':
//                 console.log("Setting volume level");
//                 this.setCapabilityValue(id, parseFloat(entityData.entities[key].attributes.volume_level));
//                 break;
//               // TODO WHEN A DEVICE HAS MORE THAN 1 CAPABILITY IT NEEDS TO BE ADDED TO THE SWITCH
//               default:
//                 console.log("meh");
//                 break;
//             }
//           })
//           console.log("length: ", this.store.deviceEntities[key].capabilityId.length);
//         } else if (this.store.deviceEntities[key] && this.store.deviceEntities[key].capabilityId) {
//           console.log("Single capability detected");
//           if (entityData.entities[key].state == 'on') { this.setCapabilityValue(this.store.deviceEntities[key].capabilityId, true); }
//           else if (entityData.entities[key].state == 'off') { this.setCapabilityValue(this.store.deviceEntities[key].capabilityId, false); }
//           else { this.setCapabilityValue(this.store.deviceEntities[key].capabilityId, parseFloat(entityData.entities[key].state)) }
//         }
//       });

//       // -- realtime event listener -- //

//       this.client.on('state_changed', (data) => { // start listening to 'state_changed' events
//         if (this.store.deviceEntities[data.entity_id] && this.store.deviceEntities[data.entity_id].capabilityId && Array.isArray(this.store.deviceEntities[data.entity_id].capabilityId)) {
//           const capabilityIds = this.store.deviceEntities[data.entity_id].capabilityId;
//           capabilityIds.forEach(id => {
//             switch (id) {
//               case 'onoff':
//                 if (data.new_state.state == 'on') { this.setCapabilityValue(id, true); }
//                 else if (data.new_state.state == 'off') { this.setCapabilityValue(id, false); this.setCapabilityValue('dim', 0); }
//                 break;
//               case 'dim':
//                 console.log("setting dim value");
//                 if (data.new_state.attributes && data.new_state.attributes.brightness) {
//                   const brightness = data.new_state.attributes.brightness / 255;
//                   this.setCapabilityValue(id, brightness);
//                 }
//                 break;
//               case 'light_temperature':
//                 const temperature = (data.new_state.attributes.color_temp - 250) / 204;
//                 this.setCapabilityValue(id, temperature);
//                 break;
//               case 'speaker_playing':
//                 console.log("Setting true/false of speaker playing");
//                 if (data.new_state.state == 'paused') {
//                   console.log("Speaker not playing");
//                   this.setCapabilityValue(id, false);
//                 } else if (data.new_state.state == 'playing') {
//                   console.log("Speaker playing");
//                   this.setCapabilityValue(id, true);
//                 }
//                 break;
//               case 'speaker_artist':
//                 console.log("Changing Artist Name in capability");
//                 this.setCapabilityValue(id, data.new_state.attributes.media_artist);
//                 break;
//               case 'speaker_album':
//                 console.log("Changing Artists album in capability");
//                 this.setCapabilityValue(id, data.new_state.attributes.media_album_name);
//                 break;
//               case 'speaker_track':
//                 console.log("Changing speaker track name in capability");
//                 this.setCapabilityValue(id, data.new_state.attributes.media_title);
//                 break;
//               case 'volume_mute':
//                 console.log("Changing volume mute to true/false");
//                 this.setCapabilityValue(id, data.new_state.attributes.is_volume_muted);
//                 break;
//               case 'volume_set':
//                 console.log("Changing volume level");
//                 this.setCapabilityValue(id, parseFloat(data.new_state.attributes.volume_level));
//                 break;
//               //TODO CHANGE SO THAT NOT EVERY CAPABILITY CHANGES
//               default:
//                 break;
//             }
//           })
//         } else if (this.store.deviceEntities[data.entity_id] && this.store.deviceEntities[data.entity_id].capabilityId) {
//           console.log("Setting value of sensor!");
//           if (data.new_state.state == 'on') { this.setCapabilityValue(this.store.deviceEntities[data.entity_id].capabilityId, true); }
//           else if (data.new_state.state == 'off') { this.setCapabilityValue(this.store.deviceEntities[data.entity_id].capabilityId, false); }
//           else { this.setCapabilityValue(this.store.deviceEntities[data.entity_id].capabilityId, parseFloat(data.new_state.state)); }
//         }
//       })
//     }
//   }

//   async onAdded() {
//     this.log('MyDevice has been added:', this.getName());
//   }
//   async onRenamed(name) {
//     this.log('MyDevice was renamed', name);
//   }

//   async onDeleted() {
//     this.log('MyDevice has been deleted:', this.getName());
//   }
// }

// module.exports = MyDevice;

// /*
// send fired events from homey to home assistant (capability listener)

// add app icon

// add device icons

// issue: rgb light isnt working
// */
