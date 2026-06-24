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

    // Generic onoff
    this.registerCapabilityListenerIfAvailable('onoff', this.onCapabilityOnOff.bind(this));

    // Extra onoff
    this.getOnOffCapabilities().forEach(capabilityId => {
      this.registerCapabilityListener(capabilityId, async (value, options) => {
        await this.onCapabilityOnOff(value, options, capabilityId);
      });
    });

    // Button
    this.getButtonCapabilities().forEach(capabilityId => {
      this.registerCapabilityListener(capabilityId, async () => await this.onCapabilityButton(capabilityId));
    });

    // Light
    this.registerCapabilityListenerIfAvailable('dim', this.onCapabilityDim.bind(this));
    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      this.registerMultipleCapabilityListener(
        ['light_hue', 'light_saturation'],
        this.onCapabilityLightHueSaturation.bind(this),
      );
    }
    this.registerCapabilityListenerIfAvailable('light_temperature', this.onCapabilityLightTemperature.bind(this));
    this.registerCapabilityListenerIfAvailable('light_mode', this.onCapabilityLightMode.bind(this));

    // Speaker
    this.registerCapabilityListenerIfAvailable('speaker_playing', this.onCapabilitySpeakerPlaying.bind(this));
    this.registerCapabilityListenerIfAvailable('speaker_next', async (_, options) => {
      await this.onCapabilitySpeakerService('media_next_track', options, 'speaker_next');
    });
    this.registerCapabilityListenerIfAvailable('speaker_prev', async (_, options) => {
      await this.onCapabilitySpeakerService('media_previous_track', options, 'speaker_prev');
    });
    this.registerCapabilityListenerIfAvailable('speaker_repeat', this.onCapabilityRepeatSet.bind(this));
    this.registerCapabilityListenerIfAvailable('speaker_shuffle', this.onCapabilityShuffleSet.bind(this));
    this.registerCapabilityListenerIfAvailable('speaker_stop', async (_, options) => {
      await this.onCapabilitySpeakerService('media_stop', options, 'speaker_stop');
    });

    // Volume
    this.registerCapabilityListenerIfAvailable('volume_up', async (_, options: unknown) => {
      await this.onCapabilitySpeakerService('volume_up', options, 'volume_up');
    });
    this.registerCapabilityListenerIfAvailable('volume_down', async (_, options) => {
      await this.onCapabilitySpeakerService('volume_down', options, 'volume_down');
    });
    this.registerCapabilityListenerIfAvailable('volume_set', this.onCapabilityVolumeSet.bind(this));
    this.registerCapabilityListenerIfAvailable('volume_mute', this.onCapabilityVolumeMute.bind(this));

    // Window coverings
    this.registerCapabilityListenerIfAvailable('windowcoverings_state', async (value, options) => {
      const coverServiceId = this.getCoverServiceId(value);
      await this.onCapabilityCoveringService(coverServiceId, options, 'windowcoverings_state');
    });
    this.registerCapabilityListenerIfAvailable('windowcoverings_tilt_up', async (value, options) => {
      await this.onCapabilityCoveringService('open_cover_tilt', options, 'windowcoverings_tilt_up');
    });
    this.registerCapabilityListenerIfAvailable('windowcoverings_tilt_down', async (value, options) => {
      await this.onCapabilityCoveringService('close_cover_tilt', options, 'windowcoverings_tilt_down');
    });
    this.registerCapabilityListenerIfAvailable('windowcoverings_tilt_set', this.onCapabilityCoveringTiltSet.bind(this));
    this.registerCapabilityListenerIfAvailable('windowcoverings_closed', async (value, options) => {
      await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'windowcoverings_closed');
    });
    this.registerCapabilityListenerIfAvailable('windowcoverings_set', this.onCapabilityCoveringSet.bind(this));

    // Garage door
    this.registerCapabilityListenerIfAvailable('garagedoor_closed', async (value, options) => {
      await this.onCapabilityCoveringService(value ? 'close_cover' : 'open_cover', options, 'garagedoor_closed');
    });

    // Fan
    this.registerCapabilityListenerIfAvailable('fan_speed', this.onCapabilityFanSpeedSet.bind(this));
    this.registerCapabilityListenerIfAvailable('fan_oscillate', this.onCapabilityFanOscillateSet.bind(this));
    this.registerCapabilityListenerIfAvailable('fan_mode', this.onCapabilityFanModeSet.bind(this));

    // Air cleaner
    this.registerCapabilityListenerIfAvailable('aircleaner_mode', this.onCapabilityAirCleanerModeSet.bind(this));

    // Climate
    this.registerCapabilityListenerIfAvailable('thermostat_mode', this.onCapabilityThermostatModeSet.bind(this));
    this.registerCapabilityListenerIfAvailable('target_humidity', this.onCapabilityTargetHumiditySet.bind(this));
    this.registerCapabilityListenerIfAvailable('target_temperature', this.onCapabilityTargetTemperatureSet.bind(this));
    this.registerCapabilityListenerIfAvailable(
      'target_temperature_max',
      this.onCapabilityTargetTemperatureMaxSet.bind(this),
    );
    this.registerCapabilityListenerIfAvailable(
      'target_temperature_min',
      this.onCapabilityTargetTemperatureMinSet.bind(this),
    );

    // Vacuum cleaner
    this.registerCapabilityListenerIfAvailable(
      'vacuumcleaner_state',
      this.onCapabilityVacuumCleanerStateSet.bind(this),
    );

    // Home alarm
    this.registerCapabilityListenerIfAvailable('homealarm_state', this.onCapabilityHomealarmStateSet.bind(this));

    // Lawn mower
    this.registerCapabilityListenerIfAvailable('mower_state', this.onCapabilityMowerState.bind(this));

    // Lock
    this.registerCapabilityListenerIfAvailable('locked', this.onCapabilityLockedSet.bind(this));

    // Valve
    this.registerCapabilityListenerIfAvailable('valve_position', this.onCapabilityValvePositionSet.bind(this));

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
  private registerCapabilityListenerIfAvailable(capabilityId: string, listener: Homey.Device.CapabilityCallback): void {
    if (!this.hasCapability(capabilityId)) {
      return;
    }

    this.registerCapabilityListener(capabilityId, listener);
  }

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

  private getEntityDomain(entityId: string): string {
    return entityId.split('.')[0];
  }

  private getOnOffCapabilities(): string[] {
    return this.getCapabilities().filter(item => item.startsWith('onoff.'));
  }

  private getButtonCapabilities(): string[] {
    return this.getCapabilities().filter(item => item.startsWith('button.'));
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
    const domain = this.getEntityDomain(entityId);

    switch (domain) {
      case 'climate':
        {
          switch (capabilityId) {
            case 'onoff.swing_mode':
              return await this.server.callEntityService(domain, entityId, 'set_swing_mode', {
                swing_mode: value ? 'on' : 'off',
              });
            case 'onoff.swing_mode_horizontal':
              return await this.server.callEntityService(domain, entityId, 'set_swing_horizontal_mode', {
                swing_horizontal_mode: value ? 'on' : 'off',
              });
            default:
              return await this.server.callEntityService(domain, entityId, value ? 'turn_on' : 'turn_off');
          }
        }
        break;
      case 'vacuum':
        return await this.onCapabilityVacuumCleanerStateSet(value ? 'cleaning' : 'docked');
      case 'valve':
        return await this.server.callEntityService(domain, entityId, value ? 'open_valve' : 'close_valve');
      case 'fan':
      case 'humidifier':
      case 'light':
      case 'switch':
        return await this.server.callEntityService(domain, entityId, value ? 'turn_on' : 'turn_off');
      default:
        throw new Error(`Unsupported domain: ${domain}`);
    }
  }

  private async onCapabilityButton(capabilityId: string): Promise<void> {
    return await this.server.callEntityService('button', this.getEntityId(capabilityId), 'press');
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
    const domain = this.getEntityDomain(entityId);

    await this.server.callEntityService(domain, entityId, value ? 'media_play' : 'media_pause');
  }

  private async onCapabilitySpeakerService(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'onoff');
    const domain = this.getEntityDomain(entityId);

    await this.server.callEntityService(domain, entityId, value);
  }

  private async onCapabilityShuffleSet(value: boolean, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'speaker_shuffle');
    const domain = this.getEntityDomain(entityId);

    await this.server.callEntityService(domain, entityId, 'shuffle_set', {
      shuffle: value,
    });
  }

  private async onCapabilityRepeatSet(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'speaker_repeat');
    const domain = this.getEntityDomain(entityId);

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
    const domain = this.getEntityDomain(entityId);

    await this.server.callEntityService(domain, entityId, 'volume_set', {
      volume_level: value,
    });
  }

  private async onCapabilityVolumeMute(value: boolean, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'volume_mute');
    const domain = this.getEntityDomain(entityId);

    await this.server.callEntityService(domain, entityId, 'volume_set', {
      is_volume_muted: value,
    });
  }

  private async onCapabilityCoveringService(value: string, options: unknown, capabilityId?: string): Promise<void> {
    const entityId = this.getEntityId(capabilityId || 'windowcoverings_state');
    const domain = this.getEntityDomain(entityId);

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

  private async onCapabilityThermostatModeSet(value: string): Promise<void> {
    await this.server.callEntityService('climate', this.getEntityId('thermostat_mode'), 'set_hvac_mode', {
      hvac_mode: value,
    });
  }

  private async onCapabilityTargetHumiditySet(value: number): Promise<void> {
    const entityId = this.getEntityId('target_humidity');
    const domain = this.getEntityDomain(entityId);

    switch (domain) {
      case 'climate':
      case 'humidifier':
        await this.server.callEntityService(domain, entityId, 'set_humidity', {
          humidity: value,
        });
        break;
      default:
        throw new Error(`Unsupported domain: ${domain}`);
    }
  }

  private async onCapabilityTargetTemperatureSet(value: number): Promise<void> {
    await this.server.callEntityService('climate', this.getEntityId('target_temperature'), 'set_temperature', {
      temperature: value,
    });
  }

  private async onCapabilityTargetTemperatureMaxSet(value: number): Promise<void> {
    await this.server.callEntityService('climate', this.getEntityId('target_temperature_max'), 'set_temperature', {
      target_temp_high: value,
    });
  }

  private async onCapabilityTargetTemperatureMinSet(value: number): Promise<void> {
    await this.server.callEntityService('climate', this.getEntityId('target_temperature_min'), 'set_temperature', {
      target_temp_low: value,
    });
  }

  private async onCapabilityMowerState(value: string): Promise<void> {
    let service;
    switch (value) {
      case 'mowing':
        service = 'start_mowing';
        break;
      case 'docked':
        service = 'dock';
        break;
      case 'paused':
        service = 'pause';
        break;
      case 'error':
        throw new Error(this.homey.__('lawnmower_state_error_not_supported'));
      default:
        break;
    }

    if (!service) {
      this.error('Invalid lawnmower_state', value);
      return;
    }

    await this.server.callEntityService('lawn_mower', this.getEntityId('mower_state'), service);
  }

  private async onCapabilityLockedSet(value: boolean): Promise<void> {
    await this.server.callEntityService('lock', this.getEntityId('locked'), value ? 'lock' : 'unlock');
  }

  private async onCapabilityValvePositionSet(value: number): Promise<void> {
    await this.server.callEntityService('valve', this.getEntityId('valve_position'), 'set_valve_position', {
      position: value > 0 ? value * 100 : 0,
    });
  }
}
