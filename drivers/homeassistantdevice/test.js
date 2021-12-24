
const call = {
  "id": 2,
  "type": "event",
  "event": {
    "event_type": "state_changed",
    "data": {
      "entity_id": "light.tradfri_bulb_e14_cws",
      "old_state": {
        "entity_id": "light.tradfri_bulb_e14_cws",
        "state": "on",
        "attributes": {
          "min_mireds": 250,
          "max_mireds": 454,
          "effect_list": ["colorloop"],
          "supported_color_modes": [
            "color_temp",
            "hs"
          ],
          "color_mode": "color_temp",
          "brightness": 122,
          "color_temp": 380,
          "hs_color": [
            28.55,
            67.974
          ],
          "rgb_color": [
            255,
            164,
            81
          ],
          "xy_color": [
            0.533,
            0.389
          ],
          "off_brightness": null,
          "friendly_name": "IKEA TRADFRI bulb E14",
          "supported_features": 63
        },
        "last_changed": "2021-12-21T16:15:32.358860+00:00",
        "last_updated": "2021-12-21T16:15:32.358860+00:00",
        "context": {
          "id": "84d1185d1616609d55de28933b8ec099",
          "parent_id": null,
          "user_id": "2d837f254c9b480ebef1703baca2a824"
        }
      },
      "new_state": {
        "entity_id": "light.tradfri_bulb_e14_cws",
        "state": "on",
        "attributes": {
          "min_mireds": 250,
          "max_mireds": 454,
          "effect_list": [
            "colorloop"
          ],
          "supported_color_modes": [
            "color_temp",
            "hs"
          ],
          "color_mode": "hs",
          "brightness": 122,
          "hs_color": [
            345.0, 85.714
          ],
          "rgb_color": [255, 36, 91],
          "xy_color": [
            0.628, 0.276
          ],
          "off_brightness": null,
          "friendly_name": "IKEA TRADFRI bulb E14",
          "supported_features": 63
        },
        "last_changed": "2021-12-21T16:15:32.358860+00:00",
        "last_updated": "2021-12-21T16:19:16.170969+00:00",
        "context": {
          "id": "a40c4395f6929ec0dd0f26d2b83742c9",
          "parent_id": null,
          "user_id": "2d837f254c9b480ebef1703baca2a824"
        }
      }
    },
    "origin": "LOCAL",
    "time_fired": "2021-12-21T16:19:16.170969+00:00",
    "context": {
      "id": "a40c4395f6929ec0dd0f26d2b83742c9",
      "parent_id": null,
      "user_id": "2d837f254c9b480ebef1703baca2a824"
    }
  }
}


const service = {
  "type": "call_service",
  "domain": "light",
  "service": "turn_on",
  "service_data": {
    "entity_id": "light.tradfri_bulb_e14_cws",
    "hs_color": [345, 85.71428571428571]
  },
  "id": 25
}


42 / api, [ //hue zit tussen 0 en 1  --> 0 tot 360
  "homey:device:b2dcb3c1-c28e-414e-86d9-b4649ba987f1",
  "capability",
  {
    "capabilityId": "light_hue",
    "value": 0.36,
    "transactionId": "mha[:]b85ecf44-c274-4df5-a309-3b8c21ce896f[:]caller[:]Color:9b5cda0a-309e-4772-a483-84103253c662",
    "transactionTime": 1640160731692
  }
]

//saturation zit tussen 0 en 1

//HS color gaat van 0 tot 360 en van 0 tot 100