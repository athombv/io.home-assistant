'use strict';

const Homey = require('homey');
const HomeAssistantUtil = require('./HomeAssistantUtil');

module.exports = class HomeAssistantDevice extends Homey.Device {

  onInit = async () => {
    // Get Server
    const { serverId } = this.getData();
    this.server = await this.homey.app.getServer(serverId);
    this.server.getConnection().catch(err => {
      this.setUnavailable(err).catch(this.error);
    });

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

    // TODO add speaker listeners? 

    // Set Warning if Homey support this device natively for a better experience.
    const {
      manufacturer,
      model, // model can be used in the future to further specify the product
      identifiers,
    } = this.getStore();

    const nativeAppSuggestion = HomeAssistantUtil.getNativeAppSuggestion({
      manufacturer,
      model,
      identifiers,
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

  /*
   * Capability Listeners
   */
  onCapabilityOnOff = async value => {
    const entityId = this.getEntityId({ capabilityId: 'onoff' });
    const domain = entityId.split('.')[0]; // TODO: I'm not sure this always works! -- It should because every single entity AND device is split up in DOMAIN.{}

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
    const entityId = this.getEntityId({ capabilityId: 'light_mode' });

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

  /*
   * Entity Event
   */

  onEntityState = async ({
    entityId,
    entityState,
  }) => {
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
          case 'hs':
            // placeholder ? -- hs, xy and rgb are all 3 corresponding to the same color the light needs to be, so only 1 needs to be filled
            break;
          case 'xy':
            // placeholder ?
            break;
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
