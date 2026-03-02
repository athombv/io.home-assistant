import {
  Auth,
  Connection,
  createConnection,
  type HassEntities,
  type HassEntity,
  type HassServiceTarget,
  type StateChangedEvent,
  subscribeEntities,
} from 'home-assistant-js-websocket';
import Homey from 'homey';

export default class HomeAssistantServer extends Homey.SimpleClass {
  private connection: Promise<Connection> | null;

  private entitiesSubscriptionPromiseResolver?: (() => void) | null;
  private readonly entitiesSubscriptionPromise: Promise<void>;
  private entities: HassEntities = {};

  constructor(
    public readonly name: string = 'Home Assistant',
    public readonly protocol: string,
    public readonly host: string,
    public readonly port = '8123',
    public readonly token: string,
  ) {
    super();

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

    this.entitiesSubscriptionPromiseResolver = null;
    this.entitiesSubscriptionPromise = new Promise(resolve => {
      this.entitiesSubscriptionPromiseResolver = resolve;
    });
  }

  async init(): Promise<void> {
    await this.getConnection();
  }

  async getConnection(): Promise<Connection> {
    if (!this.connection) {
      this.connection = (async (): Promise<Connection> => {
        // Create Auth
        const auth = new Auth({
          hassUrl: this.hassUrl,
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

        // Subscribe to entities
        subscribeEntities(connection, entities => {
          this.entities = entities;

          if (this.entitiesSubscriptionPromiseResolver) {
            this.entitiesSubscriptionPromiseResolver();
            this.entitiesSubscriptionPromiseResolver = null;
          }
        });

        return connection;
      })();
    }

    return this.connection;
  }

  public get hassUrl(): string {
    return `${this.protocol}://${this.host}:${this.port}`;
  }

  onEventStateChanged = (event: StateChangedEvent): void => {
    const { data } = event;
    this.emit('state_changed', data);

    if (data.entity_id) {
      this.emit(`state_changed_entity:${data.entity_id}`, data.new_state);
    }
  };

  async getEntities(): Promise<HassEntities> {
    await this.getConnection();
    await this.entitiesSubscriptionPromise;

    return this.entities;
  }

  async getEntityState(entityId: string): Promise<HassEntity> {
    const entityState = (await this.getEntities())[entityId];
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
}
