import type { HassEntity } from 'home-assistant-js-websocket';
import type HomeAssistantDevice from '../../HomeAssistantDevice.mjs';
import type HomeAssistantServer from '../../HomeAssistantServer.mjs';
import type { EntityStateUpdateHandler } from '../HaEntityStateUpdateHandler.mjs';

export type AttributeValueMapper = Array<{
  attribute: string;
  capability: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapper?: (value: any) => any;
}>;

export default abstract class AbstractEntityStateUpdateHandler implements EntityStateUpdateHandler {
  constructor(
    protected device: HomeAssistantDevice,
    protected server: HomeAssistantServer,
  ) {}

  abstract supportsEntityId(entityId: string): boolean;

  abstract handle(entityState: HassEntity, capabilities: string[]): Promise<void>;

  protected hasCapability(capabilityId: string): boolean {
    return this.device.hasCapability(capabilityId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getCapabilityValue(capabilityId: string): any {
    return this.device.getCapabilityValue(capabilityId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected setCapabilityValue(capabilityId: string, value: any): void {
    if (!this.hasCapability(capabilityId)) {
      this.error(`Unavailable capability requested: ${capabilityId}`);
      return;
    }

    this.device.setCapabilityValue(capabilityId, value).catch(this.error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected setCapabilityValueIfExists(capabilityId: string, value: any): void {
    if (!this.hasCapability(capabilityId)) {
      return;
    }

    this.device.setCapabilityValue(capabilityId, value).catch(this.error);
  }

  protected mapAttributesToCapability(entityState: HassEntity, attributeMap: AttributeValueMapper): void {
    for (const definition of attributeMap) {
      if (typeof entityState.attributes[definition.attribute] === 'undefined') {
        continue;
      }

      const mapper = definition.mapper ?? ((value): unknown => value);

      this.setCapabilityValueIfExists(definition.capability, mapper(entityState.attributes[definition.attribute]));
    }
  }

  protected ensureSingleCapability(capabilities: string[]): string | null {
    if (capabilities.length !== 1) {
      this.error(
        `[${this.constructor.name}] Entity has been mapped to ${capabilities.length} capabilities, but exactly 1 expected`,
      );
      return null;
    }

    return capabilities[0];
  }

  protected handleOnOff(entityState: HassEntity, capability: string, invert = false): void {
    let newValue: boolean;
    switch (entityState.state) {
      case 'on':
        newValue = true;
        break;
      case 'off':
        newValue = false;
        break;
      default:
        this.error(`Unsupported onoff entity state value: ${entityState.state}`);
        return;
    }

    this.setCapabilityValue(capability, invert ? !newValue : newValue);
  }

  protected log(...args: unknown[]): void {
    this.device.log(...args);
  }

  protected error(...args: unknown[]): void {
    this.device.error(...args);
  }
}
