import type { HassEntity } from 'home-assistant-js-websocket';
import { convertUnits } from '../HaUnitConverter.mjs';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/**
 * Entity update handler for sensor entities. See https://developers.home-assistant.io/docs/core/entity/sensor/.
 */
export default class SensorEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('sensor.');
  }

  public async handle(entityState: HassEntity, capabilities: string[]): Promise<void> {
    const capability = this.ensureSingleCapability(capabilities);
    if (!capability) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capabilityValue: any = entityState.state;
    if (capability.startsWith('measure_') || capability.startsWith('meter_') || capability.startsWith('hass-number.')) {
      capabilityValue = parseFloat(capabilityValue);
    } else if (capability.startsWith('hass-string.')) {
      capabilityValue = capabilityValue.toString();
    } else if (capability.startsWith('hass-boolean.')) {
      capabilityValue = !!capabilityValue;
    }

    // Convert the units
    capabilityValue = convertUnits(this.device, capability, entityState, capabilityValue);

    this.setCapabilityValue(capability, capabilityValue);
  }
}
