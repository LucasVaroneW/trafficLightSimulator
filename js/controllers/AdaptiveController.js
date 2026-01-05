/**
 * AdaptiveController.js
 * Lógica inteligente basada en sensores (Heredada y mejorada de la versión original).
 */
class AdaptiveController extends TrafficController {
    constructor(trafficLight) {
        super(trafficLight);
    }

    update() {
        const light = this.trafficLight;
        light.timer--;

        if (light.timer < 0) {
            this._handleTimeout(light);
        }
    }

    _handleTimeout(light) {
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

    onSensorEvent(event, data) {
        const light = this.trafficLight;
        const config = light.config;

        if (event === 'car_detected_secondary') {
            // Un auto secundario llegó a la zona de espera (pisa el sensor)
            if (light.mode === TrafficLight.MODES.PRINCIPAL) {
                const timeInGreen = config.priGreen - light.timer;

                if (timeInGreen >= config.intervalo) {
                    // Ya pasó el tiempo mínimo de verde principal -> Cambiar a amarillo YA
                    light.timer = 0;
                    console.log("Sensor activado: Cambio a verde secundario automático (Intervalo cumplido).");
                } else {
                    // Aún no cumple el tiempo mínimo -> Programar cambio para el futuro más cercano
                    const remainingToInterval = config.intervalo - timeInGreen;
                    if (light.timer > remainingToInterval) {
                        light.timer = remainingToInterval;
                        console.log(`Sensor activado: Cambio programado en ${remainingToInterval}s (esperando intervalo mínimo).`);
                    }
                }
            }
        }

        if (event === 'car_passed_secondary') {
            // Un auto secundario terminó de cruzar
            if (light.mode === TrafficLight.MODES.SECUNDARIA) {
                const carsCount = data.count || 0;
                if (carsCount >= config.maxAutosSec) {
                    // Límite de autos alcanzado, terminar verde secundario
                    light.timer = 0;
                } else {
                    // Reiniciar el timer de verde secundario para cada auto que pasa
                    light.timer = config.secGreen;
                }
            }
        }
    }
}
