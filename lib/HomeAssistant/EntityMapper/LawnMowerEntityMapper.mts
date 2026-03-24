import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';


/**
 * Mapper for lawn mower entities. See https://developers.home-assistant.io/docs/core/entity/lawn-mower.
 */
export default class LawnMowerEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('lawn_mower.');
  }

  public map(
    entityId: string,
    _entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    _friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'lawnmower');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'lawnmower_state');
  }
}
