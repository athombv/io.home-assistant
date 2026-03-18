import Homey from 'homey';
import { HaEntityStateUpdateHandler } from './HomeAssistant/HaEntityStateUpdateHandler.mjs';
import type HomeAssistantApp from './HomeAssistantApp.mjs';
import type HomeAssistantServer from './HomeAssistantServer.mjs';
import { capitalizeFirstLetter, getNativeAppSuggestion } from './HomeAssistantUtil.mjs';

export default class HomeAssistantDevice extends Homey.Device {
  private server!: HomeAssistantServer;
  private stateUpdateHandler?: HaEntityStateUpdateHandler;

  async onUninit(): Promise<void> {
    this.stateUpdateHandler?.unInit();
  }

  async onInit(): Promise<void> {
    await super.onInit();

    // Get Server
    const { serverId } = this.getData();
    this.server = await (this.homey.app as HomeAssistantApp).getServer(serverId);
    this.server.getConnection().catch(err => {
      this.error('Failed to get connection', err);
      this.setUnavailable(err).catch(this.error);
    });

    // On Off Capability Migration
    if (this.getOnOffCapabilities().length === 1 && this.hasCapability('onoff.0')) {
      const capabilityOptions = this.getCapabilityOptions(`onoff.0`);
      await this.removeCapability(`onoff.0`);

      if (!this.hasCapability('onoff')) {
        await this.addCapability('onoff');
        await this.setCapabilityOptions('onoff', capabilityOptions);
      }
    }

    // Register HA entity state update handler
    this.stateUpdateHandler = new HaEntityStateUpdateHandler(this, this.server);
    await this.stateUpdateHandler.init();

    // Register Capability Listeners
    // Light / Switch Capabilities
    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnOff);
    }

    // Extra onoff Capabilities
    const onoffCapabilities = this.getOnOffCapabilities();

    onoffCapabilities.forEach(capabilityId => {
      this.registerCapabilityListener(capabilityId, async (value, options) => {
        await this.onCapabilityOnOff(value, options, capabilityId);
      });
    });

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
      this.registerCapabilityListener('speaker_next', async (value, options) => {
        await this.onCapabilitySpeakerService('media_next_track', options, 'speaker_next');
      });
    }

    if (this.hasCapability('speaker_prev')) {
      this.registerCapabilityListener('speaker_prev', async (value, options) => {
        await this.onCapabilitySpeakerService('media_previous_track', options, 'speaker_prev');
      });
    }

    if (this.hasCapability('speaker_repeat')) {
      this.registerCapabilityListener('speaker_repeat', this.onCapabilityRepeatSet);
    }

    if (this.hasCapability('speaker_shuffle')) {
      this.registerCapabilityListener('speaker_shuffle', this.onCapabilityShuffleSet);
    }

    if (this.hasCapability('speaker_stop')) {
      this.registerCapabilityListener('speaker_stop', async (value, options) => {
        await this.onCapabilitySpeakerService('media_stop', options, 'speaker_stop');
      });
    }

    // Volume Capabilities
    if (this.hasCapability('volume_up')) {
      this.registerCapabilityListener('volume_up', async (value, options: unknown) => {
        await this.onCapabilitySpeakerService('volume_up', options, 'volume_up');
      });
    }

    if (this.hasCapability('volume_down')) {
      this.registerCapabilityListener('volume_down', async (value, options) => {
        await this.onCapabilitySpeakerService('volume_down', options, 'volume_down');
      });
    }

    if (this.hasCapability('volume_set')) {
      this.registerCapabilityListener('volume_set', this.onCapabilityVolumeSet);
    }

    if (this.hasCapability('volume_mute')) {
      this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute);
    }

    // Windowcoverings Capabilities
    if (this.hasCapability('windowcoverings_state')) {
      this.registerCapabilityListener('windowcoverings_state', async (value, options) => {
        const coverServiceId = this.getCoverServiceId(value);
        await this.onCapabilityCoveringService(coverServiceId, options, 'windowcoverings_state');
      });
    }

    if (this.hasCapability('windowcoverings_tilt_up')) {
      this.registerCapabilityListener('windowcoverings_tilt_up', async (value, options) => {
        await this.onCapabilityCoveringService('open_cover_tilt', options, 'windowcoverings_tilt_up');
      });
    }

    if (this.hasCapability('windowcoverings_tilt_down')) {
      this.registerCapabilityListener('windowcoverings_tilt_down', async (value, options) => {
        await this.onCapabilityCoveringService('close_cover_tilt', options, 'windowcoverings_tilt_down');
      });
    }

    if (this.hasCapability('windowcoverings_tilt_set')) {
      this.registerCapabilityListener('windowcoverings_tilt_set', this.onCapabilityCoveringTiltSet);
    }

    if (this.hasCapability('windowcoverings_closed')) {
      this.registerCapabilityListener('windowcoverings_closed', async (value, options) => {
        await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'windowcoverings_closed');
      });
    }

    if (this.hasCapability('windowcoverings_set')) {
      this.registerCapabilityListener('windowcoverings_set', this.onCapabilityCoveringSet);
    }

    if (this.hasCapability('garagedoor_closed')) {
      this.registerCapabilityListener('garagedoor_closed', async (value, options) => {
        await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'garagedoor_closed');
      });
    }

    if (this.hasCapability('fan_speed')) {
      this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeedSet);
    }

    if (this.hasCapability('fan_oscillate')) {
      this.registerCapabilityListener('fan_oscillate', this.onCapabilityFanOscillateSet);
    }

    if (this.hasCapability('fan_mode')) {
      this.registerCapabilityListener('fan_mode', this.onCapabilityFanModeSet);
    }

    if (this.hasCapability('aircleaner_mode')) {
      this.registerCapabilityListener('aircleaner_mode', this.onCapabilityAirCleanerModeSet);
    }

    if (this.hasCapability('vacuumcleaner_state')) {
      this.registerCapabilityListener('vacuumcleaner_state', this.onCapabilityVacuumCleanerStateSet);
    }

    // Set Warning if Homey support this device natively for a better experience.
    const { manufacturer, model, identifiers } = this.getStore();

    const { platform } = this.homey;

    const nativeAppSuggestion = getNativeAppSuggestion(manufacturer, model, identifiers, platform);

    if (nativeAppSuggestion) {
      setTimeout(() => {
        this.setWarning(
          this.homey.__('nativeAppSuggestion', {
            appName: nativeAppSuggestion,
          }),
        ).catch(this.error);
      }, 1000);
    }
  }

  /*
   * Helper methods
   */
  getCoverServiceId = (value: string): string => {
    switch (value) {
      case 'up':
        return 'open_cover';
      case 'down':
        return 'close_cover';
      default:
        return 'stop_cover';
    }
  };

  getEntityId = ({ capabilityId }: { capabilityId: string }): string => {
    if (!this.hasCapability(capabilityId)) {
      throw new Error(`Invalid capability: ${capabilityId}`);
    }

    const capabilityOptions = this.getCapabilityOptions(capabilityId);
    const { entityId } = capabilityOptions;
    if (!entityId) {
      throw new Error(`Invalid entity ID for capability: ${capabilityId}`);
    }

    return entityId;
  };

  getOnOffCapabilities = (): string[] => {
    return this.getCapabilities().filter(item => item.startsWith('onoff.'));
  };

  /*
   * Capability Listeners
   */

  isOnRunListener = async (capabilityId: string): Promise<void> => {
    return this.getCapabilityValue(capabilityId);
  };

  isValueRunListener = async (value: unknown, capabilityId: string): Promise<unknown> => {
    if (!value) {
      return false;
    }

    return value === this.getCapabilityValue(capabilityId);
  };

  onCapabilityOnOff = async (value: unknown, options: unknown, capabilityId?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'onoff' });
    const domain = entityId.split('.')[0]; // TODO: I'm not sure this always works!

    if (domain === 'vacuum') {
      await this.onCapabilityVacuumCleanerStateSet(value ? 'cleaning' : 'docked');
    } else {
      await this.server.callService({
        domain,
        target: {
          entity_id: entityId,
        },
        service: value ? 'turn_on' : 'turn_off',
      });
    }
  };

  onCapabilityDim = async (value: number): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'dim' });

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: value > 0 ? 'turn_on' : 'turn_off',
      serviceData: {
        brightness: value > 0 ? value * 255 : undefined,
      },
    });
  };

  onCapabilityLightMode = async (value: string): Promise<void> => {
    if (value === 'color') {
      await this.triggerCapabilityListener('light_hue', this.getCapabilityValue('light_hue'));
    } else if (value === 'temperature') {
      await this.triggerCapabilityListener('light_temperature', this.getCapabilityValue('light_temperature'));
    }
  };

  onCapabilityLightTemperature = async (value: number): Promise<void> => {
    if (this.hasCapability('light_mode')) {
      await this.setCapabilityValue('light_mode', 'temperature');
    }

    const entityId = this.getEntityId({ capabilityId: 'dim' });
    const temperatureOptions = this.getCapabilityOptions('light_temperature');
    const min = temperatureOptions.min_color_temp_kelvin ?? 2000;
    const max = temperatureOptions.max_color_temp_kelvin ?? 6500;

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: 'turn_on',
      serviceData: {
        color_temp_kelvin: min + (1 - value) * (max - min),
      },
    });
  };

  onCapabilityLightHueSaturation = async ({
    light_hue: hue = this.getCapabilityValue('light_hue'),
    light_saturation: sat = this.getCapabilityValue('light_saturation'),
  }): Promise<void> => {
    if (this.hasCapability('light_mode')) this.setCapabilityValue('light_mode', 'color');

    const entityId = this.getEntityId({ capabilityId: 'dim' });

    await this.server.callService({
      domain: 'light',
      target: {
        entity_id: entityId,
      },
      service: 'turn_on',
      serviceData: {
        hs_color: [hue * 360, sat * 100],
      },
    });
  };

  onCapabilitySpeakerPlaying = async (value: boolean, options: unknown, capabilityId?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'speaker_playing' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value ? 'media_play' : 'media_pause',
    });
  };

  onCapabilitySpeakerService = async (value: string, options: unknown, capabilityId?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'onoff' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value,
    });
  };

  onCapabilityShuffleSet = async (value: boolean, options: unknown, capabilityId?: string): Promise<void> => {
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
  };

  onCapabilityRepeatSet = async (value: string, options: unknown, capabilityId?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'speaker_repeat' });
    const domain = entityId.split('.')[0];

    let repeat: string;
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
  };

  onCapabilityVolumeSet = async (value: number, options: unknown, capabilityId?: string): Promise<void> => {
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
  };

  onCapabilityVolumeMute = async (value: boolean, options: unknown, capabilityId?: string): Promise<void> => {
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
  };

  onCapabilityCoveringService = async (value: string, options: unknown, capabilityId?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: capabilityId || 'windowcoverings_state' });
    const domain = entityId.split('.')[0];

    await this.server.callService({
      domain,
      target: {
        entity_id: entityId,
      },
      service: value,
    });
  };

  onCapabilityCoveringSet = async (value: number): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'windowcoverings_set' });

    await this.server.callService({
      domain: 'cover',
      target: {
        entity_id: entityId,
      },
      service: 'set_cover_position',
      serviceData: {
        position: value > 0 ? value * 100 : 0,
      },
    });
  };

  onCapabilityCoveringTiltSet = async (value: number): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'windowcoverings_tilt_set' });

    await this.server.callService({
      domain: 'cover',
      target: {
        entity_id: entityId,
      },
      service: 'set_cover_tilt_position',
      serviceData: {
        tilt_position: value > 0 ? value * 100 : 0,
      },
    });
  };

  onCapabilityFanSpeedSet = async (value: number): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'fan_speed' });

    await this.server.callService({
      domain: 'fan',
      target: {
        entity_id: entityId,
      },
      service: value > 0 ? 'turn_on' : 'turn_off',
    });

    if (value > 0) {
      await this.server.callService({
        domain: 'fan',
        target: {
          entity_id: entityId,
        },
        service: 'set_percentage',
        serviceData: {
          percentage: value * 100,
        },
      });
    }
  };

  onCapabilityFanOscillateSet = async (value: unknown): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'fan_oscillate' });

    await this.server.callService({
      domain: 'fan',
      target: {
        entity_id: entityId,
      },
      service: 'oscillate',
      serviceData: {
        oscillating: !!value,
      },
    });
  };

  onCapabilityFanModeSet = async (value?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'fan_mode' });

    await this.server.callService({
      domain: 'fan',
      target: {
        entity_id: entityId,
      },
      service: 'set_preset_mode',
      serviceData: {
        preset_mode: value && capitalizeFirstLetter(value),
      },
    });
  };

  onCapabilityAirCleanerModeSet = async (value?: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'aircleaner_mode' });

    await this.server.callService({
      domain: 'fan',
      target: {
        entity_id: entityId,
      },
      service: 'set_preset_mode',
      serviceData: {
        preset_mode: value && capitalizeFirstLetter(value),
      },
    });
  };

  onCapabilityVacuumCleanerStateSet = async (value: string): Promise<void> => {
    const entityId = this.getEntityId({ capabilityId: 'vacuumcleaner_state' });

    let service;
    switch (value) {
      case 'cleaning':
        service = 'start';
        break;
      case 'spot_cleaning':
        service = 'clean_spot';
        break;
      case 'docked':
        service = 'return_to_base';
        break;
      case 'charging':
        service = 'return_to_base';
        break;
      case 'stopped':
        service = 'stop';
        break;
      default:
        service = undefined;
        break;
    }

    if (service) {
      await this.server.callService({
        domain: 'vacuum',
        target: {
          entity_id: entityId,
        },
        service,
      });
    }
  };
}
