/**
 * FixedTimeController.js
 * Implementación de tiempos fijos secuenciales para 3 fases.
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
                light.nextHorizontalPhase = 'left'; // Empezar con izquierda
                break;
            case MODES.AMARILLO:
                // Alternar entre izquierda y derecha
                if (light.nextHorizontalPhase === 'left') {
                    light.setMode(MODES.HORIZONTAL_LEFT, light.config.horzGreen);
                } else {
                    light.setMode(MODES.HORIZONTAL_RIGHT, light.config.horzGreen);
                }
                break;
            case MODES.HORIZONTAL_LEFT:
                light.setMode(MODES.AMARILLO_HL, light.config.amarillo);
                break;
            case MODES.AMARILLO_HL:
                // Cambiar a horizontal derecha
                light.setMode(MODES.AMARILLO, light.config.amarillo);
                light.nextHorizontalPhase = 'right';
                break;
            case MODES.HORIZONTAL_RIGHT:
                light.setMode(MODES.AMARILLO_HR, light.config.amarillo);
                break;
            case MODES.AMARILLO_HR:
                // Volver a principal
                light.setMode(MODES.PRINCIPAL, light.config.priGreen);
                light.emergencyTimer = light.config.priGreen;
                light.minimumTimer = light.config.priMinimum;
                light.nextHorizontalPhase = 'left'; // Reset para próximo ciclo
                break;
        }
    }
}
