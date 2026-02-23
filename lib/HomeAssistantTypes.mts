import type { HassEntity } from 'home-assistant-js-websocket';

export type HomeyHomeyAssistantPairingServer = {
  protocol: string;
  host: string;
  port: string;
  name: string;
};

export type HomeyHomeAssistantServerConfig = {
  token: string;
} & HomeyHomeyAssistantPairingServer;

export type ProcessedHomeAssistantEntity = {
  instance: HassEntity;
} & HomeAssistantEntity;
export type ProcessedHomeAssistantDevice = HomeAssistantDevice & {
  entities: Array<ProcessedHomeAssistantEntity>;
};

export type HomeyHomeAssistantDeviceOption = {
  name: string;
  data: {
    deviceId: string;
    serverId: string;
  };
  store: {
    manufacturer: string | null;
    model: string | null;
    identifiers: string[];
  };
  class: string | undefined;
  iconOverride: string | undefined;
  capabilities: string[];
  capabilitiesOptions: Record<
    string,
    {
      entityId: string;
    } & Record<string, unknown>
  >;
};

type HomeAssistantDevice = {
  id: string;
  identifiers: string[];
  name_by_user?: string | null;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  model_id?: string | null;
  entry_type: 'service' | null;
};
export type HomeAssistantDeviceRegistry = Array<HomeAssistantDevice>;

type HomeAssistantEntity = {
  id: number;
  device_id: string | null;
  entity_id: string;
};
export type HomeAssistantEntityRegistry = Array<HomeAssistantEntity>;
