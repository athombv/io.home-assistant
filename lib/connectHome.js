'use strict';

const Hass = require('home-assistant-js-websocket');
const webSocket = require('ws');

global.WebSocket = webSocket;

class Connect {
    
    async authConnection(){
        // await super.authConnection();
        // this.bridges = new Map();
        // this. discovery = new HueDiscover({ homey: this.homey });
        // this.discover.enableDiscovery(); -- only when platform === local

        // this.homey.flow of setScene, groupOn,groupOff,groupSetBrightness
        // this.log(`Running ${this.manifest.id} v${this.manifest.version}...`); 
        const auth = new Hass.Auth({
            hassurl: address,
            access_token: token,
            expires: new Date(new Date().getTime() + 1e11),
        });
        await Hass.createConnection({auth}); 
        Connect.prototype.authConnection.bind(auth);
    }
}

module.exports = Connect;

