'use strict';

const Hass = require('home-assistant-js-websocket');
const webSocket = require('ws');

global.WebSocket = webSocket;

class Connect {
    
    async authConnection(){
        let auth;
        auth = new Hass.Auth({
            hassUrl: address,
            access_token: token,
            expires: new Date(new Date().getTime() + 1e11),
        });
        const connection = await Hass.createConnection({ auth });
        Hass.subscribeEntities(connection, homeyMapper.bind(this));
    }
}

module.exports = Connect;

