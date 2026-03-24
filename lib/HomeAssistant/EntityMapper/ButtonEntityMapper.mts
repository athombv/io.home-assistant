import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for button entities. See https://developers.home-assistant.io/docs/core/entity/button.
 */
export default class ButtonEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('button.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, entityId, {
      title: friendlyName || entity.instance.attributes.device_class || entityId.substring('button.'.length),
    });
  }
}
