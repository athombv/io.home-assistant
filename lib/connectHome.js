'use strict';

const Hass = require('home-assistant-js-websocket');
const Converter = require('./haToHomeyConverter')
const webSocket = require('ws');
const fs = require('fs');

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
            Converter.prototype.pairDevices = [];
            Converter.prototype.oldEntities = [];

            let auth;
            auth = new Hass.Auth({
                hassUrl: address,
                access_token: token,
                expires: new Date(new Date().getTime() + 1e11),
            });
            const connection = await Hass.createConnection({ auth });
            console.log('succesfully connected... subscribing to entities and events');
            //Hass.subscribeEntities(connection, Converter.prototype.homeyMapper.bind(this));
            Hass.subscribeEntities(connection, (entities) => console.log(entities));
            //Hass.subscribeConfig(connection, (config) => console.log("New config!", config));
            connection.subscribeEvents(Converter.prototype.stateChange.bind(this), 'state_changed');
            //console.log('connection:', connection);
            const result = await connection.sendMessagePromise({type: "config/device_registry/list"});
            const result1 = await connection.sendMessagePromise({type:"config/entity_registry/list"});
            
            //console.log(JSON.stringify(result, undefined, 2));
            //console.log(JSON.stringify(result1,undefined,2));

        } catch (err) {
            console.error(err);
        }
    }
}
module.exports = Client;
