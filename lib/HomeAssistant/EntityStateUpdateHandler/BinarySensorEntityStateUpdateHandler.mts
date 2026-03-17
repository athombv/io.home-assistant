import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

export default class BinarySensorEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('binary_sensor.');
  }

  async handle(entityState: HassEntity, capabilities: string[]): Promise<void> {
    const capability = this.ensureSingleCapability(capabilities);
    if (!capability) {
      return;
    }

    this.handleOnOff(entityState, capability);
  }
}
