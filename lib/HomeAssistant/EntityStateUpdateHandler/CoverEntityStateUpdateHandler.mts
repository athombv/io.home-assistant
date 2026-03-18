import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

/** Cover states as defined by Home Assistant in `CoverState` */
export enum CoverState {
  CLOSED = 'closed',
  CLOSING = 'closing',
  OPEN = 'open',
  OPENING = 'opening',
}

const attributeMap: AttributeValueMapper = [
  { attribute: 'current_position', capability: 'windowcoverings_set', mapper: (value: number) => value / 100 },
  {
    attribute: 'current_tilt_position',
    capability: 'windowcoverings_tilt_set',
    mapper: (value: number) => value / 100,
  },
];

/**
 * Entity update handler for cover entities. See https://developers.home-assistant.io/docs/core/entity/cover.
 */
export default class CoverEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('cover.');
  }

  public async handle(entityState: HassEntity): Promise<void> {
    switch (entityState.state) {
      case CoverState.CLOSED:
        this.setCapabilityValueIfExists('windowcoverings_state', 'idle');
        this.setCapabilityValueIfExists('windowcoverings_closed', true);
        this.setCapabilityValueIfExists('garagedoor_closed', true);
        break;

      case CoverState.OPEN:
        this.setCapabilityValueIfExists('windowcoverings_state', 'idle');
        this.setCapabilityValueIfExists('windowcoverings_closed', false);
        this.setCapabilityValueIfExists('garagedoor_closed', false);
        break;

      case CoverState.CLOSING:
        this.setCapabilityValueIfExists('windowcoverings_state', 'down');
        break;

      case CoverState.OPENING:
        this.setCapabilityValueIfExists('windowcoverings_state', 'up');
        break;

      default:
        this.error(`Unknown cover state: ${entityState.state}`);
        break;
    }

    this.mapAttributesToCapability(entityState, attributeMap);
  }
}
