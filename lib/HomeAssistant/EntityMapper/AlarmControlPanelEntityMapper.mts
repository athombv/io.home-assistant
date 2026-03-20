import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by Home Assistant */
export enum AlarmControlPanelEntityFeature {
  ARM_HOME = 1,
  ARM_AWAY = 2,
  ARM_NIGHT = 4,
  TRIGGER = 8,
  ARM_CUSTOM_BYPASS = 16,
  ARM_VACATION = 32,
}

const SUPPORTED_FEATURES: Partial<Record<AlarmControlPanelEntityFeature, string[]>> = {
  [AlarmControlPanelEntityFeature.TRIGGER]: ['alarm_home_alarm_triggered'],
};

/**
 * Mapper for alarm-control-panel entities. See https://developers.home-assistant.io/docs/core/entity/alarm-control-panel.
 */
export default class AlarmControlPanelEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('alarm_control_panel.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'homealarm');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'homealarm_state');
    HaDeviceEntityMapper.mapFeatureMask(entityId, entity, homeyDevice, friendlyName, SUPPORTED_FEATURES);
  }
}
