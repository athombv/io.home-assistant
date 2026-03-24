import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

enum HumidifierDeviceClass {
  HUMIDIFIER = 'humidifier',
  DEHUMIDIFIER = 'dehumidifier',
}

/**
 * Mapper for humidifier entities. See https://developers.home-assistant.io/docs/core/entity/humidifier.
 */
export default class HumidifierEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('humidifier.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    _friendlyName: string | undefined,
  ): void {
    const deviceClass = entity.instance.attributes.device_class ?? null;
    HaDeviceEntityMapper.setDeviceClass(
      homeyDevice,
      deviceClass === HumidifierDeviceClass.DEHUMIDIFIER ? 'dehumidifier' : 'humidifier',
    );

    // Add onoff capability
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'onoff');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'measure_humidity');
    HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'target_humidity');
  }
}
