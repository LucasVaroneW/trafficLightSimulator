/**
 * FixedTimeController.js
 * Implementación de tiempos fijos secuenciales.
 */
class FixedTimeController extends TrafficController {
    constructor(trafficLight) {
        super(trafficLight);
    }

    update() {
        const light = this.trafficLight;
        light.timer--;

        if (light.timer < 0) {
            this._transition(light);
        }
    }

    _transition(light) {
        const MODES = TrafficLight.MODES;
        switch (light.mode) {
            case MODES.PRINCIPAL:
                light.setMode(MODES.AMARILLO, light.config.amarillo);
                break;
            case MODES.AMARILLO:
                light.setMode(MODES.SECUNDARIA, light.config.secGreen);
                break;
            case MODES.SECUNDARIA:
                light.setMode(MODES.AMARILLO_SEC, light.config.amarillo);
                break;
            case MODES.AMARILLO_SEC:
                light.setMode(MODES.PRINCIPAL, light.config.priGreen);
                break;
        }
    }
}
