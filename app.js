'use strict';

const Homey = require('homey');
const Client = require('./lib/connectHome');
const address = 'http://homeassistant.local:8123'; //http://192.168.0.73:8123
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

class MyApp extends Homey.App {
  async onInit() {
    this.log('MyApp has been initialized');
    super.onInit();
    this.log('connecting Home Assistant');
    
    this.Connect = new Client(address, token);
  }

  getClient() {
    this.log('getting client information');
    return this.Connect;
  }

  _reconnectClient(arg) {
    this.log('settings updated.... reconnecting');
    this.Connect.authConnection(address, token, true);
  }
}

module.exports = MyApp;

/* const connect = Client.prototype.authConnection(address,token);
    if(connect) {
      this.Connect = connect;
    }
    */