import type { HassEntity } from 'home-assistant-js-websocket';
import { convertUnits } from '../HaUnitConverter.mjs';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/**
 * Entity update handler for sensor entities. See https://developers.home-assistant.io/docs/core/entity/sensor/.
 */
export default class SensorEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('sensor.');
  }

  async handle(entityState: HassEntity, capabilities: string[]): Promise<void> {
    const capability = this.ensureSingleCapability(capabilities);
    if (!capability) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capabilityValue: any = entityState.state;
    if (
      capability.startsWith('measure_') ||
      capability.startsWith('meter_') ||
      capability.startsWith('hass-number.')
    ) {
      capabilityValue = parseFloat(capabilityValue);

      // Convert temperature to Celsius
      if (capability.includes('measure_temperature')) {
        if (entityState.attributes.unit_of_measurement === 'K') {
          capabilityValue = capabilityValue - 273.15;
        } else if (entityState.attributes.unit_of_measurement === '°F') {
          capabilityValue = ((capabilityValue - 32) * 5) / 9;
        }
      }
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
