# Home Assistant

Homey integration for the home assistant smarthome helper

Home Assistant is an open source software package for home automation. You can
control all your devices from there, track things like notifcations, network
traffic, statistics and more. Homey wants to offer the option for users to
control devices in a simpler way, from their phone without setting up a Home
Assistant Dashboard. All you need to do is install this app on your Homey
account, boot it up, connect to the same (WiFi) network as your Home Assistant,
fill in a connection setup and then select what devices you want to connect to
your Homey!

You can then use Flows and Insights, giving you almost the same amount of
control and tracking as Home Assistant. But, Home Assistant specific controls,
like a graph of network traffic or a dashboard of Binary sensors, can still be
viewed in Home Assistant but won't be in your way with the Homey App.

When you add a light to Home Assistant, this set up is long and then you even
need to add it to a dashboard in order to control it. If you want to do more
with it, you can use automations, scripts or scenes.. It is nice that you have
done all that, and you will not lose those possibilities when you connect that
same exact lamp to Homey, with this app, but Homey has already made an entire
user interface for you, with the focus on accessibility, user friendliness and
readability. With simply opening up Homey and with one tap on a button, that
same light takes 2 or 3 less steps to turn on or off.

And, Home Assistant will still run your scripts, where it turns off all the
lights at 9pm, because Homey and Home Assistant do not 'demand' things from each
other, they ask each other questions, like Homey asking "what is the temperature
of this sensor?" or Homey asking "Can you turn the living room light on?". If
the light was already turned on, Home Assistant will simply say it was already
turned on and just leave it at that. It works a little bit different the other
way around, because Home Assistant lets Homey know what changed, because Homey
is subscribed to the Home Assistant entities and listens to the states of Home
Assistant devices. If a value has changed, ex. temperature, Home Assistant says
to Homey "Hey! The temperature has changed, I have this new value for you!" or
if a light is toggled on/off, Home Assistant gives the new state to Homey.

## How to install and set up

To use this application you need an active Home Assistant installation in your
household. You also need a Homey Cloud account active.

## How it works

WIP

# Done

- Connect the Home Assistant instance using async code and using as little
  traffic or connections as possible
- Show a list of compatible devices
- Show devices that have 1 or more than 1 capability affiliated with them (and
  filter these when you want to add a device)
- Store certain entity Ids, affiliated with the capabilities to use later on in
  the program
- Connect a Home Assistant Light to Homey and then turn it on and off
- Connect mutiple lights from Home Assistant to Homey and turn them on and off
  (confirm dynamic driver and device files) Connect a weather sensor (Aqara) and
  show the capabilities and values of Humidity, Pressure, Temperature and
  Battery level
- Added the capability to dim a light, change the temperature of said light
- Added alarm capabilities and corresponding device classes
- Added a realtime event listener (listens to the event bus of Home Assistant)
- Added code that pastes initial values in the capabilities, thus the are not
  empty / null value capabilities anymore
- Added a switch-case statement for devices, aka entities, which have multiple
  capabilities. These are, for now, a light and a media_player device.
- Code for device Classes was added, needs more testing and refining
- Code for icon selection was added and .svg icons are being added one by one
- Media players added, but there is an unresolved promise bug in the code
  (undefined is undefined but expecteda string)

## To Do

- Refine Device Classes (add manufacturer)
- Fix bugs noted in Google Docs
