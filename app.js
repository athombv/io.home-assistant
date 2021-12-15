'use strict';

const Homey = require('homey');

const HAClient = require('./lib/HAClient');

// TODO: Make dynamic from ManagerSettings
const address = 'http://athombv-marleen.eu.ngrok.io'; //http://192.168.0.84:8123 --> http://homeassistant:8123 --> http://10.104.55.90:8123 --> http://homeassistant.local:8123 --> http://athombv-marleen.eu.ngrok.io

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlYTIzMDk5YTMyMjE0MGMzOTFlMzUxYWRmNGY0NjVhOSIsImlhdCI6MTYzMjgxMDg1NSwiZXhwIjoxOTQ4MTcwODU1fQ.NHBA_n47UO_7JZu7DU7El7tCBkYR07LLFHPYhtMJNko';
module.exports = class HomeAssistantApp extends Homey.App {

  async onInit() {
    this.homey.settings.set("host", address);
    this.homey.settings.set("token", token);
    this.settings = this.homey.settings.get('host') || {};
    console.log(this.homey.settings.getKeys());
    //console.log(this.homey.settings);
    this.client = new HAClient({
      address, //this.host
      token, //this.token
    });
  }

  getClient() {
    return this.client;
  }
}