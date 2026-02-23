import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

const CLASS_MAP = {
  tv: 'tv',
  speaker: 'speaker',
  receiver: 'amplifier',
};

const SPEAKER_SUPPORTED_FEATURES = {
  1: ['speaker_playing', 'speaker_track', 'speaker_artist', 'speaker_album'],
  2: ['speaker_position', 'speaker_duration'],
  4: ['volume_set'],
  8: ['volume_mute'],
  16: ['speaker_prev'],
  32: ['speaker_next'],
  // 128: ['onoff'], // Turn Off
  // 256: ['onoff'], // Turn On
  // 512: 'play_media', // TODO: Not supported by Homey yet
  1024: ['volume_up', 'volume_down'],
  // 2048: 'select_source', // TODO: Not supported by Homey yet
  // 4096: 'speaker_stop', // TODO: Not supported by Homey yet
  // 8192: 'clear_playlist', // TODO: Not supported by Homey yet
  16384: ['speaker_playing'],
  32768: ['speaker_shuffle'],
  // 65536: 'select_sound_mode', // TODO: Not supported by Homey yet
  // 131072: 'browse_media', // TODO: Not supported by Homey yet
  262144: ['speaker_repeat'],
  // 524288: 'grouping', // TODO: Not supported by Homey yet
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
    const mediaType =
      entity.instance.attributes && entity.instance.attributes['device_class']
        ? CLASS_MAP[entity.instance.attributes['device_class'] as keyof typeof CLASS_MAP]
        : 'speaker';
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

    if (entity.instance.attributes) {
      if (typeof entity.instance.state === 'string') {
        homeyDevice.capabilities.push('speaker_playing');
        homeyDevice.capabilitiesOptions['speaker_playing'] = homeyDevice.capabilitiesOptions['speaker_playing'] || {};
        homeyDevice.capabilitiesOptions['speaker_playing'].title = friendlyName || entityId;
        homeyDevice.capabilitiesOptions['speaker_playing'].entityId = entityId;
      }

      const supportedFeatures = entity.instance.attributes['supported_features'] || 0;

      for (const [key, value] of Object.entries(SPEAKER_SUPPORTED_FEATURES)) {
        // Check if the key is part of the supported features binary value.
        if (supportedFeatures & Number(key)) {
          value.forEach(capabilityId => {
            homeyDevice.capabilities.push(capabilityId);
            homeyDevice.capabilitiesOptions[capabilityId] = homeyDevice.capabilitiesOptions[capabilityId] || {};
            homeyDevice.capabilitiesOptions[capabilityId].title = friendlyName || entityId;
            homeyDevice.capabilitiesOptions[capabilityId].entityId = entityId;
          });
        }
      }
    }
  }
}
