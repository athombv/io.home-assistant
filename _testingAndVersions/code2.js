'use strict';

function myFunction() {
  const HA_ENTITIES_TO_HOMEY_CAPABILITIES_MAP = {

    'binary_sensor.door': 'alarm_contact', // entity[attribute].device_class
    'binary_sensor.smoke': 'alarm_smoke',
  };

  const haDevices = [
    {
      name: 'My Door Sensor',
      entities: {
        'binary_sensor.door': { // entity_id
          value: true, // state, do you really need this lol
          friendly_name: 'door sensor',
          device_class: 'alarm',
        },
      },
    },
  ];

  const lumiTemp = {
    entity_id: 'sensor.lumi_lumi_weather_temperature',
    state: '21.4',
    attributes: {
      state_class: 'measurement',
      unit_of_measurement: '°C',
      friendly_name: 'LUMI weather sensor temperature',
      device_class: 'temperature',
    },
    last_changed: '2021-10-11T08:11:02.327347+00:00',
    last_updated: '2021-10-11T08:11:02.327347+00:00',
    context: {
      id: '7658c58457bdc77e2af125861f5d7f23',
      parent_id: null,
      user_id: null,
    },
  };

  const homeyDevices = haDevices.map(haDevice => {
    return {
      name: haDevice.name,
      capabilities: Object.entries(haDevice.entities)
        .map(([key, value]) => {
          console.log(`Content: ${Object.entries(haDevice.entities)}`);
          const capabilityId = HA_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[key];
          if (!capabilityId) {
            return null;
          }
          console.log(`Key: ${key}`);
          console.log(`Device name: ${haDevice.name}`);
          console.log(`Capability attached: ${capabilityId}`);
          return capabilityId;
        }).filter(capabilityId => {
          return typeof capabilityId === 'string';
        }),
    };
  });
}
myFunction();
// console.log(capabilityId);
console.log(myFunction());

const sumRandomAsyncNums = async () => {
  const first = await Math.random();
  const second = await Math.random();
  const third = await Math.random();

  console.log(`Result ${first + second + third}`);
};

sumRandomAsyncNums();

// -- 1
const homeyMap1 =  {
  name : Object.entries(entities),
capability: Object.entries(entities) //.keys only grabs the key part of the array and doesnt look at the values. where can you find the values?
  .map(([key, value]) => {
      this._id = key;
      const tmp = value;
      for (const val of Object.entries(tmp)) {
          Object.entries(val).map(([key, value]) => {
              if (typeof value === 'string' && value.length === 1) {
                  // console.log('end of line for nested objects');
                  console.log(`${key}`);
                  this._id = key;
                 // return this._id;
              } else {
                  this._id = value;
                  console.log(`${this._id}`);
                 // return this._id;
              }
              return this._id;
          });
      }
  }),
};
console.log(homeyMap1);
// -- 2 
const homeyMap1 = {
  name: Object.keys(entities),
  capability: Object.entries(entities)
      .forEach(([key,value]) => {
          Object.entries(value).forEach(a => {
              const _capabilityId = [...a];
              return _capabilityId;
          })
      }),
};
console.log(homeyMap1);

// -- 3
const homeyMap1 =  {
  name : Object.entries(entities),
capability: Object.entries(entities) //.keys only grabs the key part of the array and doesnt look at the values. where can you find the values?
  .map(([key, value]) => {
      // this._id = key;
      const tmp = value;
      for (const [key, value] of Object.entries(tmp)) {
          Object.entries(value).map(([key, value]) => {
              if (typeof value === 'string' && value.length == 1) {
                  // console.log('end of line for nested objects');
                  console.log(`${key}`);
                  this._id = key;
                  return this._id;
              } else {
                  this._id = value;
                  console.log(`${this._id}`);
                 // return this._id;
              }
          });
      }
  }),
};
console.log(homeyMap1);

// -- 4
if (typeof value == 'object') {
  for (const [key, value1] of Object.values(entities)) {
      console.log(`key: ${key}; value: ${value1}`);
      if(!value1){
          return;
      } else {
      const capabili = [...content];
      return capabili;
      }
  }}

// -- 5 (nog 1 nieuwe property maken om daarde objecten in de plaatsen

if (typeof (value) === 'object') {
  Object.entries(value)
  .map(([key, value]) => {
     // console.log(`key: ${key}; value: ${value}`);
     const capabili = content[value];
     
      if (typeof (value) === 'object') {
          Object.entries(value)
          .map(([key, value]) => {
              // console.log(`key2: ${key}; value2 : ${value}`);
              const capabili = content[value];
              return capabili;
          })
      } else {
          console.log(`Value of value: ${value}`);
      return value;
      }
      return capabili;
  })
  
} else {
  return value;
}