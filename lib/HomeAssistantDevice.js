'use strict';

const Homey = require('homey');
const HomeAssistantUtil = require('./HomeAssistantUtil');
const HomeAssistantConstants = require('./HomeAssistantConstants');

module.exports = class HomeAssistantDevice extends Homey.Device {

  onInit = async () => {
    // Get Server
    const { serverId } = this.getData();
    this.server = await this.homey.app.getServer(serverId);
    this.server.getConnection().catch(err => {
      this.setUnavailable(err).catch(this.error);
    });

    this.hassUrl = `${this.server.protocol}://${this.server.host}:${this.server.port}`;

    this.image = await this.homey.images.createImage();
    this.image.setUrl(null);
    await this.setAlbumArtImage(this.image);

    // Register Entity Event Listeners
    const entityIds = this.getEntityIds();
    entityIds.forEach(entityId => {
      // Initial sync
      this.server.getEntityState({ entityId })
        .then(async entityState => {
          await this.onEntityState({
            entityId,
            entityState,
          });
        })
        .catch(this.error);

      // Live Syncs
      this.server.on(`state_changed_entity:${entityId}`, entityState => {
        this.log('Entity State:', entityState);
        this.onEntityState({
          entityId,
          entityState,
        }).catch(this.error);
      });
    });

    // Register Capability Listeners
    // Light / Switch Capabilities
    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnOff);
    } else {
      const onoffCapabilities = this.getOnOffCapabilities();

      onoffCapabilities.forEach(capabilityId => {
        this.registerCapabilityListener(capabilityId, (value, options) => {
          this.onCapabilityOnOff(value, options, capabilityId);
        });
      });
    }

    // Light Capabilities
    if (this.hasCapability('dim')) {
      this.registerCapabilityListener('dim', this.onCapabilityDim);
    }

    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSaturation);
    }

    if (this.hasCapability('light_temperature')) {
      this.registerCapabilityListener('light_temperature', this.onCapabilityLightTemperature);
    }

    if (this.hasCapability('light_mode')) {
      this.registerCapabilityListener('light_mode', this.onCapabilityLightMode);
    }

    // Speaker Capabilities
    if (this.hasCapability('speaker_playing')) {
      this.registerCapabilityListener('speaker_playing', this.onCapabilitySpeakerPlaying);
    }

    if (this.hasCapability('speaker_next')) {
      this.registerCapabilityListener('speaker_next', (value, options) => {
        this.onCapabilitySpeakerService('media_next_track', options, 'speaker_next');
      });
    }

    if (this.hasCapability('speaker_prev')) {
      this.registerCapabilityListener('speaker_prev', (value, options) => {
        this.onCapabilitySpeakerService('media_previous_track', options, 'speaker_prev');
      });
    }

    if (this.hasCapability('speaker_repeat')) {
      this.registerCapabilityListener('speaker_repeat', this.onCapabilityRepeatSet.bind(this));
    }

    if (this.hasCapability('speaker_shuffle')) {
      this.registerCapabilityListener('speaker_shuffle', this.onCapabilityShuffleSet.bind(this));
    }

    // Volume Capabilities
    if (this.hasCapability('volume_up')) {
      this.registerCapabilityListener('volume_up', (value, options) => {
        this.onCapabilitySpeakerService('volume_up', options, 'volume_up');
      });
    }

    if (this.hasCapability('volume_down')) {
      this.registerCapabilityListener('volume_down', (value, options) => {
        this.onCapabilitySpeakerService('volume_down', options, 'volume_down');
      });
    }

    if (this.hasCapability('volume_set')) {
      this.registerCapabilityListener('volume_set', this.onCapabilityVolumeSet);
    }

    if (this.hasCapability('volume_mute')) {
      this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute);
    }

    if (this.hasCapability('windowcoverings_state')) {
      this.registerCapabilityListener('windowcoverings_state', async (value, options) => {
        switch (value) {
          case 'up':
            await this.onCapabilityCoveringService('open_cover', options, 'windowcoverings_state');
            break;
          case 'down':
            await this.onCapabilityCoveringService('close_cover', options, 'windowcoverings_state');
            break;
          default:
            await this.onCapabilityCoveringService('stop_cover', options, 'windowcoverings_state');
            break;
        }
      });
    }

    if (this.hasCapability('windowcoverings_tilt_up')) {
      this.registerCapabilityListener('windowcoverings_tilt_up', (value, options) => {
        this.onCapabilityCoveringService('open_cover_tilt', options, 'windowcoverings_tilt_up');
      });
    }

    if (this.hasCapability('windowcoverings_tilt_down')) {
      this.registerCapabilityListener('windowcoverings_tilt_down', (value, options) => {
        this.onCapabilityCoveringService('close_cover_tilt', options, 'windowcoverings_tilt_down');
      });
    }

    if (this.hasCapability('windowcoverings_tilt_set')) {
      this.registerCapabilityListener('windowcoverings_tilt_set', this.onCapabilityCoveringTiltSet);
    }

    if (this.hasCapability('windowcoverings_closed')) {
      this.registerCapabilityListener('windowcoverings_closed', (value, options) => {
        this.onCapabilityCoveringService('toggle', options, 'windowcoverings_closed');
      });
    }

    if (this.hasCapability('windowcoverings_set')) {
      this.registerCapabilityListener('windowcoverings_set', this.onCapabilityCoveringSet);
    }

    if (this.hasCapability('garagedoor_closed')) {
      this.registerCapabilityListener('garagedoor_closed', (value, options) => {
        this.onCapabilityCoveringService('toggle', options, 'garagedoor_closed');
      });
    }

    // Set Warning if Homey support this device natively for a better experience.
    const {
      manufacturer,
      model,
      identifiers,
    } = this.getStore();

    const { platform } = this.homey;

    const nativeAppSuggestion = HomeAssistantUtil.getNativeAppSuggestion({
      manufacturer,
      model,
      identifiers,
      platform,
    });

    if (nativeAppSuggestion) {
      setTimeout(() => {
        this.setWarning(this.homey.__('nativeAppSuggestion', {
          appName: nativeAppSuggestion,
        })).catch(this.error);
      }, 1000);
    }
  }

  /*
   * Helper methods
   */

  getEntityId = ({ capabilityId }) => {
    if (!this.hasCapability(capabilityId)) {
      throw new Error(`Invalid Capability: ${capabilityId}`);
    }

    const capabilityOptions = this.getCapabilityOptions(capabilityId);
    const { entityId } = capabilityOptions;
    if (!entityId) {
      throw new Error(`Invalid Entity ID For Capability: ${capabilityId}`);
    }

    return entityId;
  }

  getEntityIds = () => {
    const entityIds = [];
    const capabilities = this.getCapabilities();
    for (const capabilityId of capabilities) {
      const { entityId } = this.getCapabilityOptions(capabilityId);
      if (entityId) {
        if (!entityIds.includes(entityId)) {
          entityIds.push(entityId);
        }
      }
    }
    return entityIds;
  }

  getOnOffCapabilities = () => {
    const capabilities = this.getCapabilities();

    return capabilities.filter((item, index) => {
      return item.startsWith('onoff');
    });
  }

  setBinarySensorState = (deviceClass, state) => {
    const capabilityId = deviceClass
      ? HomeAssistantConstants.ENTITY_ALARM_CAPABILITY_MAP[deviceClass]
      : null;

    if (this.hasCapability(capabilityId)) {
      this.setCapabilityValue(capabilityId, state).catch(this.error);
    }
  }

  /*
   * Capability Listeners
   */
  onCapabilityOnOff = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'onoff' });
    const domain = entityId.split('.')[0]; // TODO: I'm not sure this always works!

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value
        ? 'turn_on'
        : 'turn_off',
    });
  }

  onCapabilityDim = async value => {
    const entityId = this.getEntityId({ capabilityId: 'dim' });

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: value > 0
        ? 'turn_on'
        : 'turn_off',
      serviceData: {
        brightness: value > 0
          ? value * 255
          : undefined,
      },
    });
  }

  onCapabilityLightMode = async value => {
    if (value === 'color') {
      await this.triggerCapabilityListener('light_hue', this.getCapabilityValue('light_hue'));
    } else if (value === 'temperature') {
      await this.triggerCapabilityListener('light_temperature', this.getCapabilityValue('light_temperature'));
    }
  }

  onCapabilityLightTemperature = async value => {
    if (this.hasCapability('light_mode')) this.setCapabilityValue('light_mode', 'temperature');

    const entityId = this.getEntityId({ capabilityId: 'dim' });

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: value > 0
        ? 'turn_on'
        : 'turn_off',
      serviceData: {
        color_temp: value > 0
          ? 153 + value * (500 - 153)
          : undefined,
      },
    });
  }

  onCapabilityLightHueSaturation = async ({
    light_hue: hue = this.getCapabilityValue('light_hue'),
    light_saturation: sat = this.getCapabilityValue('light_saturation'),
  }) => {
    if (this.hasCapability('light_mode')) this.setCapabilityValue('light_mode', 'color');

    const entityId = this.getEntityId({ capabilityId: 'dim' });

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: 'turn_on',
      serviceData: {
        hs_color: [
          hue * 360,
          sat * 100,
        ],
      },
    });
  }

  onCapabilitySpeakerPlaying = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'speaker_playing' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value
        ? 'media_play'
        : 'media_pause',
    });
  }

  onCapabilitySpeakerService = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'onoff' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value,
    });
  }

  onCapabilityShuffleSet = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'speaker_shuffle' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: 'shuffle_set',
      serviceData: {
        shuffle: value,
      },
    });
  }

  onCapabilityRepeatSet = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'speaker_repeat' });
    const domain = entityId.split('.')[0];

    let repeat = 'off';
    switch (value) {
      case 'track':
        repeat = 'one';
        break;
      case 'playlist':
        repeat = 'all';
        break;
      default:
        repeat = 'off';
        break;
    }

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: 'repeat_set',
      serviceData: {
        repeat,
      },
    });
  }

  onCapabilityVolumeSet = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'volume_set' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: 'volume_set',
      serviceData: {
        volume_level: value,
      },
    });
  }

  onCapabilityVolumeMute = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'volume_mute' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: 'volume_set',
      serviceData: {
        is_volume_muted: value,
      },
    });
  }

  onCapabilityCoveringService = async (value, options, capabilityId) => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'windowcoverings_state' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value,
    });
  }

  onCapabilityCoveringSet = async value => {
    const entityId = this.getEntityId({ capabilityId: 'windowcoverings_set' });

    await this.server.callService({
      domain: 'cover',
      target: {
        entity_id: entityId,
      },
      service: 'set_cover_position',
      serviceData: {
        position: value > 0
          ? value * 100
          : undefined,
      },
    });
  }

  onCapabilityCoveringTiltSet = async value => {
    const entityId = this.getEntityId({ capabilityId: 'windowcoverings_tilt_set' });

    await this.server.callService({
      domain: 'cover',
      target: {
        entity_id: entityId,
      },
      service: 'set_cover_tilt_position',
      serviceData: {
        tilt_position: value > 0
          ? value * 100
          : undefined,
      },
    });
  }

 
  // }
  
  /*
   * Entity Event
   */

  onEntityState = async ({
    entityId,
    entityState,
  }) => {
    // 'EntityState.state'
    if (typeof entityState['state'] === 'string') {
      if (entityState.attributes.volume_level && this.hasCapability('volume_set')) {
        if (this.getCapabilityValue('volume_set') !== entityState.attributes.volume_level) {
          this.setCapabilityValue('volume_set', entityState.attributes.volume_level).catch(this.error);
        }
      }

      if (entityState.attributes.is_volume_muted && this.hasCapability('volume_mute')) {
        if (this.getCapabilityValue('volume_mute') !== entityState.attributes.is_volume_muted) {
          this.setCapabilityValue('volume_mute', entityState.attributes.is_volume_muted).catch(this.error);
        }
      }

      if (entityState.attributes.shuffle && this.hasCapability('speaker_shuffle')) {
        if (this.getCapabilityValue('speaker_shuffle') !== entityState.attributes.shuffle) {
          this.setCapabilityValue('speaker_shuffle', entityState.attributes.shuffle).catch(this.error);
        }
      }

      if (entityState.attributes.repeat && this.hasCapability('speaker_repeat')) {
        switch (entityState.attributes.repeat) {
          case 'one':
            this.setCapabilityValue('speaker_repeat', 'track').catch(this.error);
            break;
          case 'all':
            this.setCapabilityValue('speaker_repeat', 'playlist').catch(this.error);
            break;
          default:
            this.setCapabilityValue('speaker_repeat', 'none').catch(this.error);
            break;
        }
      }

      switch (entityState['state']) {
        case 'on': {
          if (this.hasCapability('onoff')) {
            this.setCapabilityValue('onoff', true).catch(this.error);
          } else if (entityId.startsWith('binary_sensor') && entityState.attributes) {
            this.setBinarySensorState(entityState.attributes['device_class'], true);
          } else {
            const onOffCapabilities = this.getOnOffCapabilities();

            onOffCapabilities.forEach(capabilityId => {
              const capabilityOptions = this.getCapabilityOptions(capabilityId);
              if (capabilityOptions.entityId === entityId) this.setCapabilityValue(capabilityId, true).catch(this.error);
            });
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'off': {
          if (this.hasCapability('onoff')) {
            this.setCapabilityValue('onoff', false).catch(this.error);
          } else if (entityId.startsWith('binary_sensor') && entityState.attributes) {
            this.setBinarySensorState(entityState.attributes['device_class'], false);
          } else {
            const onOffCapabilities = this.getOnOffCapabilities();

            onOffCapabilities.forEach(capabilityId => {
              const capabilityOptions = this.getCapabilityOptions(capabilityId);
              if (capabilityOptions.entityId === entityId) this.setCapabilityValue(capabilityId, false).catch(this.error);
            });
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'playing': {
          if (this.hasCapability('speaker_playing')) {
            this.setCapabilityValue('speaker_playing', true).catch(this.error);
          }

          if (entityState.attributes.media_title && this.hasCapability('speaker_track')) {
            this.setCapabilityValue('speaker_track', entityState.attributes.media_title).catch(this.error);
          }

          if (entityState.attributes.media_artist && this.hasCapability('speaker_artist')) {
            this.setCapabilityValue('speaker_artist', entityState.attributes.media_artist).catch(this.error);
          }

          if (entityState.attributes.media_album_name && this.hasCapability('speaker_album')) {
            this.setCapabilityValue('speaker_album', entityState.attributes.media_album_name).catch(this.error);
          }

          if (entityState.attributes.media_position && this.hasCapability('speaker_position')) {
            this.setCapabilityValue('speaker_position', entityState.attributes.media_position).catch(this.error);
          }

          if (entityState.attributes.media_duration && this.hasCapability('speaker_duration')) {
            this.setCapabilityValue('speaker_duration', entityState.attributes.media_duration).catch(this.error);
          }

          if (this.imageUrl !== entityState.attributes.entity_picture) {
            this.imageUrl = entityState.attributes.entity_picture;
            try {
              this.image.setUrl(this.hassUrl + this.imageUrl);
              this.image.update().catch(this.error);
            } catch (err) {
              this.error(err);
            }
          }

          this.setAvailable().catch(this.error);
          break;
        }
        case 'paused': {
          if (this.hasCapability('speaker_playing')) {
            this.setCapabilityValue('speaker_playing', false).catch(this.error);
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'opening': {
          if (this.hasCapability('windowcoverings_state')) {
            this.setCapabilityValue('windowcoverings_state', 'up').catch(this.error);
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'closing': {
          if (this.hasCapability('windowcoverings_state')) {
            this.setCapabilityValue('windowcoverings_state', 'down').catch(this.error);
          }
          this.setAvailable().catch(this.error);
          break;
        }
        case 'open':
        case 'closed': {
          if (this.hasCapability('windowcoverings_state')) {
            this.setCapabilityValue('windowcoverings_state', 'idle').catch(this.error);
          }

          if (entityState['state'] === 'closed' && this.hasCapability('windowcoverings_closed')) {
            this.setCapabilityValue('windowcoverings_closed', true).catch(this.error);
          } else if (entityState['state'] === 'open' && this.hasCapability('windowcoverings_closed')) {
            this.setCapabilityValue('windowcoverings_closed', false).catch(this.error);
          }

          this.setAvailable().catch(this.error);
          break;
        }
        case 'unavailable': {
          this.setUnavailable().catch(this.error);
          break;
        }
        default: {
          const capabilities = this.getCapabilities();
          const capabilityId = capabilities.find(capabilityId => {
            const capabilityOptions = this.getCapabilityOptions(capabilityId);
            return capabilityOptions.entityId === entityId;
          });

          if (this.hasCapability(capabilityId)) {
            let capabilityValue = entityState['state'];
            if (capabilityId.startsWith('measure_')
              || capabilityId.startsWith('meter_')
              || capabilityId.startsWith('hass-number.')) {
              capabilityValue = parseFloat(capabilityValue, 10);
            }

            this.setCapabilityValue(capabilityId, capabilityValue).catch(this.error);
          } else {
            this.log(`Unknown EntityState.state: ${entityState['state']}`);
          }
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

    // EntityState.attributes.current_position
    if (typeof entityState.attributes['current_position'] === 'number') {
      if (this.hasCapability('windowcoverings_set')) {
        this.setCapabilityValue('windowcoverings_set', entityState.attributes['current_position'] / 100).catch(this.error);
      }
    }

    // EntityState.attributes.current_position
    if (typeof entityState.attributes['current_tilt_position'] === 'number') {
      if (this.hasCapability('windowcoverings_tilt_set')) {
        this.setCapabilityValue('windowcoverings_tilt_set', entityState.attributes['current_tilt_position'] / 100).catch(this.error);
      }
    }
  }

};
