import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

const attributeMap: AttributeValueMapper = [
  { attribute: 'is_closed', capability: 'onoff' },
  { attribute: 'current_valve_position', capability: 'valve_position', mapper: (value: number) => value / 100 },
];

/**
 * Entity update handler for valve entities. See https://developers.home-assistant.io/docs/core/entity/lock.
 */
export default class ValveEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('valve.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.mapAttributesToCapability(entityState, attributeMap);
  }
}
