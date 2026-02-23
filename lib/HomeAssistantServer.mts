import type { StateChangedEvent } from 'home-assistant-js-websocket';
import Homey from 'homey';

import {
  Auth,
  Connection,
  createConnection,
  type HassEntities,
  type HassEntity,
  type HassServiceTarget,
  subscribeEntities,
} from 'home-assistant-js-websocket';

export default class HomeAssistantServer extends Homey.SimpleClass {
  private connection: Promise<Connection> | null;
  private entities: Promise<HassEntities> | null;
  private _states: HassEntity[];

  constructor(
    public readonly name: string = 'Home Assistant',
    public readonly protocol: string,
    public readonly host: string,
    public readonly port = '8123',
    public readonly token: string,
  ) {
    super();

    this.connection = null;
    this.entities = null;
    this._states = [];

    if (!this.protocol) {
      throw new Error('Missing Protocol');
    }

    if (!this.host) {
      throw new Error('Missing Host');
    }

    if (!this.port) {
      throw new Error('Missing Port');
    }

    if (!this.token) {
      throw new Error('Missing Token');
    }

    this.connection = null;
    this.entities = null;
  }

  async init(): Promise<void> {
    await this.getConnection();
  }

  async getConnection(): Promise<Connection> {
    if (!this.connection) {
      this.connection = Promise.resolve().then(async () => {
        // Create Auth
        const auth = new Auth({
          hassUrl: `${this.protocol}://${this.host}:${this.port}`,
          access_token: this.token,
          expires: new Date().getTime() + 1e11,
          clientId: 'https://callback.athom.com',
          expires_in: Infinity,
          refresh_token: '',
        });

        // Create Connection
        const connection = await createConnection({ auth });
        this.log('Connected');

        // Subscribe to events
        await connection.subscribeEvents(this.onEventStateChanged, 'state_changed');
        this._states = await connection.sendMessagePromise({ type: 'get_states' });

        // Subscribe to entities
        // await connection.subscribeEntities(console.log);

        return connection;
      });
    }

    return this.connection;
  }

  onEventStateChanged = (event: StateChangedEvent): void => {
    const { data } = event;
    this.emit('state_changed', data);

    if (typeof data.entity_id === 'string') {
      this.emit(`state_changed_entity:${data.entity_id}`, data.new_state);
    }
  };

  async getEntities(): Promise<HassEntities> {
    if (!this.entities) {
      this.entities = Promise.resolve().then(async () => {
        const connection = await this.getConnection();
        return new Promise(resolve => {
          subscribeEntities(connection, entities => {
            // this.entities = entities;
            resolve(entities);
          });
        });
      });
    }
    return this.entities;
  }

  async getEntityState(entityId: string): Promise<HassEntity> {
    if (!this._states) {
      await this.getConnection();
    }

    const entityState = this._states.find(state => state.entity_id === entityId);
    if (!entityState) {
      throw new Error(`Invalid Entity State: ${entityId}`);
    }

    return entityState;
  }

  async callService({
    target,
    domain,
    service,
    serviceData,
  }: {
    target: HassServiceTarget;
    domain: string;
    service: string;
    serviceData?: unknown;
  }): Promise<void> {
    const connection = await this.getConnection();
    await connection.sendMessagePromise({
      type: 'call_service',
      domain,
      service,
      target,
      service_data: serviceData,
    });
  }

  // async updateLight(on, deviceClass, data) {
  //   const connection = await this.getConnection(); //domain "switch"
  //   if (connection) {
  //     if (deviceClass == 'socket') {
  //       Hass.callService(connection, "switch", on ? "turn_on" : "turn_off", data)
  //         .catch((error) => {
  //           console.log("error: ", error);
  //         });
  //     } else {
  //       Hass.callService(connection, "light", on ? "turn_on" : "turn_off", data)
  //         .catch((error) => {
  //           console.log("error:", error);
  //         });
  //     }

  //   }
  // }
  // async pausePlay(on, capability, data) {
  //   const connection = await this.getConnection();
  //   if (connection) {
  //     if (capability == "speaker_playing") {
  //       Hass.callService(connection, "media_player", on ? "media_play" : "media_pause", data)
  //         .catch((error) => {
  //           console.log("Error: ", error);
  //         });
  //     } else if (capability == "volume_set") {
  //       Hass.callService(connection, "media_player", "volume_set", data)
  //         .catch((error) => {
  //           console.log("Error: ", error);
  //         });
  //     }
  //   }
  // }
}
