# Home Assistant

Homey integration for the home assistant smarthome helper

Home Assistant is an open source software package for home automation. You can
control all your devices from there, track things like notifcations, network
traffic, statistics and more. Homey wants to offer the option to users to
control devices in a simpler way, like from their phone. All you need to do is
install this app on your Homey account, boot it up, be connected to the same
(WiFi) network as your Home Assistant, fill in a short connection set up and
then select what devices you want to control from your phone!

You can then also use Flows and Insights, giving you almost the same amount of
control and tracking as Home Assistant. But, unnecessary things for some users,
like a graph of network traffic or a dashboard of Binary sensors, can still be
viewed in Home Assistant but won't be in your way with the Homey App.

When you add a light to Home Assistant, this set up is long and then you even
need to add it to a dashboard in order to control it. If you want to do more
with it, you can use automations, scripts or scenes, to expand its
possibilities. It is nice that you have done all that, and you will not lose
those possibilities when you connect that same exact lamp to Homey, with this
app, but Homey has already made an entire user interface for you, with the focus
on accessibility, user friendliness and readability. With simply opening up
Homey and with one tap on a button, that same light takes 2 or 3 less steps to
turn on or off.

And, Home Assistant will still run your scripts, where it turns off all the
lights at 9pm, because Homey and Home Assistant do not 'demand' things from each
other, they ask each other questions, like Homey asking "what is the temperature
of this sensor?" or Homey asking "Can you turn the living room light on?". If
the light was already turned on, Home Assistant will simply say it was already
turned on and just leave it at that. It works a little bit different the other
way around, because Home Assistant lets Homey know what changed, because Homey
is subscribed to the Home Assistant entities and listens to the states of Home
Assistant devices. If a value has changed, ex. temperature, Home Assistant says
to Homey "Hey! The temperature has changed, I have this new value for you!"

## How to install and set up

WIP

## How it works in technical terms

# Done

- Connect the Home Assistant instance using async code and using as little
  traffic or connections as possible
- Show a list of compatible devices (sensors, lights)
- Show devices that have 1 or more than 1 capability affiliated with them (and
  filter these when you want to add a device)
- Store certain entity Ids, affiliated with the capabilities to use later on in
  the program
- Connect a Home Assistant Light to Homey and then turn it on and off
- Connect mutiple lights from Home Assistant to Homey and turn them on and off
  (confirm dynamic driver and device files) Connect a weather sensor (Aqara) and
  show the capabilities of Humidity, Pressure, Temperature and Battery level
  (note, show capabilities, values are yet not shown) (currently you cant read
  or get updates for their values due to missing code)
- Added the capability to dim a light, change the temperature of said light

## To Do

- Add Device Classes
- Add a realtime event listener (to listen to the entities event / 'state
  change' bus) [KEY FEATURE TO IMPLEMENT] - see WS of Home Assistant
- Add the ability to change RGB values and when a RGBW gets connected in its
  'color_temp' recognize in some way that it is a RGBW light (because the 'hs'
  color mode is missing and then add corresponding capabilities. This does come
  down to the 'state_changed' event bus)
- See if it is possible to refine the code that recognizes light capabilities,
  and figure out a way to add the hue and saturation components
- Add icons
- Add Home Assistant correct blue color
- Change hardcoded connection to a connection set up process (where you enter a
  LLAT)
