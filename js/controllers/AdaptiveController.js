/**
 * AdaptiveController.js
 * Lógica inteligente de 3 fases basada en sensores con doble timer.
 */
class AdaptiveController extends TrafficController {
    constructor(trafficLight) {
        super(trafficLight);
        this.horizontalCarCount = 0; // Contador de autos que cruzan en fase horizontal
        this.elapsedHorizontalTime = 0; // Tiempo transcurrido en fase horizontal
        this.MAX_HORZ_TIME = 20; // Tiempo máximo absoluto para seguridad (20s)
    }

    update() {
        const light = this.trafficLight;
        const MODES = TrafficLight.MODES;

        // Decrementar timer principal
        light.timer--;

        // LÓGICA PARA FASE PRINCIPAL
        if (light.mode === MODES.PRINCIPAL) {
            // Decrementar ambos timers
            light.emergencyTimer--;
            light.minimumTimer--;

            // CASO 1: Timer de emergencia llega a 0 → cambio forzado
            if (light.emergencyTimer <= 0) {
                console.log("🚨 EMERGENCIA: Timer de 120s expiró, cambio forzado a horizontal");

                // Alternar entre izquierda y derecha en emergencias sucesivas
                if (light.lastEmergencyPhase === 'left') {
                    light.nextHorizontalPhase = 'right';
                    light.lastEmergencyPhase = 'right';
                } else {
                    // Primera vez o última fue derecha → ir a izquierda
                    light.nextHorizontalPhase = 'left';
                    light.lastEmergencyPhase = 'left';
                }

                console.log(`→ Activando carril: ${light.nextHorizontalPhase}`);
                light.setMode(MODES.AMARILLO, light.config.amarillo);
                return;
            }

            // CASO 2: Timer mínimo expiró Y hay sensor activado
            if (light.minimumTimer <= 0 && light.nextHorizontalPhase) {
                console.log(`✅ Timer mínimo cumplido + sensor activo → cambio a ${light.nextHorizontalPhase}`);
                light.setMode(MODES.AMARILLO, light.config.amarillo);
                return;
            }

            // CASO 3: Timer normal llega a 0 (sin sensor) → quedarse esperando
            if (light.timer < 0) {
                light.timer = 0;
            }
        }

        // LÓGICA PARA FASES HORIZONTALES (LEFT o RIGHT)
        else if (light.mode === MODES.HORIZONTAL_LEFT || light.mode === MODES.HORIZONTAL_RIGHT) {
            this.elapsedHorizontalTime++;

            // CORTE 1: Tiempo máximo de seguridad
            if (this.elapsedHorizontalTime >= this.MAX_HORZ_TIME) {
                console.log("🚨 CORTE: Fase horizontal excedió tiempo máximo (20s)");
                light.timer = 0;
            }

            // CORTE 2: Timer llega a 0 (5 segundos sin autos, o límite de autos alcanzado)
            if (light.timer < 0) {
                this._handleTimeout(light);
                this.elapsedHorizontalTime = 0;
                this.horizontalCarCount = 0;
            }
        }

        // LÓGICA PARA AMARILLOS
        else if (light.mode === MODES.AMARILLO || light.mode === MODES.AMARILLO_HL || light.mode === MODES.AMARILLO_HR) {
            if (light.timer < 0) {
                this._handleTimeout(light);
            }
        }
    }

