/**
 * Sensor.js
 * Responsabilidad: Detección direccional de vehículos (Izquierda vs Derecha)
 */

class Sensor {
    constructor(trafficLight) {
        this.trafficLight = trafficLight;
        this.leftCarCount = 0;   // Contador de autos que cruzan por izquierda
        this.rightCarCount = 0;  // Contador de autos que cruzan por derecha

        // Definimos las áreas de los sensores matemáticamente (Bounding Boxes)
        // SENSOR IZQUIERDO: detecta autos viniendo del oeste (izquierda) yendo al este
        this.leftSensorArea = { x1: 270, y1: 335, x2: 320, y2: 375 };

        // SENSOR DERECHO: detecta autos viniendo del este (derecha) yendo al oeste
        this.rightSensorArea = { x1: 580, y1: 285, x2: 630, y2: 325 };
    }

    detect(cars) {
        const state = this.trafficLight.getState();
        const horizontalCars = cars.filter(c => c.type === 'secondary');

        // Variables para detectar primer sensor activado
        let leftSensorActive = false;
        let rightSensorActive = false;

        horizontalCars.forEach(car => {
            const overLeftSensor = this._checkOverlap(car, this.leftSensorArea);
            const overRightSensor = this._checkOverlap(car, this.rightSensorArea);

            // DETECCIÓN EN FASE PRINCIPAL
            if (state.mode === 'principal') {
                // Auto sobre sensor izquierdo
                if (overLeftSensor && !car.inLeftSensor) {
                    car.inLeftSensor = true;
                    leftSensorActive = true;
                    console.log("🔵 Sensor IZQUIERDO activado");
                }

                // Auto sobre sensor derecho
                if (overRightSensor && !car.inRightSensor) {
                    car.inRightSensor = true;
                    rightSensorActive = true;
                    console.log("🔴 Sensor DERECHO activado");
                }

                // Resetear flags cuando sale del sensor
                if (!overLeftSensor && car.inLeftSensor) {
                    car.inLeftSensor = false;
                }
                if (!overRightSensor && car.inRightSensor) {
                    car.inRightSensor = false;
                }
            }

            // CONTEO EN FASE HORIZONTAL IZQUIERDA
            if (state.mode === 'horizontal_left') {
                if (overLeftSensor && !car.inLeftSensor) {
                    car.inLeftSensor = true;
                } else if (!overLeftSensor && car.inLeftSensor) {
                    // Auto salió del sensor → cruzó exitosamente
                    car.inLeftSensor = false;
                    this.leftCarCount++;
                    this.trafficLight.extendHorizontalGreen('left', this.leftCarCount);
                    console.log(`✅ Auto ${this.leftCarCount} cruzó por IZQUIERDA`);
                }
            }

            // CONTEO EN FASE HORIZONTAL DERECHA
            if (state.mode === 'horizontal_right') {
                if (overRightSensor && !car.inRightSensor) {
                    car.inRightSensor = true;
                } else if (!overRightSensor && car.inRightSensor) {
                    // Auto salió del sensor → cruzó exitosamente
                    car.inRightSensor = false;
                    this.rightCarCount++;
                    this.trafficLight.extendHorizontalGreen('right', this.rightCarCount);
                    console.log(`✅ Auto ${this.rightCarCount} cruzó por DERECHA`);
                }
            }
        });

        // Enviar señal al controlador si hay sensor activado en fase principal
        if (state.mode === 'principal') {
            const timeElapsed = this.trafficLight.config.priGreen - state.timer;

            if (leftSensorActive) {
                this.trafficLight.triggerHorizontalChange('left', timeElapsed);
            }

            if (rightSensorActive) {
                this.trafficLight.triggerHorizontalChange('right', timeElapsed);
            }
        }
    }

    /**
     * Verifica si un auto está sobre un área de sensor específica
     */
    _checkOverlap(car, sensorArea) {
        // Un auto mide aprox 26x48 (o 48x26 si es horizontal)
        const carWidth = car.type === 'main' ? 26 : 48;
        const carHeight = car.type === 'main' ? 48 : 26;

        const carBox = {
            left: car.x,
            right: car.x + carWidth,
            top: car.y,
            bottom: car.y + carHeight
        };

        const overlaps = !(carBox.right < sensorArea.x1 ||
            carBox.left > sensorArea.x2 ||
            carBox.bottom < sensorArea.y1 ||
            carBox.top > sensorArea.y2);

        return overlaps;
    }

    resetCounter() {
        this.leftCarCount = 0;
        this.rightCarCount = 0;
    }

    getCount(direction) {
        if (direction === 'left') return this.leftCarCount;
        if (direction === 'right') return this.rightCarCount;
        return 0;
    }

    resetCarSensors(cars) {
        cars.forEach(car => {
            car.inLeftSensor = false;
            car.inRightSensor = false;
        });
    }
}
