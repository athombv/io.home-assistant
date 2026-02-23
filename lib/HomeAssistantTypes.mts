export type HomeyHomeyAssistantPairingServer = {
  protocol: string;
  host: string;
  port: string;
  name: string;
};

export type HomeyHomeAssistantServerConfig = {
  token: string;
} & HomeyHomeyAssistantPairingServer;

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

export type HomeAssistantDeviceRegistry = Array<{
  id: string;
  identifiers: string[];
  name_by_user?: string | null;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  model_id?: string | null;
  entry_type: 'service' | null;
}>;

export type HomeAssistantEntityRegistry = Array<{
  id: number;
  device_id: string | null;
  entity_id: string;
}>;
