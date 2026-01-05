/**
 * Sensor.js
 * Responsabilidad: Detección de vehículos (Lógica Matemática)
 */

class Sensor {
    constructor(trafficLight) {
        this.trafficLight = trafficLight;
        this.secondaryCarCount = 0;

        // Definimos las áreas de los sensores matemáticamente (Bounding Boxes)
        // Basado en las posiciones visuales del original
        this.sensorAreas = [
            { x1: 580, y1: 285, x2: 630, y2: 325 }, // Sensor 2 (Derecha)
            { x1: 270, y1: 335, x2: 320, y2: 375 }  // Sensor 1 (Izquierda)
        ];
    }

    detect(cars) {
        const config = this.trafficLight.config;
        const state = this.trafficLight.getState();
        const secondaryCars = cars.filter(c => c.type === 'secondary');

        secondaryCars.forEach(car => {
            const isOverSensor = this._checkOverlap(car);

            if (state.mode === 'principal' && isOverSensor && !car.inSensor) {
                car.inSensor = true;
                const timeElapsed = config.priGreen - state.timer;
                this.trafficLight.triggerSecondaryChange(timeElapsed);
            }

            if (state.mode === 'secundaria') {
                if (isOverSensor && !car.inSensor) {
                    car.inSensor = true;
                } else if (!isOverSensor && car.inSensor) {
                    car.inSensor = false;
                    this.secondaryCarCount++;
                    this.trafficLight.extendSecondaryGreen(this.secondaryCarCount);
                }
            }
        });
    }

    /**
     * Verifica si un auto está sobre un área de sensor usando matemáticas
     */
    _checkOverlap(car) {
        // Un auto mide aprox 26x48 (o 48x26 si es horizontal)
        const carWidth = car.type === 'main' ? 26 : 48;
        const carHeight = car.type === 'main' ? 48 : 26;

        const carBox = {
            left: car.x,
            right: car.x + carWidth,
            top: car.y,
            bottom: car.y + carHeight
        };

        for (let area of this.sensorAreas) {
            const overlaps = !(carBox.right < area.x1 ||
                carBox.left > area.x2 ||
                carBox.bottom < area.y1 ||
                carBox.top > area.y2);

            if (overlaps) return true;
        }

        return false;
    }

    resetCounter() {
        this.secondaryCarCount = 0;
    }

    getCount() {
        return this.secondaryCarCount;
    }

    resetCarSensors(cars) {
        cars.forEach(car => {
            car.inSensor = false;
        });
    }
}
