import type { ProcessedHomeAssistantEntity, HomeyHomeAssistantDeviceOption } from '../../HomeAssistantTypes.mjs';
import type { EntityMapper } from '../HaDeviceEntityMapper.mjs';

/** Device classes as defined by Home Assistant in `SensorDeviceClass` */
export enum SensorDeviceClass {
  // Non‑numerical
  DATE = 'date', // Date (ISO8601). Unit: None.
  ENUM = 'enum', // Enumeration. Unit: None.
  TIMESTAMP = 'timestamp', // Timestamp (ISO8601). Unit: None.

  // Numerical
  ABSOLUTE_HUMIDITY = 'absolute_humidity', // Absolute humidity. Unit: g/m³, mg/m³.
  APPARENT_POWER = 'apparent_power', // Apparent power. Unit: mVA, VA, kVA.
  AQI = 'aqi', // Air Quality Index. Unit: None.
  AREA = 'area', // Area. Unit: UnitOfArea.
  ATMOSPHERIC_PRESSURE = 'atmospheric_pressure', // Atmospheric pressure. Unit: UnitOfPressure.
  BATTERY = 'battery', // Battery percentage. Unit: %.
  BLOOD_GLUCOSE_CONCENTRATION = 'blood_glucose_concentration', // Blood glucose. Unit: mg/dL, mmol/L.
  CO = 'carbon_monoxide', // CO concentration. Unit: ppb, ppm, mg/m³, μg/m³.
  CO2 = 'carbon_dioxide', // CO₂ concentration. Unit: ppm.
  CONDUCTIVITY = 'conductivity', // Conductivity. Unit: S/cm, mS/cm, μS/cm.
  CURRENT = 'current', // Current. Unit: A, mA.
  DATA_RATE = 'data_rate', // Data rate. Unit: UnitOfDataRate.
  DATA_SIZE = 'data_size', // Data size. Unit: UnitOfInformation.
  DISTANCE = 'distance', // Distance. Unit: metric (mm, cm, m, km) or USCS (in, ft, yd, mi).
  DURATION = 'duration', // Duration. Unit: d, h, min, s, ms, μs.
  ENERGY = 'energy', // Energy consumption. Unit: J, Wh, kWh, etc.
  ENERGY_DISTANCE = 'energy_distance', // EV energy per distance. Unit: kWh/100km, Wh/km, etc.
  ENERGY_STORAGE = 'energy_storage', // Stored energy. Unit: J, Wh, kWh, etc.
  FREQUENCY = 'frequency', // Frequency. Unit: Hz, kHz, MHz, GHz.
  GAS = 'gas', // Gas volume. Unit: L, m³, ft³, CCF, MCF.
  HUMIDITY = 'humidity', // Relative humidity. Unit: %.
  ILLUMINANCE = 'illuminance', // Illuminance. Unit: lx.
  IRRADIANCE = 'irradiance', // Irradiance. Unit: W/m² or BTU/(h·ft²).
  MOISTURE = 'moisture', // Moisture. Unit: %.
  MONETARY = 'monetary', // Money. Unit: ISO4217 currency code.
  NITROGEN_DIOXIDE = 'nitrogen_dioxide', // NO₂ concentration. Unit: ppb, ppm, μg/m³.
  NITROGEN_MONOXIDE = 'nitrogen_monoxide', // NO concentration. Unit: ppb, μg/m³.
  NITROUS_OXIDE = 'nitrous_oxide', // N₂O concentration. Unit: μg/m³.
  OZONE = 'ozone', // O₃ concentration. Unit: ppb, ppm, μg/m³.
  PH = 'ph', // Acidity/alkalinity. Unitless.
  PM1 = 'pm1', // PM ≤1 μm. Unit: μg/m³.
  PM10 = 'pm10', // PM ≤10 μm. Unit: μg/m³.
  PM25 = 'pm25', // PM ≤2.5 μm. Unit: μg/m³.
  PM4 = 'pm4', // PM ≤4 μm. Unit: μg/m³.
  POWER_FACTOR = 'power_factor', // Power factor. Unit: % or none.
  POWER = 'power', // Power. Unit: W, kW, MW, BTU/h.
  PRECIPITATION = 'precipitation', // Precipitation depth. Unit: cm, mm, in.
  PRECIPITATION_INTENSITY = 'precipitation_intensity', // Precipitation rate. Unit: mm/h, in/h.
  PRESSURE = 'pressure', // Pressure. Unit: bar, Pa, hPa, kPa, inHg, psi, inH₂O.
  REACTIVE_ENERGY = 'reactive_energy', // Reactive energy. Unit: varh, kvarh.
  REACTIVE_POWER = 'reactive_power', // Reactive power. Unit: mvar, var, kvar.
  SIGNAL_STRENGTH = 'signal_strength', // Signal strength. Unit: dB, dBm.
  SOUND_PRESSURE = 'sound_pressure', // Sound pressure. Unit: dB, dBA.
  SPEED = 'speed', // Speed. Unit: m/s, km/h, mph, kn, etc.
  SULPHUR_DIOXIDE = 'sulphur_dioxide', // SO₂ concentration. Unit: ppb, μg/m³.
  TEMPERATURE = 'temperature', // Temperature. Unit: °C, °F, K.
  TEMPERATURE_DELTA = 'temperature_delta', // Temperature difference. Unit: °C, °F, K.
  VOLATILE_ORGANIC_COMPOUNDS = 'volatile_organic_compounds', // VOC amount. Unit: μg/m³, mg/m³.
  VOLATILE_ORGANIC_COMPOUNDS_PARTS = 'volatile_organic_compounds_parts', // VOC ratio. Unit: ppm, ppb.
  VOLTAGE = 'voltage', // Voltage. Unit: V, mV, μV, kV.
  VOLUME = 'volume', // Volume. Unit: mL, L, m³, ft³, gal, etc.
  VOLUME_STORAGE = 'volume_storage', // Stored volume. Unit: mL, L, m³, ft³, gal.
  VOLUME_FLOW_RATE = 'volume_flow_rate', // Flow rate. Unit: m³/h, L/min, gal/min.
  WATER = 'water', // Water volume. Unit: m³, L, ft³, gal.
  WEIGHT = 'weight', // Weight (mass). Unit: μg, mg, g, kg, oz, lb.
  WIND_DIRECTION = 'wind_direction', // Wind direction. Unit: °.
  WIND_SPEED = 'wind_speed', // Wind speed. Unit: m/s, km/h, mph, kn, Beaufort.
}

