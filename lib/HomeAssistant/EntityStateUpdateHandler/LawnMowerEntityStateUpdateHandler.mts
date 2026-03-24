import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/** Lawn mower states as defined by Home Assistant */
export enum LawnMowerActivity {
  ERROR = 'error',
  PAUSED = 'paused',
  MOWING = 'mowing',
  DOCKED = 'docked',
  RETURNING = 'returning',
}

/**
 * Entity update handler for lawn mower entities. See https://developers.home-assistant.io/docs/core/entity/lawn-mower.
 */
export default class LawnMowerEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('lawn_mower.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    let newState;
    switch (entityState.state) {
      case LawnMowerActivity.MOWING:
      case LawnMowerActivity.RETURNING:
        newState = 'mowing';
        break;

      case LawnMowerActivity.DOCKED:
        newState = 'docked';
        break;

      case LawnMowerActivity.PAUSED:
        newState = 'paused';
        break;

      case LawnMowerActivity.ERROR:
        newState = 'error';
        break;

      default:
        newState = false;
    }

    if (!newState) {
      this.error(`Could not handle lawn mower state: ${entityState.state}`);
      return;
    }

    this.setCapabilityValue('lawnmower_state', newState);
    this.setCapabilityValueIfExists('docked', entityState.state === LawnMowerActivity.DOCKED);
  }
}
