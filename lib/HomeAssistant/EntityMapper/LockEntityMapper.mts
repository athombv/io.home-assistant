import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for lock entities. See https://developers.home-assistant.io/docs/core/entity/lock.
 */
export default class LockEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('lock.');
  }

  public map(
    entityId: string,
    _entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    _friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'lock');
    HaDeviceEntityMapper.setDeviceIcon(homeyDevice, 'lock');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'locked');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'alarm_stuck');
  }
}
