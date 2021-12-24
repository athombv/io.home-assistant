'use strict';

const Homey = require('homey');

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
    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnOff);
    }

    if (this.hasCapability('dim')) {
      this.registerCapabilityListener('dim', this.onCapabilityDim);
    }
  }

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

  onCapabilityOnOff = async value => {
    const entityId = this.getEntityId({ capabilityId: 'onoff' });
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
    const domain = entityId.split('.')[0]; // TODO: I'm not sure this always works!

    await this.server.callService({
      domain,
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
