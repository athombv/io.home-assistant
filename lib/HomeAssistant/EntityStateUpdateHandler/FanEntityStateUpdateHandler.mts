import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

const attributeMap: AttributeValueMapper = [
  { attribute: 'preset_mode', capability: 'fan_mode', mapper: (value?: string) => value?.toLowerCase() },
  { attribute: 'preset_mode', capability: 'aircleaner_mode', mapper: (value?: string) => value?.toLowerCase() },
  { attribute: 'percentage', capability: 'fan_speed', mapper: (value: number) => value / 100 },
];

/**
 * Entity update handler for fan entities. See https://developers.home-assistant.io/docs/core/entity/fan.
 */
export default class FanEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('fan.');
  }

  async handle(entityState: HassEntity): Promise<void> {
    this.mapAttributesToCapability(entityState, attributeMap);
    this.handleOnOff(entityState, 'onoff');
  }
}
