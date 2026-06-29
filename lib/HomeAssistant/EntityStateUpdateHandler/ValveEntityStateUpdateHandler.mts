import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';
import { percentageToDecimal } from '../HaUnitConverter.mjs';

/**
 * Entity update handler for valve entities. See https://developers.home-assistant.io/docs/core/entity/valve.
 */
export default class ValveEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  protected override readonly attributeMap = [
    { attribute: 'is_closed', capability: 'onoff', mapper: (value: boolean): boolean => !value },
    { attribute: 'current_valve_position', capability: 'valve_position', mapper: percentageToDecimal },
  ];

  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('valve.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.mapAttributesToCapability(entityState, this.attributeMap);
  }
}