    _handleTimeout(light) {
        const MODES = TrafficLight.MODES;
        switch (light.mode) {
            case MODES.PRINCIPAL:
                light.setMode(MODES.AMARILLO, light.config.amarillo);
                break;
            case MODES.AMARILLO:
                // Activar la fase horizontal correspondiente
                if (light.nextHorizontalPhase === 'left') {
                    light.setMode(MODES.HORIZONTAL_LEFT, light.config.horzGreen);
                } else if (light.nextHorizontalPhase === 'right') {
                    light.setMode(MODES.HORIZONTAL_RIGHT, light.config.horzGreen);
                } else {
                    // Por defecto, izquierda
                    light.setMode(MODES.HORIZONTAL_LEFT, light.config.horzGreen);
                }
                break;
            case MODES.HORIZONTAL_LEFT:
                light.setMode(MODES.AMARILLO_HL, light.config.amarillo);
                break;
            case MODES.AMARILLO_HL:
                // Volver a principal
                light.setMode(MODES.PRINCIPAL, light.config.priGreen);
                light.emergencyTimer = light.config.priGreen;
                light.minimumTimer = light.config.priMinimum;
                light.nextHorizontalPhase = null;
                break;
            case MODES.HORIZONTAL_RIGHT:
                light.setMode(MODES.AMARILLO_HR, light.config.amarillo);
                break;
            case MODES.AMARILLO_HR:
                // Volver a principal
                light.setMode(MODES.PRINCIPAL, light.config.priGreen);
                light.emergencyTimer = light.config.priGreen;
                light.minimumTimer = light.config.priMinimum;
                light.nextHorizontalPhase = null;
                break;
        }
    }

    onSensorEvent(event, data) {
        const light = this.trafficLight;
        const config = light.config;

        // EVENTO: Auto detectado en sensor IZQUIERDO
        if (event === 'car_detected_left') {
            if (light.mode === TrafficLight.MODES.PRINCIPAL) {
                // Solo cambiar si el timer mínimo ya expiró
                if (light.minimumTimer <= 0 || light.emergencyTimer <= 0) {
                    console.log("🚦 Sensor IZQUIERDO activado → programando cambio");
                    light.nextHorizontalPhase = 'left';
                    light.setMode(TrafficLight.MODES.AMARILLO, config.amarillo);
                } else {
                    // Guardar preferencia pero esperar al timer mínimo
                    if (!light.nextHorizontalPhase) {
                        light.nextHorizontalPhase = 'left';
                        console.log(`⏳ Sensor IZQUIERDO detectado, esperando ${light.minimumTimer}s más`);
                    }
                }
            }
        }

        // EVENTO: Auto detectado en sensor DERECHO
        if (event === 'car_detected_right') {
            if (light.mode === TrafficLight.MODES.PRINCIPAL) {
                // Solo cambiar si el timer mínimo ya expiró
                if (light.minimumTimer <= 0 || light.emergencyTimer <= 0) {
                    console.log("🚦 Sensor DERECHO activado → programando cambio");
                    light.nextHorizontalPhase = 'right';
                    light.setMode(TrafficLight.MODES.AMARILLO, config.amarillo);
                } else {
                    // Guardar preferencia pero esperar al timer mínimo
                    if (!light.nextHorizontalPhase) {
                        light.nextHorizontalPhase = 'right';
                        console.log(`⏳ Sensor DERECHO detectado, esperando ${light.minimumTimer}s más`);
                    }
                }
            }
        }

        // EVENTO: Auto cruzó en fase IZQUIERDA
        if (event === 'car_passed_left') {
            if (light.mode === TrafficLight.MODES.HORIZONTAL_LEFT) {
                this.horizontalCarCount++;
                console.log(`🚗 Auto ${this.horizontalCarCount} cruzó por izquierda`);

                if (this.horizontalCarCount >= config.maxAutosHorz) {
                    // Límite de autos alcanzado
                    console.log("🛑 Límite de 5 autos alcanzado, cortando fase");
                    light.timer = 0;
                } else {
                    // Reiniciar timer para dar tiempo al siguiente auto
                    light.timer = config.horzGreen + 1;
                }
            }
        }

        // EVENTO: Auto cruzó en fase DERECHA
        if (event === 'car_passed_right') {
            if (light.mode === TrafficLight.MODES.HORIZONTAL_RIGHT) {
                this.horizontalCarCount++;
                console.log(`🚗 Auto ${this.horizontalCarCount} cruzó por derecha`);

                if (this.horizontalCarCount >= config.maxAutosHorz) {
                    // Límite de autos alcanzado
                    console.log("🛑 Límite de 5 autos alcanzado, cortando fase");
                    light.timer = 0;
                } else {
                    // Reiniciar timer para dar tiempo al siguiente auto
                    light.timer = config.horzGreen + 1;
                }
            }
        }
    }
}
