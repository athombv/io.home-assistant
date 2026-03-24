import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/**
 * Entity update handler for humidifier entities. See https://developers.home-assistant.io/docs/core/entity/humidifier.
 */
export default class HumidifierEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('humidifier.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.handleOnOff(entityState, 'onoff');
    this.setCapabilityValueIfExists('measure_humidity', entityState.attributes.current_humidity);
    this.setCapabilityValueIfExists('target_humidity', entityState.attributes.target_humidity);
  }
}
