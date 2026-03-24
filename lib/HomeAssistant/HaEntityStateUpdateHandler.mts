import type { HassEntity } from 'home-assistant-js-websocket';
import Homey from 'homey';
import type HomeAssistantDevice from '../HomeAssistantDevice.mjs';
import type HomeAssistantServer from '../HomeAssistantServer.mjs';
import AlarmControlPanelEntityStateUpdateHandler
  from './EntityStateUpdateHandler/AlarmControlPanelEntityStateUpdateHandler.mjs';
import BinarySensorEntityStateUpdateHandler from './EntityStateUpdateHandler/BinarySensorEntityStateUpdateHandler.mjs';
import CoverEntityStateUpdateHandler from './EntityStateUpdateHandler/CoverEntityStateUpdateHandler.mjs';
import FanEntityStateUpdateHandler from './EntityStateUpdateHandler/FanEntityStateUpdateHandler.mjs';
import HumidifierEntityStateUpdateHandler from './EntityStateUpdateHandler/HumidifierEntityStateUpdateHandler.mjs';
import LawnMowerEntityStateUpdateHandler from './EntityStateUpdateHandler/LawnMowerEntityStateUpdateHandler.mjs';
import LightEntityStateUpdateHandler from './EntityStateUpdateHandler/LightEntityStateUpdateHandler.mjs';
import LockEntityStateUpdateHandler from './EntityStateUpdateHandler/LockEntityStateUpdateHandler.mjs';
import MediaPlayerEntityStateUpdateHandler from './EntityStateUpdateHandler/MediaPlayerEntityStateUpdateHandler.mjs';
import SensorEntityStateUpdateHandler from './EntityStateUpdateHandler/SensorEntityStateUpdateHandler.mjs';
import SwitchEntityStateUpdateHandler from './EntityStateUpdateHandler/SwitchEntityStateUpdateHandler.mjs';
import VacuumEntityStateUpdateHandler from './EntityStateUpdateHandler/VacuumEntityStateUpdateHandler.mjs';

export interface EntityStateUpdateHandler {
  supportsEntityId(entityId: string): boolean;
  handle(entityState: HassEntity, capabilities: string[]): Promise<void>;
}

export class HaEntityStateUpdateHandler {
  private entityIdToCapabilityMap: Record<string, string[]> = {};
  private entityIds: Set<string> = new Set();
  private unavailableEntityIds: Set<string> = new Set();
  private entityStateChangedHandler: Record<string, (entityState: HassEntity) => void> = {};

  private readonly handlers: EntityStateUpdateHandler[] = [];

  public constructor(
    private device: HomeAssistantDevice,
    private server: HomeAssistantServer,
  ) {
    this.handlers = [
      AlarmControlPanelEntityStateUpdateHandler,
      BinarySensorEntityStateUpdateHandler,
      CoverEntityStateUpdateHandler,
      FanEntityStateUpdateHandler,
      HumidifierEntityStateUpdateHandler,
      LawnMowerEntityStateUpdateHandler,
      LightEntityStateUpdateHandler,
      LockEntityStateUpdateHandler,
      MediaPlayerEntityStateUpdateHandler,
      SensorEntityStateUpdateHandler,
      SwitchEntityStateUpdateHandler,
      VacuumEntityStateUpdateHandler,
    ].map(h => new h(device, server));
  }

  public async init(): Promise<void> {
    for (const capability of this.device.getCapabilities()) {
      const { entityId } = this.device.getCapabilityOptions(capability);
      if (!entityId) {
        continue;
      }

      if (!Array.isArray(this.entityIdToCapabilityMap[entityId])) {
        this.entityIdToCapabilityMap[entityId] = [];
      }
      this.entityIdToCapabilityMap[entityId].push(capability);

      this.entityIds.add(entityId);
    }

    for (const entityId of this.entityIds) {
      // Initial sync
      this.server
        .getEntityState(entityId)
        .then(async entityState => await this.onEntityState(entityId, entityState))
        .catch(this.error.bind(this));

      // Live updates
      this.entityStateChangedHandler[entityId] = (entityState): void =>
        void this.onEntityState(entityId, entityState).catch(this.error.bind(this));
      this.server.on(`state_changed_entity:${entityId}`, this.entityStateChangedHandler[entityId]);
    }
  }

  public unInit(): void {
    for (const entityId of this.entityIds) {
      this.server.off(`state_changed_entity:${entityId}`, this.entityStateChangedHandler[entityId]);
    }
  }

  private async onEntityState(entityId: string, entityState: HassEntity | null): Promise<void> {
    this.debug('Handling entity state:', JSON.stringify(entityState));

    const capabilities = this.entityIdToCapabilityMap[entityId] ?? [];

    if (entityState === null || entityState.state === 'unavailable') {
      // Entity value is unavailable
      this.log(`Entity ${entityId} is marked unavailable`);
      this.unavailableEntityIds.add(entityId);
      for (const capability of capabilities) {
        this.device.setCapabilityValue(capability, null).catch(this.error.bind(this));
      }

      if (this.unavailableEntityIds.size === this.entityIds.size) {
        // All entities are unavailable, mark the device as unavailable
        await this.device.setUnavailable(this.device.homey.__('allEntitiesUnavailable')).catch(this.error.bind(this));
      }

      return;
    }

    this.unavailableEntityIds.delete(entityId);
    if (!this.device.getAvailable()) {
      await this.device.setAvailable().catch(this.error.bind(this));
    }

    // Loop through the available handlers
    for (const handler of this.handlers) {
      if (!handler.supportsEntityId(entityId)) {
        continue;
      }

      await handler.handle(entityState, capabilities);
    }
  }

  protected debug(...args: unknown[]): void {
    if (Homey.env.DEBUG !== '1') {
      return;
    }

    this.log('[dbg]', ...args);
  }

  protected log(...args: unknown[]): void {
    this.device.log(...args);
  }

  protected error(...args: unknown[]): void {
    this.device.error(...args);
  }
}
