/**
 * AdaptiveController.js
 * Lógica inteligente basada en sensores (Heredada y mejorada de la versión original).
 */
class AdaptiveController extends TrafficController {
    constructor(trafficLight) {
        super(trafficLight);
        this.elapsedSecondaryTime = 0; // Temporizador absoluto para evitar bloqueo infinito
        this.MAX_SEC_TIME = 20; // Tiempo máximo (segundos) que la secundaria puede estar en verde, pase lo que pase
    }

    update() {
        const light = this.trafficLight;
        light.timer--;

        // CAMBIO CRÍTICO: En modo PRINCIPAL, si llega a 0, NO cambiar automáticamente
        // Solo cambiar cuando haya demanda (sensor detecte auto)
        if (light.timer < 0) {
            if (light.mode === TrafficLight.MODES.PRINCIPAL) {
                light.timer = 0;
            } else {
                this._handleTimeout(light);
                this.elapsedSecondaryTime = 0; // Resetear contador al cambiar
            }
        }

        // CONTROL DE LÍMITE ABSOLUTO EN SECUNDARIA
        if (light.mode === TrafficLight.MODES.SECUNDARIA) {
            // Corrección: update se llama cada 1 segundo (según Simulator.js).
            // Entonces simplemente incrementamos.
            this.elapsedSecondaryTime++;

            if (this.elapsedSecondaryTime >= this.MAX_SEC_TIME) {
                light.timer = 0; // FORZAR EL CORTE POR TIEMPO MÁXIMO
                console.log("🚨 CORTE FORZADO: La secundaria excedió el tiempo máximo permitido.");
            }
        } else {
            this.elapsedSecondaryTime = 0;
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

                if (timeInGreen >= config.intervalo || light.timer === 0) {
                    // Ya pasó el intervalo mínimo O el timer está en 0 (esperando) → Cambiar YA
                    console.log("🚨 Sensor activado: Cambio INMEDIATO a amarillo.");
                    light.setMode(TrafficLight.MODES.AMARILLO, config.amarillo);
                } else {
                    // Aún no cumple el tiempo mínimo → Programar cambio para el futuro más cercano
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
