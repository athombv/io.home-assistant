import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

/** Lock states as defined by Home Assistant */
export enum LockState {
  JAMMED = 'jammed',
  OPENING = 'opening',
  LOCKING = 'locking',
  OPEN = 'open',
  UNLOCKING = 'unlocking',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

/**
 * Entity update handler for lock entities. See https://developers.home-assistant.io/docs/core/entity/lock.
 */
export default class LockEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('lock.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.setCapabilityValue('locked', entityState.state === LockState.LOCKED);
    this.setCapabilityValueIfExists('alarm_stuck', entityState.state === LockState.JAMMED);
  }
}
