import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Device classes as defined by Home Assistant in `BinarySensorDeviceClass` */
export enum BinarySensorDeviceClass {
  BATTERY = 'battery', // On means low, Off means normal
  BATTERY_CHARGING = 'battery_charging', // On means charging, Off means not charging
  CO = 'carbon_monoxide', // On means carbon monoxide detected, Off means no carbon monoxide (clear)
  COLD = 'cold', // On means cold, Off means normal
  CONNECTIVITY = 'connectivity', // On means connected, Off means disconnected
  DOOR = 'door', // On means open, Off means closed
  GARAGE_DOOR = 'garage_door', // On means open, Off means closed
  GAS = 'gas', // On means gas detected, Off means no gas (clear)
  HEAT = 'heat', // On means hot, Off means normal
  LIGHT = 'light', // On means light detected, Off means no light
  LOCK = 'lock', // On means open (unlocked), Off means closed (locked)
  MOISTURE = 'moisture', // On means wet, Off means dry
  MOTION = 'motion', // On means motion detected, Off means no motion (clear)
  MOVING = 'moving', // On means moving, Off means not moving (stopped)
  OCCUPANCY = 'occupancy', // On means occupied, Off means not occupied (clear)
  OPENING = 'opening', // On means open, Off means closed
  PLUG = 'plug', // On means plugged in, Off means unplugged
  POWER = 'power', // On means power detected, Off means no power
  PRESENCE = 'presence', // On means home, Off means away
  PROBLEM = 'problem', // On means problem detected, Off means no problem (OK)
  RUNNING = 'running', // On means running, Off means not running
  SAFETY = 'safety', // On means unsafe, Off means safe
  SMOKE = 'smoke', // On means smoke detected, Off means no smoke (clear)
  SOUND = 'sound', // On means sound detected, Off means no sound (clear)
  TAMPER = 'tamper', // On means tampering detected, Off means no tampering (clear)
  UPDATE = 'update', // On means update available, Off means up-to-date
  VIBRATION = 'vibration', // On means vibration detected, Off means no vibration
  WINDOW = 'window', // On means open, Off means closed
}

const CAPABILITY_MAP: Partial<Record<BinarySensorDeviceClass, string>> = {
  [BinarySensorDeviceClass.BATTERY]: 'alarm_battery',
  [BinarySensorDeviceClass.BATTERY_CHARGING]: 'alarm_charging', // todo: custom_capability
  [BinarySensorDeviceClass.CO]: 'alarm_co',
  [BinarySensorDeviceClass.COLD]: 'alarm_cold',
  [BinarySensorDeviceClass.CONNECTIVITY]: 'alarm_connectivity',
  [BinarySensorDeviceClass.DOOR]: 'alarm_contact',
  [BinarySensorDeviceClass.GARAGE_DOOR]: 'garagedoor_closed',
  [BinarySensorDeviceClass.GAS]: 'alarm_gas',
  [BinarySensorDeviceClass.HEAT]: 'alarm_heat',
  [BinarySensorDeviceClass.LIGHT]: 'alarm_light',
  [BinarySensorDeviceClass.LOCK]: 'locked',
  [BinarySensorDeviceClass.MOISTURE]: 'alarm_moisture',
  [BinarySensorDeviceClass.MOTION]: 'alarm_motion',
  [BinarySensorDeviceClass.MOVING]: 'alarm_generic',
  [BinarySensorDeviceClass.OCCUPANCY]: 'alarm_occupancy',
  [BinarySensorDeviceClass.OPENING]: 'alarm_open',
  [BinarySensorDeviceClass.PLUG]: 'alarm_plugged_in', // todo: custom_capability
  [BinarySensorDeviceClass.POWER]: 'alarm_power',
  [BinarySensorDeviceClass.PRESENCE]: 'alarm_presence',
  [BinarySensorDeviceClass.PROBLEM]: 'alarm_problem', // todo: custom_capability
  [BinarySensorDeviceClass.RUNNING]: 'alarm_running',
  [BinarySensorDeviceClass.SAFETY]: 'alarm_safety', // todo: custom_capability
  [BinarySensorDeviceClass.SMOKE]: 'alarm_smoke',
  [BinarySensorDeviceClass.SOUND]: 'alarm_sound', // todo: custom_capability
  [BinarySensorDeviceClass.TAMPER]: 'alarm_tamper',
  [BinarySensorDeviceClass.VIBRATION]: 'alarm_vibration', // todo: custom_capability
  [BinarySensorDeviceClass.WINDOW]: 'windowcoverings_closed',
};

/**
 * Mapper for binary_sensor entities. See https://developers.home-assistant.io/docs/core/entity/binary-sensor.
 */
export default class BinarySensorEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('binary_sensor.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    homeyDevice.class = homeyDevice.class || 'sensor';
    if (!entity.instance.attributes) {
      return;
    }

    const deviceClass = entity.instance.attributes['device_class'];
    if (deviceClass === BinarySensorDeviceClass.UPDATE) {
      return;
    }

    let capabilityId = BinarySensorEntityMapper.getCapabilityId(deviceClass);
    const capabilityOptions: (typeof homeyDevice.capabilitiesOptions)[string] = {
      entityId,
    };

    if (capabilityId) {
      // Known capabilities
    } else {
      const entityIdWithoutSensor = entityId.substring('binary_sensor.'.length);
      const capabilityType = 'boolean';
      capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;

      capabilityOptions.title = friendlyName || deviceClass || entityIdWithoutSensor;
    }

    // Configure the capability
    homeyDevice.capabilities.push(capabilityId);
    homeyDevice.capabilitiesOptions[capabilityId] = capabilityOptions;
  }

  static getCapabilityId(deviceClass: string | undefined): string | null {
    let capabilityId: string | null = null;
    if (deviceClass) {
      capabilityId = CAPABILITY_MAP[deviceClass as BinarySensorDeviceClass] ?? null;
    }

    return capabilityId;
  }
}
