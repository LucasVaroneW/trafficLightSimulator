/**
 * TrafficLight.js
 * Responsabilidad: Lógica de control de semáforos (Solo Lógica)
 */

class TrafficLight {
    static MODES = {
        PRINCIPAL: 'principal',
        AMARILLO: 'amarillo',
        HORIZONTAL_LEFT: 'horizontal_left',
        AMARILLO_HL: 'amarillo_hl',
        HORIZONTAL_RIGHT: 'horizontal_right',
        AMARILLO_HR: 'amarillo_hr'
    };

    constructor(config) {
        this.config = {
            priGreen: config.priGreen || 120,        // Timer de emergencia
            priMinimum: config.priMinimum || 30,     // Timer mínimo (NUEVO)
            horzGreen: config.horzGreen || 5,        // Verde horizontal (renombrado)
            maxAutosHorz: config.maxAutosHorz || 5,  // Límite de autos horizontal
            amarillo: 1
        };

        this.mode = TrafficLight.MODES.PRINCIPAL;
        this.timer = this.config.horzGreen;          // Timer para la fase actual

        // Sistema de doble timer para la fase principal
        this.emergencyTimer = this.config.priGreen;  // Timer absoluto de emergencia
        this.minimumTimer = this.config.priMinimum;  // Timer mínimo antes de sensor

        // Tracking de qué mano horizontal debe activarse
        this.nextHorizontalPhase = null;  // 'left', 'right', o null
        this.lastEmergencyPhase = null;   // Para alternar en emergencias consecutivas

        // El controlador se asignará externamente o por defecto
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
    }

    tick() {
        if (this.controller) {
            this.controller.update();
        } else {
            // Lógica por defecto (tiempos fijos) si no hay controlador
            this.timer--;
            if (this.timer < 0) this._defaultTransition();
        }
    }

    setMode(newMode, duration) {
        this.mode = newMode;
        this.timer = duration;
    }

    _defaultTransition() {
        const MODES = TrafficLight.MODES;
        switch (this.mode) {
            case MODES.PRINCIPAL:
                this.setMode(MODES.AMARILLO, this.config.amarillo);
                break;
            case MODES.AMARILLO:
                // Decidir cuál mano horizontal activar
                if (this.nextHorizontalPhase === 'left') {
                    this.setMode(MODES.HORIZONTAL_LEFT, this.config.horzGreen);
                } else if (this.nextHorizontalPhase === 'right') {
                    this.setMode(MODES.HORIZONTAL_RIGHT, this.config.horzGreen);
                } else {
                    // Sin preferencia, empezar con izquierda
                    this.setMode(MODES.HORIZONTAL_LEFT, this.config.horzGreen);
                }
                break;
            case MODES.HORIZONTAL_LEFT:
                this.setMode(MODES.AMARILLO_HL, this.config.amarillo);
                break;
            case MODES.AMARILLO_HL:
                // Volver a principal y resetear timers
                this.setMode(MODES.PRINCIPAL, this.config.priGreen);
                this.emergencyTimer = this.config.priGreen;
                this.minimumTimer = this.config.priMinimum;
                this.nextHorizontalPhase = null;
                break;
            case MODES.HORIZONTAL_RIGHT:
                this.setMode(MODES.AMARILLO_HR, this.config.amarillo);
                break;
            case MODES.AMARILLO_HR:
                // Volver a principal y resetear timers
                this.setMode(MODES.PRINCIPAL, this.config.priGreen);
                this.emergencyTimer = this.config.priGreen;
                this.minimumTimer = this.config.priMinimum;
                this.nextHorizontalPhase = null;
                break;
        }
    }

    canPass(roadType) {
        if (roadType === 'main') {
            return this.mode === TrafficLight.MODES.PRINCIPAL;
        } else if (roadType === 'horizontal-left') {
            return this.mode === TrafficLight.MODES.HORIZONTAL_LEFT;
        } else if (roadType === 'horizontal-right') {
            return this.mode === TrafficLight.MODES.HORIZONTAL_RIGHT;
        }
        return false;
    }

    // Puentes hacia el controlador para eventos de sensores
    triggerHorizontalChange(direction, timeElapsed) {
        if (this.controller) {
            this.controller.onSensorEvent(`car_detected_${direction}`, { timeElapsed });
        }
    }

    extendHorizontalGreen(direction, carsCount) {
        if (this.controller) {
            this.controller.onSensorEvent(`car_passed_${direction}`, { count: carsCount });
        }
    }

    getState() {
        let statusText = '';
        switch (this.mode) {
            case TrafficLight.MODES.PRINCIPAL: statusText = 'Principal Verde'; break;
            case TrafficLight.MODES.AMARILLO: statusText = 'Cambio a Horizontal...'; break;
            case TrafficLight.MODES.HORIZONTAL_LEFT: statusText = 'Horizontal Izq Verde'; break;
            case TrafficLight.MODES.AMARILLO_HL: statusText = 'Cambio a Principal...'; break;
            case TrafficLight.MODES.HORIZONTAL_RIGHT: statusText = 'Horizontal Der Verde'; break;
            case TrafficLight.MODES.AMARILLO_HR: statusText = 'Cambio a Principal...'; break;
        }

        return {
            mode: this.mode,
            timer: this.timer >= 0 ? this.timer : 0,
            emergencyTimer: this.emergencyTimer >= 0 ? this.emergencyTimer : 0,
            minimumTimer: this.minimumTimer >= 0 ? this.minimumTimer : 0,
            nextHorizontalPhase: this.nextHorizontalPhase,
            statusText: statusText
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    reset() {
        this.mode = TrafficLight.MODES.PRINCIPAL;
        this.timer = this.config.priGreen;
        this.emergencyTimer = this.config.priGreen;
        this.minimumTimer = this.config.priMinimum;
        this.nextHorizontalPhase = null;
    }
}
