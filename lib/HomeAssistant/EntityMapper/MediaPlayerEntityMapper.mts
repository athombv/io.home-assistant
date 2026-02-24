import type { HomeyHomeAssistantDeviceOption, ProcessedHomeAssistantEntity } from '../../HomeAssistantTypes.mjs';
import HaDeviceEntityMapper, { type EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Entity features as defined by Home Assistant in `MediaPlayerEntityFeature` */
export enum MediaPlayerEntityFeature {
  PAUSE = 1,
  SEEK = 2,
  VOLUME_SET = 4,
  VOLUME_MUTE = 8,
  PREVIOUS_TRACK = 16,
  NEXT_TRACK = 32,
  // 64 is not used
  TURN_ON = 128,
  TURN_OFF = 256,
  PLAY_MEDIA = 512,
  VOLUME_STEP = 1024,
  SELECT_SOURCE = 2048,
  STOP = 4096,
  CLEAR_PLAYLIST = 8192,
  PLAY = 16384,
  SHUFFLE_SET = 32768,
  SELECT_SOUND_MODE = 65536,
  BROWSE_MEDIA = 131072,
  REPEAT_SET = 262144,
  GROUPING = 524288,
  MEDIA_ANNOUNCE = 1048576,
  MEDIA_ENQUEUE = 2097152,
  SEARCH_MEDIA = 4194304,
}

/** Device classes as defined by Home Assistant in `MediaPlayerDeviceClass` */
export enum MediaPlayerDeviceClass {
  TV = 'tv',
  SPEAKER = 'speaker',
  RECEIVER = 'receiver',
}

const SUPPORTED_FEATURES: Partial<Record<MediaPlayerEntityFeature, string[]>> = {
  [MediaPlayerEntityFeature.PAUSE]: ['speaker_playing', 'speaker_track', 'speaker_artist', 'speaker_album'],
  [MediaPlayerEntityFeature.SEEK]: ['speaker_position', 'speaker_duration'],
  [MediaPlayerEntityFeature.VOLUME_SET]: ['volume_set'],
  [MediaPlayerEntityFeature.VOLUME_MUTE]: ['volume_mute'],
  [MediaPlayerEntityFeature.PREVIOUS_TRACK]: ['speaker_prev'],
  [MediaPlayerEntityFeature.NEXT_TRACK]: ['speaker_next'],
  [MediaPlayerEntityFeature.VOLUME_STEP]: ['volume_up', 'volume_down'],
  [MediaPlayerEntityFeature.PLAY]: ['speaker_playing'],
  [MediaPlayerEntityFeature.SHUFFLE_SET]: ['speaker_shuffle'],
  [MediaPlayerEntityFeature.REPEAT_SET]: ['speaker_repeat'],
};

const CLASS_MAP: Record<MediaPlayerDeviceClass, string> = {
  [MediaPlayerDeviceClass.RECEIVER]: 'amplifier',
  [MediaPlayerDeviceClass.SPEAKER]: 'speaker',
  [MediaPlayerDeviceClass.TV]: 'tv',
};

/**
 * Mapper for media_player entities. See https://developers.home-assistant.io/docs/core/entity/media-player.
 */
export default class MediaPlayerEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('media_player.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    if (!entity.instance.attributes) {
      return;
    }

    const deviceClass = entity.instance.attributes['device_class'] ?? null;
    const mediaType = this.getMediaType(deviceClass);

    homeyDevice.class = homeyDevice.class && homeyDevice.class !== 'sensor' ? homeyDevice.class : mediaType;

    if (!homeyDevice.iconOverride || homeyDevice.class === 'sensor') {
      switch (mediaType) {
        case 'tv':
          homeyDevice.iconOverride = 'tv';
          break;
        case 'speaker':
          homeyDevice.iconOverride = 'speaker';
          break;
        case 'amplifier':
          homeyDevice.iconOverride = 'pre-amp';
          break;
        default:
          homeyDevice.iconOverride = 'multimedia';
          break;
      }
    }

    // Always add playing capability
    homeyDevice.capabilities.push('speaker_playing');
    homeyDevice.capabilitiesOptions['speaker_playing'] = homeyDevice.capabilitiesOptions['speaker_playing'] || {};
    homeyDevice.capabilitiesOptions['speaker_playing'].title = friendlyName || entityId;
    homeyDevice.capabilitiesOptions['speaker_playing'].entityId = entityId;

    HaDeviceEntityMapper.mapFeatureMask(entityId, entity, homeyDevice, friendlyName, SUPPORTED_FEATURES);
  }

  private getMediaType(deviceClass: string | null): string {
    let mediaType: string | null = null;
    if (deviceClass) {
      mediaType = CLASS_MAP[deviceClass as MediaPlayerDeviceClass] ?? null;
    }

    return mediaType ?? 'speaker';
  }
}
