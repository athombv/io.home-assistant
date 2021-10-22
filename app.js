'use strict';

const Homey = require('homey');
const Client = require('./lib/connectHome');
const address = 'http://homeassistant.local:8123';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';

class MyApp extends Homey.App {
  async onInit() {
    this.log('MyApp has been initialized');
  
    this.log('connecting Home Assistant');
    
    this.Connect = new Client(address, token);
  }

  getClient() {
    this.log('getting client information');
    return this.Connect;
  }

  _reconnectClient(arg) {
    this.log('settings updated.... reconnecting');
    this.Connect.connect(address, token, true);
  }
}

module.exports = MyApp;

/*
    const address = 'http://homeassistant.local:8123';
    // eslint-disable-next-line max-len
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';
    const instance = new Connect(address, token); //instance is a child class now of connect. This is not really what you want because this function is where the entire connection process should get started
    instance.authConnection()
    .then (
    this.log('succesfully connected'),
    )
    .catch(err => {
      this.log('failed to connect', err);
    });
  }
*/
