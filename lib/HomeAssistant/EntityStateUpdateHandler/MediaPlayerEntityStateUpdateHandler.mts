import type { HassEntity } from 'home-assistant-js-websocket';
import type Homey from 'homey';
import AbstractEntityStateUpdateHandler, { type AttributeValueMapper } from './AbstractEntityStateUpdateHandler.mjs';

/** Media player states as defined by Home Assistant in `MediaPlayerState` */
export enum MediaPlayerState {
  OFF = 'off',
  ON = 'on',
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  /** @deprecated 2026.8 */
  STANDBY = 'standby',
  BUFFERING = 'buffering',
}

const ATTRIBUTE_MAP: AttributeValueMapper = [
  { attribute: 'volume_level', capability: 'volume_set' },
  { attribute: 'is_volume_muted', capability: 'volume_mute' },
  { attribute: 'shuffle', capability: 'speaker_shuffle' },
  {
    attribute: 'repeat',
    capability: 'speaker_repeat',
    mapper: (value: string): string => {
      switch (value) {
        case 'one':
          return 'track';
        case 'all':
          return 'playlist';
        default:
          return 'none';
      }
    },
  },
];

const playingAttributeMap: AttributeValueMapper = [
  { attribute: 'media_title', capability: 'speaker_track' },
  { attribute: 'media_artist', capability: 'speaker_artist' },
  { attribute: 'media_album_name', capability: 'speaker_album' },
  { attribute: 'media_position', capability: 'speaker_position' },
  { attribute: 'media_duration', capability: 'speaker_duration' },
];

/**
 * Entity update handler for media_player entities. See https://developers.home-assistant.io/docs/core/entity/media-player.
 */
export default class MediaPlayerEntityStateUpdateHandler extends AbstractEntityStateUpdateHandler {
  public supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('media_player.');
  }

  private image?: Homey.Image;
  private imageUrl?: string;

  public async handle(entityState: HassEntity, _capabilities: string[]): Promise<void> {
    this.mapAttributesToCapability(entityState, ATTRIBUTE_MAP);

    switch (entityState.state) {
      case MediaPlayerState.OFF:
      case MediaPlayerState.ON:
      case MediaPlayerState.IDLE:
      case MediaPlayerState.PAUSED:
      case MediaPlayerState.STANDBY:
        this.setCapabilityValue('speaker_playing', false);
        break;

      case MediaPlayerState.BUFFERING:
      case MediaPlayerState.PLAYING:
        this.setCapabilityValue('speaker_playing', true);
        this.mapAttributesToCapability(entityState, playingAttributeMap);

        await this.createImage();
        if (this.image && this.imageUrl !== entityState.attributes.entity_picture) {
          this.imageUrl = entityState.attributes.entity_picture;
          this.image.setUrl(this.server.hassUrl + this.imageUrl);
          this.image.update().catch(this.error.bind(this));
        }

        break;

      default:
        this.error(`Unknown media player state: ${entityState.state}`);
        break;
    }
  }

  private async createImage(): Promise<void> {
    if (this.image) {
      return;
    }

    try {
      // Create image object when not yet exists
      const image = await this.device.homey.images.createImage();
      image.setUrl(null as unknown as string);
      await this.device.setAlbumArtImage(image).catch(this.error.bind(this));
      this.image = image;
    } catch (error) {
      this.error(`Failed to create image: ${error}`);
      return;
    }
  }
}
