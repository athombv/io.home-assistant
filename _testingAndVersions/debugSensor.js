const WEATHER_CAPABILITIES = {
    'sensor.lumi_lumi_weather_temperature': 'measure_temperature',
    'sensor.lumi_lumi_weather_battery': 'measure_battery',
    'sensor.lumi_lumi_weather_pressure': 'measure_pressure',
    'sensor.lumi_lumi_weather_humidity': 'measure_humidity'
};

class test {
    constructor() {
        this.temp = [];
        this.printKeys();
    }
    printKeys() {
        for (const [key, value] of Object.entries(WEATHER_CAPABILITIES)) {
            console.log(key);
            let tmp1 = [];
            tmp1.push(key);
            this.temp.push(key);
            console.log(tmp1);
        }
        console.log('Values:',this.temp);
        

        Object.keys(WEATHER_CAPABILITIES).forEach(id => {
            console.log('id:',id);
        })
    }
}

const help = new test();
console.log(help);