import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';
import { lowerCase, percentageToDecimal } from '../HaUnitConverter.mjs';

/**
 * Entity update handler for fan entities. See https://developers.home-assistant.io/docs/core/entity/fan.
 */
export default class FanEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  protected override readonly attributeMap = [
    { attribute: 'preset_mode', capability: 'fan_mode', mapper: lowerCase },
    { attribute: 'preset_mode', capability: 'aircleaner_mode', mapper: lowerCase },
    { attribute: 'percentage', capability: 'fan_speed', mapper: percentageToDecimal },
  ];

  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('fan.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.mapAttributesToCapability(entityState, this.attributeMap);
    this.handleOnOff(entityState, 'onoff');
  }
}
