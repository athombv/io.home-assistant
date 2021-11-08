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
            console.log(Converter.prototype.deviceRegistry);
            Converter.prototype.entityRegistry = await connection.sendMessagePromise({type:"config/entity_registry/list"});
            Hass.subscribeEntities(connection, Converter.prototype.homeyMapper.bind(this));
            //Hass.subscribeEntities(connection, (entities) => console.log(entities));
            //Hass.subscribeConfig(connection, (config) => console.log("New config!", config));
            connection.subscribeEvents(Converter.prototype.stateChange.bind(this), 'state_changed');
            //console.log('connection:', connection);
            //console.log(JSON.stringify(result, undefined, 2));
            //console.log(JSON.stringify(result1,undefined,2));

        } catch (err) {
            console.error(err);
        }
    }
}
module.exports = Client;
