import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for switch entities. See https://developers.home-assistant.io/docs/core/entity/switch/.
 */
export default class SwitchEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('switch.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'socket');
    HaDeviceEntityMapper.setDeviceIcon(homeyDevice, 'plug');

    const currentOnOffCapabilities = homeyDevice.capabilities.filter(item => {
      return item.startsWith('onoff');
    });

    const entityIdWithoutSwitch = entityId.substring('switch.'.length);
    const capabilityId =
      currentOnOffCapabilities.length > 0 || !['sensor', 'plug', 'socket'].includes(homeyDevice.class ?? '')
        ? `onoff.${currentOnOffCapabilities.length}`
        : 'onoff';

    homeyDevice.capabilities.push(capabilityId);
    homeyDevice.capabilitiesOptions[capabilityId] = {
      entityId,
      title: friendlyName || entity.instance.attributes.device_class || entityIdWithoutSwitch,
    };
  }
}
