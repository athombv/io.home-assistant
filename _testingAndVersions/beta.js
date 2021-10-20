/* copied on 14-10-2021
    uses the custom made connect() function, from io.homeassistant and its Client.js Client class. 
    cleaned up, comments removed
    Logs what entities there are, attributes and/or context is still in object (thus content not visible)
*/
const Hass = require('home-assistant-js-websocket');
const WebSocket = require('ws');

global.WebSocket = WebSocket;

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

        this._id;
        this.connect(address, token);
    }

    async connect(address, token, notify) {
        console.log('connecting to home assistant');
        this.haConnect = false;
        if (this._connection != null) {
            this._connection.close();
        }

        this._lights = []; // Temp._lights = [];
        this._scenes = [];
        this._scripts = [];
        this._switches = [];
        this._sensors = [];
        this._compounds = [];
        this._binary_sensors = [];
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
                    this._connection = conn;
                    Hass.subscribeEntities(conn, this._onEntitiesUpdate.bind(this));
                    const Mapper = conn.subscribeEvents(this._onStateChanged.bind(this),
                        'state_changed');
                    console.log(`state: ${Mapper}`); console.log(Mapper);
                    conn.subscribeEvents(this._onStateChanged.bind(this),
                        'state_changed');
                })
                .catch(err => {
                    this._connection = null;
                    console.log('failed to connect:', err);
                });
        }
    }
    _onStateChanged(event) {
        console.log('entering onStateChanged function');
        try {
            const deviceIds = Object.keys(this._devices);
            const { data } = event;
            if (data) {
                const entityId = data.entity_id;

                deviceIds.forEach(deviceId => {
                    const device = this._devices[deviceId];
                    if (device != null) {
                        if (deviceId === entityId) { // ==
                            device.onEntityUpdate(data.new_state);
                            console.log(`devices: ${deviceId}; entities:${entityId}`);
                        }
                    }
                });
            }
        } catch (e) {
            console.error(new Error('onStateChanged error'));
        }
    }
    _onEntitiesUpdate(entities) {
        if (this._entities.length !== entities.length) { 
            console.log('update entities');
            const homeyMap1 =  {
            name : Object.keys(entities),
            device: Object.entries(entities)
                .map(([key, value]) => {
                   console.log(`key: ${key}; value: ${value}`);
                   return key, value;
                }),
              };
               console.log(homeyMap1);
        }

        const update = this._entities.length === 0;
        if (update) {
            setTimeout(() => {
                Object.keys(this._entities).forEach(id => {
                    this._onStateChanged({
                        data: {
                            entity_id: id,
                            new_state: this._entities[id],
                        },
                    });
                });
            }, 5000);
        }
    }
}

const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';
console.log("test");

this.tmp = new Temp(address, token);

