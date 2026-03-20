import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by Home Assistant in `CoverEntityFeature` */
export enum CoverEntityFeature {
  OPEN = 1,
  CLOSE = 2,
  SET_POSITION = 4,
  STOP = 8,
  OPEN_TILT = 16,
  CLOSE_TILT = 32,
  STOP_TILT = 64,
  SET_TILT_POSITION = 128,
}

/** Device classes as defined by Home Assistant in `CoverDeviceClass` */
export enum CoverDeviceClass {
  AWNING = 'awning',
  BLIND = 'blind',
  CURTAIN = 'curtain',
  DAMPER = 'damper',
  DOOR = 'door',
  GARAGE = 'garage',
  GATE = 'gate',
  SHADE = 'shade',
  SHUTTER = 'shutter',
  WINDOW = 'window',
}

const CLASS_MAP: Record<CoverDeviceClass, string> = {
  [CoverDeviceClass.AWNING]: 'sunshade',
  [CoverDeviceClass.BLIND]: 'blinds',
  [CoverDeviceClass.CURTAIN]: 'curtain',
  [CoverDeviceClass.DAMPER]: 'windowcoverings',
  [CoverDeviceClass.DOOR]: 'garagedoor',
  [CoverDeviceClass.GARAGE]: 'garagedoor',
  [CoverDeviceClass.GATE]: 'garagedoor',
  [CoverDeviceClass.SHADE]: 'sunshade',
  [CoverDeviceClass.SHUTTER]: 'windowcoverings',
  [CoverDeviceClass.WINDOW]: 'windowcoverings',
};

const SUPPORTED_FEATURES: Partial<Record<CoverEntityFeature, string[]>> = {
  [CoverEntityFeature.OPEN]: ['windowcoverings_state'], // Open
  [CoverEntityFeature.SET_POSITION]: ['windowcoverings_set'],
  [CoverEntityFeature.OPEN_TILT]: ['windowcoverings_tilt_up'], // Open Tilt
  [CoverEntityFeature.CLOSE_TILT]: ['windowcoverings_tilt_down'], // Close Tilt
  [CoverEntityFeature.SET_TILT_POSITION]: ['windowcoverings_tilt_set'], // Set Tilt Position
};

/**
 * Mapper for cover entities. See https://developers.home-assistant.io/docs/core/entity/cover.
 */
export default class CoverEntityMapper implements EntityMapper {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('cover.');
  }

  public map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    if (!entity.instance.attributes) {
      return;
    }

    const deviceClass = entity.instance.attributes.device_class ?? null;
    const coveringType = this.getCoveringType(deviceClass);

    HaDeviceEntityMapper.setDeviceClass(homeyDevice, 'coveringType');

    if (!homeyDevice.iconOverride || homeyDevice.class === 'sensor') {
      switch (coveringType) {
        case 'sunshade':
          homeyDevice.iconOverride = 'sunshade2';
          break;
        case 'blinds':
          homeyDevice.iconOverride = 'blinds';
          break;
        case 'curtain':
          homeyDevice.iconOverride = 'curtains';
          break;
        case 'garagedoor':
          homeyDevice.iconOverride = 'garage-door';
          break;
        default:
          homeyDevice.iconOverride = 'sunshade';
          break;
      }
    }

    HaDeviceEntityMapper.mapFeatureMask(entityId, entity, homeyDevice, friendlyName, SUPPORTED_FEATURES);

    if (coveringType === 'garagedoor') {
      HaDeviceEntityMapper.addCapability(homeyDevice, entityId, 'garagedoor_closed', {
        title: friendlyName || entityId,
      });
    }
  }

  private getCoveringType(deviceClass: string | null): string {
    let coveringType: string | null = null;
    if (deviceClass) {
      coveringType = CLASS_MAP[deviceClass as CoverDeviceClass] ?? null;
    }
    return coveringType ?? 'windowcoverings';
  }
}
