'use strict';

const Hass = require('home-assistant-js-websocket');
const Converter = require('./haToHomeyConverter')
const webSocket = require('ws');

global.WebSocket = webSocket;

 const address = 'http://homeassistant.local:8123';
 const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

class Client extends Converter {

    constructor(address, token) {
        super();
        this._connection = null;
        this.authConnection(address, token);
        //Converter.prototype.homeyMapper = this.homeyMapper.bind(this);
        //Converter.prototype.stateChange = this.stateChange.bind(this);
    }

    async authConnection(address, token) {
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
        //console.log('connection:', connection);
        if(connection){
            console.log('succesfully connected... subscribing to entities and events');
        Hass.subscribeEntities(connection, Converter.prototype.homeyMapper.bind(this));
        connection.subscribeEvents(Converter.prototype.stateChange.bind(this),'state_changed');
        }
    }
}
module.exports = Client;
