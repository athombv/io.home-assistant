import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by Home Assistant in `VacuumEntityFeature` */
export enum VacuumEntityFeature {
  /** @deprecated not supported by StateVacuumEntity */
  TURN_ON = 1,
  /** @deprecated not supported by StateVacuumEntity */
  TURN_OFF = 2,
  PAUSE = 4,
  STOP = 8,
  RETURN_HOME = 16,
  FAN_SPEED = 32,
  BATTERY = 64,
  /** @deprecated not supported by StateVacuumEntity */
  STATUS = 128,
  SEND_COMMAND = 256,
  LOCATE = 512,
  CLEAN_SPOT = 1024,
  MAP = 2048,
  STATE = 4096, // Must be set by vacuum platforms derived from StateVacuumEntity
  START = 8192,
  CLEAN_AREA = 16384,
}

const SUPPORTED_FEATURES: Partial<Record<VacuumEntityFeature, string[]>> = {
  [VacuumEntityFeature.STATUS]: ['vacuumcleaner_state'],
  [VacuumEntityFeature.STATE]: ['vacuumcleaner_state'],
};

/**
 * Mapper for vacuum entities. See https://developers.home-assistant.io/docs/core/entity/vacuum.
 */
export default class VacuumEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('vacuum.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'vacuumcleaner';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'vacuum-cleaner';

    homeyDevice.capabilities.push('onoff');
    homeyDevice.capabilitiesOptions['onoff'] = homeyDevice.capabilitiesOptions['onoff'] || {};
    homeyDevice.capabilitiesOptions['onoff'].entityId = entityId;

    if (!entity.instance.attributes) {
      return;
    }

    HaDeviceEntityMapper.mapFeatureMask(entityId, entity, homeyDevice, friendlyName, SUPPORTED_FEATURES);
  }
}
