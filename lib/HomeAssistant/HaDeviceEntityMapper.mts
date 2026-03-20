import type {
  HomeyHomeAssistantDeviceOption,
  ProcessedHomeAssistantDevice,
  ProcessedHomeAssistantEntity,
} from '../HomeAssistantTypes.mjs';
import { titleCase } from '../HomeAssistantUtil.mjs';
import AlarmControlPanelEntityMapper from './EntityMapper/AlarmControlPanelEntityMapper.mjs';
import BinarySensorEntityMapper from './EntityMapper/BinarySensorEntityMapper.mjs';
import CoverEntityMapper from './EntityMapper/CoverEntityMapper.mjs';
import FanEntityMapper from './EntityMapper/FanEntityMapper.mjs';
import HumidifierEntityMapper from './EntityMapper/HumidifierEntityMapper.mjs';
import LightEntityMapper from './EntityMapper/LightEntityMapper.mjs';
import MediaPlayerEntityMapper from './EntityMapper/MediaPlayerEntityMapper.mjs';
import SensorEntityMapper from './EntityMapper/SensorEntityMapper.mjs';
import SwitchEntityMapper from './EntityMapper/SwitchEntityMapper.mjs';
import VacuumEntityMapper from './EntityMapper/VacuumEntityMapper.mjs';

export interface EntityMapper {
  supportsEntityId(entityId: string): boolean;
  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void;
}

export default class HaDeviceEntityMapper {
  public static map(
    homeAssistantDevice: ProcessedHomeAssistantDevice,
    homeyDevice: HomeyHomeAssistantDeviceOption,
  ): void {
    const mappers = [
      AlarmControlPanelEntityMapper,
      BinarySensorEntityMapper,
      CoverEntityMapper,
      FanEntityMapper,
      HumidifierEntityMapper,
      LightEntityMapper,
      MediaPlayerEntityMapper,
      SensorEntityMapper,
      SwitchEntityMapper,
      VacuumEntityMapper,

      /*
       * TODO:
       *  Possible other Home Assistant entities which could be added: climate, camera, device_tracker, weather,
       *  water_heater, siren, select, remote, number, humidifier, alarm, air_quality.
       */
    ].map(m => new m());

    for (const entity of Object.values(homeAssistantDevice.entities)) {
      // Skip entities without instance
      if (!entity.instance) {
        continue;
      }

      // Set friendly name without the device name.
      let friendlyName = entity.instance.attributes['friendly_name'];
      if (
        friendlyName &&
        friendlyName.length > 0 &&
        homeyDevice.name &&
        homeyDevice.name.length > 0 &&
        friendlyName.startsWith(homeyDevice.name)
      ) {
        friendlyName = titleCase(friendlyName.slice(homeyDevice.name.length)) || friendlyName;
      }

      // Loop through the available mappers
      for (const mapper of mappers) {
        const entityId = entity.entity_id;
        if (!mapper.supportsEntityId(entityId)) {
          continue;
        }

        mapper.map(entityId, entity, homeyDevice, friendlyName);
      }
    }
  }

  public static mapFeatureMask(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
    features: Partial<Record<number, string[]>>,
  ): void {
    const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

    for (const [key, value] of Object.entries(features)) {
      // Check if the key is part of the supported features binary value.
      if (supportedFeatures & Number(key)) {
        (value ?? []).forEach(capabilityId => {
          homeyDevice.capabilities.push(capabilityId);
          homeyDevice.capabilitiesOptions[capabilityId] = {
            title: friendlyName || entityId,
            entityId: entityId,
          };
        });
      }
    }
  }

  public static addCapability(
    homeyDevice: HomeyHomeAssistantDeviceOption,
    entityId: string,
    capability: string,
    capabilityOptions?: Record<string, unknown>,
  ): void {
    homeyDevice.capabilities.push(capability);
    homeyDevice.capabilitiesOptions[capability] = homeyDevice.capabilitiesOptions[capability] || {};
    homeyDevice.capabilitiesOptions[capability].entityId = entityId;

    if (!capabilityOptions) {
      return;
    }

    for (const option in capabilityOptions) {
      homeyDevice.capabilitiesOptions[capability][option] = capabilityOptions[option];
    }
  }

  public static setDeviceClass(homeyDevice: HomeyHomeAssistantDeviceOption, deviceClass: string): void {
    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : deviceClass;
  }

  public static setDeviceIcon(homeyDevice: HomeyHomeAssistantDeviceOption, icon: string): void {
    homeyDevice.iconOverride =
      homeyDevice.iconOverride && homeyDevice.class !== 'sensor' ? homeyDevice.iconOverride : icon;
  }
}
