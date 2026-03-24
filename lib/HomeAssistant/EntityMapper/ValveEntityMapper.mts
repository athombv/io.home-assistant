import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** As defined by HA */
enum ValveDeviceClass {
  WATER = 'water',
  GAS = 'gas',
}

/**
 * Mapper for valve entities. See https://developers.home-assistant.io/docs/core/entity/valve.
 */
export default class ValveEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('valve.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    _friendlyName: string | undefined,
  ): void {
    if (entity.instance.attributes.device_class === ValveDeviceClass.WATER) {
      HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'watervalve');
    }

    // Use position when available, otherwise use onoff
    if (entity.instance.attributes.reports_position) {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'valve_position');
    } else {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'onoff');
    }
  }
}
