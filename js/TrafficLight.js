/**
 * TrafficLight.js
 * Responsabilidad: Lógica de control de semáforos (Solo Lógica)
 */

class TrafficLight {
    static MODES = {
        PRINCIPAL: 'principal',
        AMARILLO: 'amarillo',
        SECUNDARIA: 'secundaria',
        AMARILLO_SEC: 'amarillo_sec'
    };

    constructor(config) {
        this.config = {
            priGreen: config.priGreen || 120,
            secGreen: config.secGreen || 5,
            intervalo: config.intervalo || 30,
            maxAutosSec: config.maxAutosSec || 5,
            amarillo: 1
        };

        this.mode = TrafficLight.MODES.PRINCIPAL;
        this.timer = this.config.priGreen;

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
            case MODES.PRINCIPAL: this.setMode(MODES.AMARILLO, this.config.amarillo); break;
            case MODES.AMARILLO: this.setMode(MODES.SECUNDARIA, this.config.secGreen); break;
            case MODES.SECUNDARIA: this.setMode(MODES.AMARILLO_SEC, this.config.amarillo); break;
            case MODES.AMARILLO_SEC: this.setMode(MODES.PRINCIPAL, this.config.priGreen); break;
        }
    }

    canPass(roadType) {
        if (roadType === 'main') {
            return this.mode === TrafficLight.MODES.PRINCIPAL;
        } else {
            return this.mode === TrafficLight.MODES.SECUNDARIA;
        }
    }

    // Puentes hacia el controlador para eventos de sensores
    triggerSecondaryChange(timeElapsed) {
        if (this.controller) {
            this.controller.onSensorEvent('car_detected_secondary', { timeElapsed });
        }
    }

    extendSecondaryGreen(carsCount) {
        if (this.controller) {
            this.controller.onSensorEvent('car_passed_secondary', { count: carsCount });
        }
    }

    getState() {
        let statusText = '';
        switch (this.mode) {
            case TrafficLight.MODES.PRINCIPAL: statusText = 'Principal Verde'; break;
            case TrafficLight.MODES.AMARILLO:
            case TrafficLight.MODES.AMARILLO_SEC: statusText = 'Cambio...'; break;
            case TrafficLight.MODES.SECUNDARIA: statusText = 'Secundaria Verde'; break;
        }

        return {
            mode: this.mode,
            timer: this.timer >= 0 ? this.timer : 0,
            statusText: statusText
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    reset() {
        this.mode = TrafficLight.MODES.PRINCIPAL;
        this.timer = this.config.priGreen;
    }
}
