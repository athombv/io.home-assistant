import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/** Vacuum states as defined by Home Assistant in `VacuumActivity` */
export enum VacuumActivity {
  CLEANING = 'cleaning',
  DOCKED = 'docked',
  IDLE = 'idle',
  PAUSED = 'paused',
  RETURNING = 'returning',
  ERROR = 'error',
}

/**
 * Entity update handler for vacuum entities. See https://developers.home-assistant.io/docs/core/entity/vacuum.
 */
export default class VacuumEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('vacuum.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    let newState;
    switch (entityState.state) {
      case VacuumActivity.IDLE:
      case VacuumActivity.PAUSED:
        newState = 'stopped';
        break;

      case VacuumActivity.CLEANING:
        newState = 'cleaning';
        break;

      case VacuumActivity.DOCKED:
        newState = 'docked';
        break;

      case VacuumActivity.RETURNING:
      case VacuumActivity.ERROR:
        newState = 'stopped';
        break;

      default:
        newState = false;
    }

    if (!newState) {
      this.error(`Could not handle vacuum cleaner state: ${entityState.state}`);
      return;
    }

    this.setCapabilityValue('vacuumcleaner_state', newState);
    this.setCapabilityValue('onoff', entityState.state !== VacuumActivity.DOCKED);
    this.setCapabilityValueIfExists('docked', entityState.state === VacuumActivity.DOCKED);
  }
}
