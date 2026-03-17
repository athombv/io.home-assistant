import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/**
 * Entity update handler for switch entities. See https://developers.home-assistant.io/docs/core/entity/switch/.
 */
export default class SwitchEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('switch.');
  }

  async handle(entityState: HassEntity, capabilities: string[]): Promise<void> {
    for (const capability of capabilities) {
      this.handleOnOff(entityState, capability);
    }
  }
}
