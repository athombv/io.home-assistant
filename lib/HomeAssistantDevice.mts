import Homey from 'homey';
import { HaEntityStateUpdateHandler } from './HomeAssistant/HaEntityStateUpdateHandler.mjs';
import type HomeAssistantApp from './HomeAssistantApp.mjs';
import type HomeAssistantServer from './HomeAssistantServer.mjs';
import { capitalizeFirstLetter, getNativeAppSuggestion } from './HomeAssistantUtil.mjs';

export default class HomeAssistantDevice extends Homey.Device {
  private server!: HomeAssistantServer;
  private stateUpdateHandler?: HaEntityStateUpdateHandler;

  public async onUninit(): Promise<void> {
    this.stateUpdateHandler?.unInit();
  }

  public async onInit(): Promise<void> {
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
      this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    }

    // Extra onoff Capabilities
    this.getOnOffCapabilities().forEach(capabilityId => {
      this.registerCapabilityListener(capabilityId, async (value, options) => {
        await this.onCapabilityOnOff(value, options, capabilityId);
      });
    });

    // Light Capabilities
    if (this.hasCapability('dim')) {
      this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    }

    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      this.registerMultipleCapabilityListener(
        ['light_hue', 'light_saturation'],
        this.onCapabilityLightHueSaturation.bind(this),
      );
    }

    if (this.hasCapability('light_temperature')) {
      this.registerCapabilityListener('light_temperature', this.onCapabilityLightTemperature.bind(this));
    }

    if (this.hasCapability('light_mode')) {
      this.registerCapabilityListener('light_mode', this.onCapabilityLightMode.bind(this));
    }

    // Speaker Capabilities
    if (this.hasCapability('speaker_playing')) {
      this.registerCapabilityListener('speaker_playing', this.onCapabilitySpeakerPlaying.bind(this));
    }

    if (this.hasCapability('speaker_next')) {
      this.registerCapabilityListener('speaker_next', async (_, options) => {
        await this.onCapabilitySpeakerService('media_next_track', options, 'speaker_next');
      });
    }

    if (this.hasCapability('speaker_prev')) {
      this.registerCapabilityListener('speaker_prev', async (_, options) => {
        await this.onCapabilitySpeakerService('media_previous_track', options, 'speaker_prev');
      });
    }

    if (this.hasCapability('speaker_repeat')) {
      this.registerCapabilityListener('speaker_repeat', this.onCapabilityRepeatSet.bind(this));
    }

    if (this.hasCapability('speaker_shuffle')) {
      this.registerCapabilityListener('speaker_shuffle', this.onCapabilityShuffleSet.bind(this));
    }

    if (this.hasCapability('speaker_stop')) {
      this.registerCapabilityListener('speaker_stop', async (_, options) => {
        await this.onCapabilitySpeakerService('media_stop', options, 'speaker_stop');
      });
    }

    // Volume Capabilities
    if (this.hasCapability('volume_up')) {
      this.registerCapabilityListener('volume_up', async (_, options: unknown) => {
        await this.onCapabilitySpeakerService('volume_up', options, 'volume_up');
      });
    }

    if (this.hasCapability('volume_down')) {
      this.registerCapabilityListener('volume_down', async (_, options) => {
        await this.onCapabilitySpeakerService('volume_down', options, 'volume_down');
      });
    }

    if (this.hasCapability('volume_set')) {
      this.registerCapabilityListener('volume_set', this.onCapabilityVolumeSet.bind(this));
    }

    if (this.hasCapability('volume_mute')) {
      this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute.bind(this));
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
      this.registerCapabilityListener('windowcoverings_tilt_set', this.onCapabilityCoveringTiltSet.bind(this));
    }

    if (this.hasCapability('windowcoverings_closed')) {
      this.registerCapabilityListener('windowcoverings_closed', async (value, options) => {
        await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'windowcoverings_closed');
      });
    }

    if (this.hasCapability('windowcoverings_set')) {
      this.registerCapabilityListener('windowcoverings_set', this.onCapabilityCoveringSet.bind(this));
    }

    if (this.hasCapability('garagedoor_closed')) {
      this.registerCapabilityListener('garagedoor_closed', async (value, options) => {
        await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'garagedoor_closed');
      });
    }

    if (this.hasCapability('fan_speed')) {
      this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeedSet.bind(this));
    }

    if (this.hasCapability('fan_oscillate')) {
      this.registerCapabilityListener('fan_oscillate', this.onCapabilityFanOscillateSet.bind(this));
    }

    if (this.hasCapability('fan_mode')) {
      this.registerCapabilityListener('fan_mode', this.onCapabilityFanModeSet.bind(this));
    }

    if (this.hasCapability('aircleaner_mode')) {
      this.registerCapabilityListener('aircleaner_mode', this.onCapabilityAirCleanerModeSet.bind(this));
    }

    if (this.hasCapability('vacuumcleaner_state')) {
      this.registerCapabilityListener('vacuumcleaner_state', this.onCapabilityVacuumCleanerStateSet.bind(this));
    }

    // Home alarm
    if (this.hasCapability('homealarm_state')) {
      this.registerCapabilityListener('homealarm_state', this.onCapabilityHomealarmStateSet.bind(this));
    }

    // Humidifier
    if (this.hasCapability('target_humidity')) {
      this.registerCapabilityListener('target_humidity', this.onCapabilityTargetHumidity.bind(this));
    }

    // Lock
    if (this.hasCapability('locked')) {
      this.registerCapabilityListener('locked', this.onCapabilityLocked.bind(this));
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
  private getCoverServiceId(value: string): string {
    switch (value) {
      case 'up':
        return 'open_cover';
      case 'down':
        return 'close_cover';
      default:
        return 'stop_cover';
    }
  }

  private getEntityId(capabilityId: string): string {
    if (!this.hasCapability(capabilityId)) {
      throw new Error(`Invalid capability: ${capabilityId}`);
    }

    const capabilityOptions = this.getCapabilityOptions(capabilityId);
    const { entityId } = capabilityOptions;
    if (!entityId) {
      throw new Error(`Invalid entity ID for capability: ${capabilityId}`);
    }

    return entityId;
  }

  private getOnOffCapabilities(): string[] {
    return this.getCapabilities().filter(item => item.startsWith('onoff.'));
  }

  /*
   * Capability Listeners
   */
  public async isOnRunListener(capabilityId: string): Promise<unknown> {
    return this.getCapabilityValue(capabilityId);
  }

  public async isValueRunListener(value: unknown, capabilityId: string): Promise<unknown> {
    if (!value) {
      return false;
    }

    return value === this.getCapabilityValue(capabilityId);
  }

  private async onCapabilityOnOff(value: unknown, options: unknown, capabilityId: string = 'onoff'): Promise<void> {
    const entityId = this.getEntityId(capabilityId);
    const domain = entityId.split('.')[0];

    switch (domain) {
      case 'vacuum':
        return await this.onCapabilityVacuumCleanerStateSet(value ? 'cleaning' : 'docked');
      case 'fan':
      case 'humidifier':
      case 'light':
      case 'switch':
        return await this.server.callEntityService(domain, entityId, value ? 'turn_on' : 'turn_off');
      default:
        throw new Error(`Unsupported domain: ${domain}`);
    }
  }

  private async onCapabilityDim(value: number): Promise<void> {
    const entityId = this.getEntityId('dim');

    await this.server.callEntityService('light', entityId, value > 0 ? 'turn_on' : 'turn_off', {
      brightness: value > 0 ? value * 255 : undefined,
    });
  }

  private async onCapabilityLightMode(value: string): Promise<void> {
    if (value === 'color') {
      await this.triggerCapabilityListener('light_hue', this.getCapabilityValue('light_hue'));
    } else if (value === 'temperature') {
      await this.triggerCapabilityListener('light_temperature', this.getCapabilityValue('light_temperature'));
    }
  }

  private async onCapabilityLightTemperature(value: number): Promise<void> {
    if (this.hasCapability('light_mode')) {
      await this.setCapabilityValue('light_mode', 'temperature');
    }

    const entityId = this.getEntityId('dim');
    const temperatureOptions = this.getCapabilityOptions('light_temperature');
    const min = temperatureOptions.min_color_temp_kelvin ?? 2000;
    const max = temperatureOptions.max_color_temp_kelvin ?? 6500;

    await this.server.callEntityService('light', entityId, 'turn_on', {
      color_temp_kelvin: min + (1 - value) * (max - min),
    });
  }

  private async onCapabilityLightHueSaturation({
    light_hue: hue = this.getCapabilityValue('light_hue'),
    light_saturation: sat = this.getCapabilityValue('light_saturation'),
  }): Promise<void> {
    if (this.hasCapability('light_mode')) {
      await this.setCapabilityValue('light_mode', 'color');
    }

    const entityId = this.getEntityId('dim');

    await this.server.callEntityService('light', entityId, 'turn_on', {
      hs_color: [hue * 360, sat * 100],
    });
  }

  private async onCapabilitySpeakerPlaying(value: boolean, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'speaker_playing');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, value ? 'media_play' : 'media_pause');
  }

  private async onCapabilitySpeakerService(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'onoff');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, value);
  }

  private async onCapabilityShuffleSet(value: boolean, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'speaker_shuffle');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, 'shuffle_set', {
      shuffle: value,
    });
  }

  private async onCapabilityRepeatSet(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'speaker_repeat');
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

    await this.server.callEntityService(domain, entityId, 'repeat_set', { repeat });
  }

  private async onCapabilityVolumeSet(value: number, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'volume_set');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, 'volume_set', {
      volume_level: value,
    });
  }

  private async onCapabilityVolumeMute(value: boolean, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'volume_mute');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, 'volume_set', {
      is_volume_muted: value,
    });
  }

  private async onCapabilityCoveringService(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'windowcoverings_state');
    const domain = entityId.split('.')[0];

    await this.server.callEntityService(domain, entityId, value);
  }

  private async onCapabilityCoveringSet(value: number): Promise<void> {
    const entityId = this.getEntityId('windowcoverings_set');

    await this.server.callEntityService('cover', entityId, 'set_cover_position', {
      position: value > 0 ? value * 100 : 0,
    });
  }

  private async onCapabilityCoveringTiltSet(value: number): Promise<void> {
    const entityId = this.getEntityId('windowcoverings_tilt_set');

    await this.server.callEntityService('cover', entityId, 'set_cover_tilt_position', {
      tilt_position: value > 0 ? value * 100 : 0,
    });
  }

  private async onCapabilityFanSpeedSet(value: number): Promise<void> {
    const entityId = this.getEntityId('fan_speed');

    await this.server.callEntityService('fan', entityId, value > 0 ? 'turn_on' : 'turn_off', {
      percentage: value > 0 ? value * 100 : undefined,
    });
  }

  private async onCapabilityFanOscillateSet(value: unknown): Promise<void> {
    const entityId = this.getEntityId('fan_oscillate');

    await this.server.callEntityService('fan', entityId, 'oscillate', {
      oscillating: !!value,
    });
  }

  private async onCapabilityFanModeSet(value?: string): Promise<void> {
    const entityId = this.getEntityId('fan_mode');

    await this.server.callEntityService('fan', entityId, 'set_preset_mode', {
      preset_mode: value && capitalizeFirstLetter(value),
    });
  }

  private async onCapabilityAirCleanerModeSet(value?: string): Promise<void> {
    const entityId = this.getEntityId('aircleaner_mode');

    await this.server.callEntityService('fan', entityId, 'set_preset_mode', {
      preset_mode: value && capitalizeFirstLetter(value),
    });
  }

  private async onCapabilityVacuumCleanerStateSet(value: string): Promise<void> {
    const entityId = this.getEntityId('vacuumcleaner_state');

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

    if (!service) {
      return;
    }

    await this.server.callEntityService('vacuum', entityId, service);
  }

  private async onCapabilityHomealarmStateSet(value: string): Promise<void> {
    const entityId = this.getEntityId('homealarm_state');

    let service;
    switch (value) {
      case 'armed':
        service = 'alarm_arm_away';
        break;
      case 'disarmed':
        service = 'alarm_disarm';
        break;
      case 'partially_armed':
        throw new Error(this.homey.__('homealarm_partially_armed_not_supported'));
      default:
        break;
    }

    if (!service) {
      this.error('Invalid homealarm_state', value);
      return;
    }

    await this.server.callEntityService('alarm_control_panel', entityId, service);
  }

  private async onCapabilityTargetHumidity(value: number): Promise<void> {
    await this.server.callEntityService('humidifier', this.getEntityId('target_humidity'), 'set_humidity', {
      humidity: value,
    });
  }

  private async onCapabilityLocked(value: boolean): Promise<void> {
    await this.server.callEntityService('lock', this.getEntityId('locked'), value ? 'lock' : 'unlock');
  }
}
