import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

const ATTRIBUTE_MAP: AttributeValueMapper = [
  { attribute: 'preset_mode', capability: 'fan_mode', mapper: (value?: string) => value?.toLowerCase() },
  { attribute: 'preset_mode', capability: 'aircleaner_mode', mapper: (value?: string) => value?.toLowerCase() },
  { attribute: 'percentage', capability: 'fan_speed', mapper: (value: number) => value / 100 },
];

/**
 * Entity update handler for fan entities. See https://developers.home-assistant.io/docs/core/entity/fan.
 */
export default class FanEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('fan.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.mapAttributesToCapability(entityState, ATTRIBUTE_MAP);
    this.handleOnOff(entityState, 'onoff');
  }
}
