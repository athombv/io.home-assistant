import type { HassEntity } from 'home-assistant-js-websocket';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

/** HVAC actions as defined by Home Assistant */
export enum HVACMode {
  OFF = 'off',
  HEAT = 'heat',
  COOL = 'cool',
  HEAT_COOL = 'heat_cool',
  AUTO = 'auto',
  DRY = 'dry',
  FAN_ONLY = 'fan_only',
}

const ATTRIBUTE_MAP: AttributeValueMapper = [
  { attribute: 'current_humidity', capability: 'measure_humidity' },
  { attribute: 'current_temperature', capability: 'measure_temperature' },
  { attribute: 'target_humidity', capability: 'target_humidity' },
  { attribute: 'target_temperature', capability: 'target_temperature' },
  { attribute: 'target_temperature_high', capability: 'target_temperature_max' },
  { attribute: 'target_temperature_low', capability: 'target_temperature_min' },
];

enum SwingMode {
  ON = 'on',
  OFF = 'off',
  BOTH = 'both',
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

enum FanMode {
  ON = 'on',
  OFF = 'off',
  AUTO = 'auto',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  TOP = 'top',
  MIDDLE = 'middle',
  FOCUS = 'focus',
  DIFFUSE = 'diffuse',
}

/**
 * Entity update handler for climate entities. See https://developers.home-assistant.io/docs/core/entity/climate.
 */
export default class ClimateEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('climate.');
  }

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.setCapabilityValueIfExists('onoff', entityState.state !== HVACMode.OFF);
    this.mapAttributesToCapability(entityState, ATTRIBUTE_MAP);

    switch (entityState.state) {
      case HVACMode.HEAT:
        this.setCapabilityValueIfExists('thermostat_mode', 'heat');
        break;
      case HVACMode.COOL:
        this.setCapabilityValueIfExists('thermostat_mode', 'cool');
        break;
      case HVACMode.HEAT_COOL:
      case HVACMode.AUTO:
        this.setCapabilityValueIfExists('thermostat_mode', 'auto');
        break;
      case HVACMode.OFF:
      case HVACMode.DRY:
      case HVACMode.FAN_ONLY:
        this.setCapabilityValueIfExists('thermostat_mode', 'off');
        break;
      default:
        this.log(`Unknown climate state: ${entityState.state}`);
        break;
    }

    let verticalEnabled = true;
    let horizontalEnabled = false;

    if (this.hasCapability('onoff.swing_mode_horizontal')) {
      // Separate horizontal swing control enabled
      horizontalEnabled = entityState.attributes.swing_horizontal_mode === SwingMode.ON;

      switch (entityState.attributes.swing_mode) {
        case SwingMode.ON:
        case SwingMode.BOTH:
        case SwingMode.VERTICAL:
          verticalEnabled = true;
          break;
        case SwingMode.OFF:
        case SwingMode.HORIZONTAL:
        default:
          verticalEnabled = false;
          break;
      }
    } else if (this.hasCapability('onoff.swing_mode')) {
      switch (entityState.attributes.swing_mode) {
        case SwingMode.ON:
        case SwingMode.BOTH:
        case SwingMode.VERTICAL:
        case SwingMode.HORIZONTAL:
          verticalEnabled = true;
          break;
        case SwingMode.OFF:
        default:
          verticalEnabled = false;
          break;
      }
    }

    this.setCapabilityValueIfExists('onoff.swing_mode', verticalEnabled);
    this.setCapabilityValueIfExists('onoff.swing_mode_horizontal', horizontalEnabled);

    let newSwingMode: string | undefined;
    if (verticalEnabled && horizontalEnabled) {
      newSwingMode = 'both';
    } else if (horizontalEnabled) {
      newSwingMode = 'horizontal';
    } else if (verticalEnabled) {
      newSwingMode = 'vertical';
    }

    if (newSwingMode) {
      this.setCapabilityValue('swing_mode', newSwingMode);
    }

    if (this.hasCapability('fan_mode')) {
      let newFanMode: string | undefined;
      switch (entityState.attributes.fan_mode) {
        case FanMode.OFF:
          newFanMode = 'off';
          break;
        case FanMode.AUTO:
          newFanMode = 'auto';
          break;
        case FanMode.LOW:
        case FanMode.MEDIUM:
        case FanMode.HIGH:
        case FanMode.TOP:
        case FanMode.MIDDLE:
        case FanMode.FOCUS:
        case FanMode.DIFFUSE:
          this.log(`Fan mode ${entityState.attributes.fan_mode} not supported`);
          break;
        default:
          newFanMode = 'on';
          break;
      }

      if (newFanMode) {
        this.setCapabilityValue('fan_mode', newFanMode);
      }
    }
  }
}
