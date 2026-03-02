import type { HassEntity } from 'home-assistant-js-websocket';
import type {
  HomeyHomeAssistantDeviceOption,
  ProcessedHomeAssistantDevice,
  ProcessedHomeAssistantEntity,
} from '../HomeAssistantTypes.mjs';
import { titleCase } from '../HomeAssistantUtil.mjs';
import BinarySensorEntityMapper from './EntityMapper/BinarySensorEntityMapper.mjs';
import CoverEntityMapper from './EntityMapper/CoverEntityMapper.mjs';
import FanEntityMapper from './EntityMapper/FanEntityMapper.mjs';
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
  static map(homeAssistantDevice: ProcessedHomeAssistantDevice, homeyDevice: HomeyHomeAssistantDeviceOption): void {
    const mappers = [
      new BinarySensorEntityMapper(),
      new CoverEntityMapper(),
      new FanEntityMapper(),
      new LightEntityMapper(),
      new MediaPlayerEntityMapper(),
      new SensorEntityMapper(),
      new SwitchEntityMapper(),
      new VacuumEntityMapper(),

      /*
       * TODO:
       *  Possible other Home Assistant entities which could be added: climate, camera, device_tracker, weather,
       *  water_heater, siren, select, remote, number, humidifier, alarm, air_quality.
       */
    ];

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

  static mapFeatureMask(
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
}
