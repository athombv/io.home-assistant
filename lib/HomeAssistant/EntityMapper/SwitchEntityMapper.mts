import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/**
 * Mapper for switch entities. See https://developers.home-assistant.io/docs/core/entity/switch/.
 */
export default class SwitchEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('switch.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : 'socket';
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : 'plug';
    const currentOnOffCapabilities = homeyDevice.capabilities.filter(item => {
      return item.startsWith('onoff');
    });
    const entityIdWithoutSwitch = entityId.substring('switch.'.length);
    const capabilityId =
      currentOnOffCapabilities.length > 0 || !['sensor', 'plug', 'socket'].includes(homeyDevice.class)
        ? `onoff.${currentOnOffCapabilities.length}`
        : 'onoff';
    homeyDevice.capabilities.push(capabilityId);
    homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
    homeyDevice.capabilitiesOptions[capabilityId].title =
      friendlyName || entity.instance.attributes['device_class'] || entityIdWithoutSwitch;
    homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
  }
}
