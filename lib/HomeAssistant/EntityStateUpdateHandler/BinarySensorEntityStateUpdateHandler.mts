import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

const invertedCapabilities: string[] = ['alarm_connectivity', 'garagedoor_closed', 'locked', 'windowcoverings_closed'];

export default class BinarySensorEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('binary_sensor.');
  }

  public async handle(entityState: HassEntity, capabilities: string[]): Promise<void> {
    const capability = this.ensureSingleCapability(capabilities);
    if (!capability) {
      return;
    }

    this.handleOnOff(entityState, capability, invertedCapabilities.includes(capability));
  }
}
