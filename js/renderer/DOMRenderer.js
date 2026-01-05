/**
 * DOMRenderer.js
 * Implementación del renderizado usando el DOM (HTML/CSS).
 * 
 * Mueve toda la manipulación directa de elementos HTML que antes estaba
 * dispersa en Car, TrafficLight y Simulator a este módulo.
 */

class DOMRenderer extends Renderer {
    constructor(scene) {
        super(scene);
        this.carElements = new Map(); // Mapa de Car -> Elemento DOM

        // Almacenamos los elementos de semáforos
        this.lightElements = {
            pri1: document.getElementById('pri1'),
            pri2: document.getElementById('pri2'),
            sec1: document.getElementById('sec1'),
            sec2: document.getElementById('sec2')
        };
    }

    /**
     * Implementación visual de los autos en el DOM
     */
    createCar(car) {
        const el = document.createElement('div');
        el.className = `car ${car.color}`;
        el.innerHTML = `
            <div class="light light-l"></div>
            <div class="light light-r"></div>
            <div class="turn-signal turn-left"></div>
            <div class="turn-signal turn-right"></div>
        `;

        this.scene.appendChild(el);
        this.carElements.set(car, el);
        this._updatePos(car, el);
    }

    updateCar(car) {
        const el = this.carElements.get(car);
        if (el) {
            this._updatePos(car, el);

            // Actualizar luces de giro
            const leftSignal = el.querySelector('.turn-left');
            const rightSignal = el.querySelector('.turn-right');

            leftSignal.classList.toggle('blinking', car.turnActive && car.turnType === 'left');
            rightSignal.classList.toggle('blinking', car.turnActive && car.turnType === 'right');
        }
    }

    _updatePos(car, el) {
        el.style.left = car.x + 'px';
        el.style.top = car.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${car.angle}deg)`;
    }

    removeCar(car) {
        const el = this.carElements.get(car);
        if (el) {
            el.remove();
            this.carElements.delete(car);
        }
    }

    /**
     * Actualiza las clases CSS de las luces de semáforos
     */
    updateTrafficLights(lightsState) {
        // Limpiar todas las luces primero
        document.querySelectorAll('.bulb').forEach(b => b.className = 'bulb');

        const mode = lightsState.mode;

        switch (mode) {
            case 'principal':
                this._setBulb('pri1', 'green');
                this._setBulb('pri2', 'green');
                this._setBulb('sec1', 'red');
                this._setBulb('sec2', 'red');
                break;
            case 'amarillo':
                this._setBulb('pri1', 'yellow');
                this._setBulb('pri2', 'yellow');
                this._setBulb('sec1', 'red');
                this._setBulb('sec2', 'red');
                break;
            case 'secundaria':
                this._setBulb('sec1', 'green');
                this._setBulb('sec2', 'green');
                this._setBulb('pri1', 'red');
                this._setBulb('pri2', 'red');
                break;
            case 'amarillo_sec':
                this._setBulb('sec1', 'yellow');
                this._setBulb('sec2', 'yellow');
                this._setBulb('pri1', 'red');
                this._setBulb('pri2', 'red');
                break;
        }
    }

    _setBulb(lightId, color) {
        const index = color === 'red' ? 1 : color === 'yellow' ? 2 : 3;
        const bulb = this.lightElements[lightId].querySelector(`.bulb:nth-child(${index})`);
        if (bulb) bulb.classList.add(color);
    }

    clear() {
        this.carElements.forEach(el => el.remove());
        this.carElements.clear();
        // Reset semáforos a rojo visual
        this.updateTrafficLights({ mode: 'amarillo' }); // temporal para dejarlo en un estado conocido
    }
}
