'use strict';

const Hass = require('home-assistant-js-websocket');
const Converter = require('./haToHomeyConverter')
const webSocket = require('ws');

global.WebSocket = webSocket;

class Client extends Converter {

    constructor(address, token) {
        super();
        this._connection = null;
        this.authConnection(address, token);
    }

    async authConnection(address, token) {
        try {
            console.log('Authenticating');
            Converter.prototype.compatibleDevices = [];
            Converter.prototype.prevEntities = [];

            let auth;
            auth = new Hass.Auth({
                hassUrl: address,
                access_token: token,
                expires: new Date(new Date().getTime() + 1e11),
            });
            const connection = await Hass.createConnection({ auth });
            console.log('succesfully connected... subscribing to entities and events');
            console.log('requesting devices and entities');
            Converter.prototype.deviceRegistry = await connection.sendMessagePromise({type: "config/device_registry/list"});
            Converter.prototype.entityRegistry = await connection.sendMessagePromise({type: "config/entity_registry/list"});
            // -- to get a new entity_registry
            //const result = await connection.sendMessagePromise({type:"config/entity_registry/list"});
            //console.log(JSON.stringify(result, undefined, 2));

            // -- to get list of entities for subscribeEntities.json
            // Hass.subscribeEntities(connection, (entities) => console.log(JSON.stringify(entities, undefined, 2)));

            Hass.subscribeEntities(connection, Converter.prototype.homeyMapper.bind(this));
            
            connection.subscribeEvents(Converter.prototype.stateChange.bind(this), 'state_changed');

            

        } catch (err) {
            console.error(err);
        }
    }
}
module.exports = Client;