const CAPABILITY_MAP: Partial<Record<SensorDeviceClass, string>> = {
  [SensorDeviceClass.AQI]: 'measure_aqi', // todo: custom capability
  [SensorDeviceClass.BATTERY]: 'measure_battery',
  [SensorDeviceClass.CO2]: 'measure_co2',
  [SensorDeviceClass.CO]: 'measure_co',
  [SensorDeviceClass.CURRENT]: 'measure_current',
  [SensorDeviceClass.ENERGY]: 'meter_power',
  [SensorDeviceClass.GAS]: 'meter_gas',
  [SensorDeviceClass.HUMIDITY]: 'measure_humidity',
  [SensorDeviceClass.ILLUMINANCE]: 'measure_luminance',
  [SensorDeviceClass.PM1]: 'measure_pm1', // todo: custom capability
  [SensorDeviceClass.PM10]: 'measure_pm10', // todo: custom capability
  [SensorDeviceClass.PM25]: 'measure_pm25',
  [SensorDeviceClass.POWER]: 'measure_power',
  [SensorDeviceClass.PRESSURE]: 'measure_pressure',
  [SensorDeviceClass.SIGNAL_STRENGTH]: 'measure_signal_strength', // todo: custom capability
  [SensorDeviceClass.TEMPERATURE]: 'measure_temperature',
  [SensorDeviceClass.VOLATILE_ORGANIC_COMPOUNDS]: 'measure_voc', // todo: custom capability
  [SensorDeviceClass.VOLTAGE]: 'measure_voltage',
};

/**
 * Mapper for sensor entities. See https://developers.home-assistant.io/docs/core/entity/sensor/.
 */
export default class SensorEntityMapper implements EntityMapper {
  supportsEntityId(entityId: string): boolean {
    return entityId.startsWith('sensor.');
  }

  map(
    entityId: string,
    entity: ProcessedHomeAssistantEntity,
    homeyDevice: HomeyHomeAssistantDeviceOption,
    friendlyName: string | undefined,
  ): void {
    homeyDevice.class = homeyDevice.class || 'sensor';
    if (!entity.instance.attributes) {
      return;
    }

    const deviceClass = entity.instance.attributes['device_class'];

    let capabilityId = deviceClass ? CAPABILITY_MAP[deviceClass as SensorDeviceClass] : null;
    const capabilityOptions: (typeof homeyDevice.capabilitiesOptions)[string] = {
      entityId,
    };

    if (capabilityId) {
      // Known capability
    } else if (entity.instance.attributes.action !== undefined) {
      capabilityId = 'action';
    } else if (entityId.endsWith('_power_outage_count') || entityId.endsWith('_motor_state')) {
      // ignore!
      return;
    } else if (entityId.endsWith('_noise') && entity.instance.attributes.unit_of_measurement === 'dB') {
      capabilityId = 'measure_noise';
    } else if (entityId.endsWith('_rain') && entity.instance.attributes.unit_of_measurement === 'mm') {
      capabilityId = 'measure_rain';
    } else if (entityId.endsWith('_wind_strength') && entity.instance.attributes.unit_of_measurement === 'km/h') {
      capabilityId = 'measure_wind_strength';
    } else if (entityId.endsWith('_status')) {
      capabilityId = 'status';
    } else {
      // Generic capability
      const entityIdWithoutSensor = entityId.substring('sensor.'.length);
      const capabilityType = entity.instance.attributes['unit_of_measurement'] ? 'number' : 'string';
      capabilityId = `hass-${capabilityType}.${entityIdWithoutSensor}`;

      capabilityOptions.title = friendlyName || deviceClass || entityIdWithoutSensor;
      capabilityOptions.units = entity.instance.attributes['unit_of_measurement'] || null;
    }

    // Configure the capability
    homeyDevice.capabilities.push(capabilityId);
    homeyDevice.capabilitiesOptions[capabilityId] = capabilityOptions;
  }
}
