import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const CAPABILITY_MAP = {
  outlet: 'onoff',
  // On means low, Off means normal : "True when battery is low"
  battery: 'alarm_battery',
  // On means charging, Off means not charging : ?
  battery_charging: 'alarm_charging', // TODO: Not supported by Homey yet
  // On means cold, Off means normal : ?
  cold: 'alarm_generic',
  // On means connected, Off means disconnected : ?
  connectivity: 'onoff',
  // On means open, Off means closed : ?
  door: 'alarm_contact', // ?
  // On means open, Off means closed : "True when garage door is closed"
  garage_door: 'garagedoor_closed',
  // On means gas detected, Off means no gas (clear) : "True when [x] gas is detected"
  gas: 'alarm_co2', // ?
  // On means hot, Off means normal : "True when extreme heat has been detected"
  heat: 'alarm_heat',
  // On means light detected, Off means no light : ?
  light: 'alarm_generic',
  // On means open (unlocked), Off means closed (locked) : "True when the lock is locked"
  lock: 'locked',
  // On means wet, Off means dry : "True when water has been detected"
  moisture: 'alarm_water',
  // On means motion detected, Off means no motion (clear) : "Motion alarm turned on"
  motion: 'alarm_motion',
  // On means moving, Off means not moving (stopped) : ?
  moving: 'alarm_generic',
  // On means occupied, Off means not occupied (clear) : ?
  occupancy: 'alarm_occupancy',
  // On means open, Off means closed : ?
  opening: 'alarm_contact',
  // On means plugged in, Off means unplugged : ?
  plug: 'alarm_plugged_in', // TODO: Not supported by Homey yet
  // On means power detected, Off means no power : ?
  power: 'onoff',
  // On means home, Off means away : ?
  presence: 'alarm_motion',
  // On means problem detected, Off means no problem (OK) : ?
  problem: 'alarm_problem', // TODO: Not supported by Homey yet
  // On means running, Off means not running : ?
  running: 'alarm_generic', // TODO: Not supported by Homey yet
  // On means unsafe, Off means safe : ?
  safety: 'alarm_safety', // TODO: Not supported by Homey yet
  // On means smoke detected, Off means no smoke (clear) : "True when smoke is detected"
  smoke: 'alarm_smoke',
  // On means sound detected, Off means no sound (clear) : ?
  sound: 'alarm_sound', // TODO: Not supported by Homey yet
  // On means tampering detected, Off means no tampering (clear) : "True when tampering has been detected"
  tamper: 'alarm_tamper',
  // On means update available, Off means up-to-date : ?
  // update: 'alarm_generic',
  // On means vibration detected, Off means no vibration : ?
  vibration: 'alarm_vibration', // TODO: Not supported by Homey yet
  // On means open, Off means closed : "True when the window coverings are closed"
  window: 'windowcoverings_closed',
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
    if (entity.instance.attributes && entity.instance.attributes['device_class'] !== 'update') {
      // Is this Home Assistant Entity a known Homey Capability?
      const capabilityId = BinarySensorEntityMapper.getCapabilityId(entity.instance.attributes['device_class']);

      if (capabilityId === 'smoke' || capabilityId === 'heat') {
        homeyDevice.iconOverride = 'smoke-detector';
      }

      if (capabilityId) {
        homeyDevice.capabilities.push(capabilityId);
        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
      } else {
        const entityIdWithoutSensor = entityId.substring('binary_sensor.'.length);
        const capabilityType = 'boolean';
        const capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;
        homeyDevice.capabilities.push(capabilityId);
        homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
        homeyDevice.capabilitiesOptions[capabilityId].title =
          friendlyName || entity.instance.attributes['device_class'] || entityIdWithoutSensor;
        homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
      }
    }
  }

  static getCapabilityId(deviceClass: string | undefined): string | null {
    let capabilityId: string | null = null;
    if (deviceClass && deviceClass in CAPABILITY_MAP) {
      capabilityId = CAPABILITY_MAP[deviceClass as keyof typeof CAPABILITY_MAP];
    }

    return capabilityId;
  }
}
