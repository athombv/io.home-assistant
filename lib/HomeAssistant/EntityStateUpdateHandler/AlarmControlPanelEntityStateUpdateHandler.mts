import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler from './AbstractEntityStateUpdateHandler.mjs';

export enum AlarmControlPanelState {
  DISARMED = 'disarmed',
  ARMED_HOME = 'armed_home',
  ARMED_AWAY = 'armed_away',
  ARMED_NIGHT = 'armed_night',
  ARMED_VACATION = 'armed_vacation',
  ARMED_CUSTOM_BYPASS = 'armed_custom_bypass',
  PENDING = 'pending',
  ARMING = 'arming',
  DISARMING = 'disarming',
  TRIGGERED = 'triggered',
}

/**
 * Entity update handler for alarm-control-panel entities. See https://developers.home-assistant.io/docs/core/entity/alarm-control-panel.
 */
export default class AlarmControlPanelEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('alarm_control_panel.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    let newState;
    switch (entityState.state) {
      case AlarmControlPanelState.DISARMED:
        newState = 'disarmed';
        break;

      case AlarmControlPanelState.ARMED_AWAY:
      case AlarmControlPanelState.ARMED_VACATION:
        newState = 'armed';
        break;

      case AlarmControlPanelState.ARMED_HOME:
      case AlarmControlPanelState.ARMED_NIGHT:
      case AlarmControlPanelState.ARMED_CUSTOM_BYPASS:
        newState = 'partially_armed';
        break;

      case AlarmControlPanelState.PENDING:
      case AlarmControlPanelState.ARMING:
      case AlarmControlPanelState.DISARMING:
      case AlarmControlPanelState.TRIGGERED:
        // Ignore these states
        break;
    }

    if (newState) {
      this.setCapabilityValue('homealarm_state', newState);
    }

    this.setCapabilityValueIfExists(
      'alarm_home_alarm_triggered',
      entityState.state === AlarmControlPanelState.TRIGGERED,
    );
  }
}
