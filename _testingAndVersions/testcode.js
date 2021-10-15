const jsonData = require('./apiget.json');

const Hass = require('home-assistant-js-websocket');
const WebSocket = require('ws');

global.WebSocket = WebSocket;

const HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP =// type: number
{
    // device_class --> capability --> type
    // the binary_sensor and sensor capabilities need to be split up because the device class can be he same
    'temperature': 'measure_temperature',
    'humidity': 'measure_humidity',
    'pressure': 'measure_pressure',
    'battery': 'measure_battery'
};

// WHAT INFORMATION IS IMPORTANT FOR HOMEY

const haDevices = [
    {
        devName: '',
        devCapabilities: '',
    }
];

const dataEx = [    // const dataEx = [{}, {}, {},]
    {
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
    },
    {
        entity_id: "sensor.lumi_lumi_weather_pressure",
        state: "1018",
        attributes: {
            state_class: "measurement",
            unit_of_measurement: "hPa",
            friendly_name: "LUMI weather sensor pressure",
            device_class: "pressure"
        },
        last_changed: "2021-10-11T05:18:12.558987+00:00",
        last_updated: "2021-10-11T05:18:12.558987+00:00",
        context: {
            id: "5470e73e1238342b06430c6320639fc1",
            parent_id: null,
            user_id: null
        }
    },
]
// console.log(dataEx);

const loadData = [...jsonData]; // myfunction.apply(null,args); --> nyfunction(...args);
// function Mapper() {
const homeyMapper = loadData.map(device => {
    if (device.attributes.device_class) { // if the object attributes (of device) has a device_class, map the object 'device'.
        // This is different for lights, so maybe check for the supported_colormodes and/or features
        // the device_class is basically for binary_sensor or sensor. The media_player or light dont have a device class but use supported_features
        // console.log(device.entity_id);    
        return {
            name: device.entity_id,  // capabilities: Object.entries(device.attributes.device_class) 
            // if device.entity_id start with sensor. or binary_sensor {
            capabilities: Object.entries(device.attributes)
                .map(([key, value]) => { //map(([key, value]))
                    // for (const [key, value] of Object.entries(device.attributes)) {
                    // console.log(`key: ${key}; value: ${value}`);
                    // for key == device_class && value == HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILITIES_MAP[value]{ const capabilityId = HA_SENSOR}
                    if (key == 'device_class') {
                        const capabilityId = HA_SENSOR_ENTITIES_TO_HOMEY_CAPABILIIES_MAP[value];
                        return capabilityId;
                    } else {
                        const data = value;
                        return data;
                    }
                }),
            // } else { check if the entity has supported features and/or supported color mode, then check if the entity id starts with light or media_player}
        };
    } else {
        return {
            name: device.entity_id
        };
    }
});

console.log(homeyMapper);

const HA_Attributes = {
    'state_class': 'value',
    'unit_of_measurement': 'value',
    'friendly_name': 'friendly_name',
    'device_class': 'device_class'
};

const HA_DATA = {
    'entity_id': 'value',
    'state': 'value',
    'attributes': HA_Attributes
    // throw the rest
};

/* what if you would just paste the information from the subscribed entity (ex sensor.lumi_lumi_weather_humidity) in the HA_data first, like entity_id.
then the value of entity_id would become sensor.lumi_lumi_weather_humidity
then go to attributes and like push the values of the attributes into there. Then any unknown attributes wouldn't get thrown.
Then go to HA_attributes and just paste/push the data from the API array into there.

*/
class Temp {
    constructor(address, token) {
        this._entities = [];
        this._lights = [];
        this._scenes = [];
        this._scripts = [];
        this._switches = [];
        this._sensors = [];
        this._binary_sensors = [];
        this._compounds = [];
        this._automation = [];
        this.tmp = [];
        this._devices = {};
        this._connection = null;

        this.connect(address, token);
    }

    async connect(address, token, notify) {
        console.log('connecting to home assistant');
        this.haConnect = false;
        if (this._connection != null) {
            this._connection.close();
        }

        if (address && address !== '' && token && token !== '') { // != en !=
            const auth = new Hass.Auth({
                hassUrl: address,
                access_token: token,
                expires: new Date(new Date().getTime() + 1e11),
            });
            // await this.Hass.createConnection({auth});
            Hass.createConnection({ auth })
                .then(conn => {
                    console.log('succesfully connected... subscribing to entities and events');
                    //if (notify) {
                    //    this.emit('connection_update', { connected: true });
                    //}
                    this._connection = conn;
                    const bindEntities = this.updateEntities.bind(this);
                    const bindStates = this.updateStates.bind(this);
                    Hass.subscribeEntities(conn, bindEntities); // this is the key function
                    console.log(`state: ${bindStates}`); 
                    conn.subscribeEvents(bindStates,
                        'state_changed');
                })
                .catch(err => {
                    this._connection = null;
                    // this.emit('connection_update', { connected: false });
                    console.log('failed to connect:', err); // works confirmed
                });
                console.log(`${bindEntities}`);
        }

    }
    // here connection funcion ends

    /* use cases: 
          check if new devices were added
          where do you find all values when _onEntitiesUpdate is called
          what does _onStateChanged do
       
       what do i need the app to do
        - retrieve the entity list (like in the other file)
        - place everything in an array so that everything is mapped (object.map, object.entries etc)
        - constantly see if anything changes about the entity or the value of entity 
        - some more stuff

      achieved: connection through node javascript file
                console.log the Object.entries(entities)
                console.log the keys and values of entities
    */
    updateEntities() {
        const _entities = [...Hass];
        _entities.map(entities => {
            return {
                name: entities.id,
            }
        })
    }

    updateStates () {
        
    }
}

const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

this.connect1 = new Temp(address, token);

// console.log(this);