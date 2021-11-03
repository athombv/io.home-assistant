
const Hass = require('home-assistant-js-websocket');
const WebSocket = require('ws');

global.WebSocket = WebSocket;

class Temp {
    constructor(address, token) {
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
            Hass.createConnection({ auth })
                .then(conn => {
                    console.log('succesfully connected... subscribing to entities and events');
                    Hass.subscribeEntities(conn, (entities) => console.log("New entities!", entities));
                    Hass.subscribeConfig(conn, (config) => console.log("New config!", config));
                    Hass.subscribeServices(conn, (services) => console.log("New services!", services));
                })
                .catch(err => {
                    conn = null;
                    // this.emit('connection_update', { connected: false });
                    console.log('failed to connect:', err); // works confirmed
                });
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
}

const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

this.connect1 = new Temp(address, token);

// console.log(this);