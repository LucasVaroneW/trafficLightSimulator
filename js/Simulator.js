/**
 * Simulator.js
 * Responsabilidad: Coordinación general (Lógica + Orquestación de Renderer)
 */

class Simulator {
    constructor(config) {
        this.running = false;
        this.cars = [];
        this.renderer = config.renderer;
        this.spawnInterval = 3000; // Configurable desde el panel

        // Referencias a elementos UI (estos siguen siendo DOM porque son controles)
        this.uiElements = {
            autosCount: document.getElementById('autosCount'),
            statusTxt: document.getElementById('statusTxt'),
            timer: document.getElementById('timer')
        };

        // Inicializar módulos de lógica
        this.road = new Road();
        this.trafficLight = new TrafficLight(this._getConfig());
        this.sensor = new Sensor(this.trafficLight);
        this.navigator = new Navigator();

        // Fase 3: Asignar controlador adaptativo por defecto
        const adaptiveCtrl = new AdaptiveController(this.trafficLight);
        this.trafficLight.setController(adaptiveCtrl);

        this.intervals = { tick: null, spawn: null, animation: null };
    }

    _getConfig() {
        return {
            priGreen: parseInt(document.getElementById('txtPri').value),
            secGreen: parseInt(document.getElementById('txtSec').value),
            intervalo: parseInt(document.getElementById('txtInt').value),
            maxAutosSec: parseInt(document.getElementById('txtMaxAutos').value),
            amarillo: 1
        };
    }

    start() {
        if (this.running) return;
        this.running = true;

        const config = this._getConfig();
        this.trafficLight.updateConfig(config);
        this.trafficLight.reset();

        this.intervals.tick = setInterval(() => this._tick(), 1000);
        this._scheduleMainCarSpawn();
        this._updateLoop();
        this._updateUI();
    }

    stop() {
        this.running = false;
        clearInterval(this.intervals.tick);
        clearTimeout(this.intervals.spawn);
        cancelAnimationFrame(this.intervals.animation);

        // Limpiar visualmente y lógicamente
        this.cars.forEach(car => this.renderer.removeCar(car));
        this.cars = [];
        this.sensor.resetCounter();
        this.trafficLight.reset();
        this.renderer.clear();

        this.uiElements.statusTxt.textContent = 'Estado: Inactivo';
        this.uiElements.autosCount.textContent = '0';
        this.uiElements.timer.textContent = 'Tiempo: ' + document.getElementById('txtPri').value;
    }

    _updateLoop() {
        if (!this.running) return;

        const mode = this.trafficLight.mode;

        // Actualizar Lógica -> Enviar a Renderer
        this.cars.forEach(car => {
            let canMove = true;

            // REGLA DE DESPEJE: Si ya entró en la intersección, DEBE seguir (ignora semáforo)
            const inIntersection = this.road.isInIntersection(car.x, car.y);

            if (!inIntersection) {
                if (car.type === 'main') {
                    if (!this.trafficLight.canPass('main') && this.road.isInStopZone(car, mode)) canMove = false;
                } else {
                    if (!this.trafficLight.canPass('secondary') && this.road.isInStopZone(car, mode)) canMove = false;
                }
            }

            car.update(canMove, this.cars);
            this.renderer.updateCar(car);
        });

        // Detección de sensores (Lógica Matemática)
        this.sensor.detect(this.cars);

        // Actualizar visual de semáforos
        this.renderer.updateTrafficLights(this.trafficLight.getState());

        // Eliminar autos
        this.cars = this.cars.filter(car => {
            if (car.shouldRemove()) {
                this.renderer.removeCar(car);
                return false;
            }
            return true;
        });

        this.intervals.animation = requestAnimationFrame(() => this._updateLoop());
    }

    _tick() {
        if (!this.running) return;
        const oldMode = this.trafficLight.mode;
        this.trafficLight.tick();
        const newMode = this.trafficLight.mode;

        if (oldMode !== 'secundaria' && newMode === 'secundaria') {
            this.sensor.resetCounter();
        }

        if (oldMode !== 'principal' && newMode === 'principal') {
            // Forzar re-detección de autos que llegaron durante el rojo
            // Esto asegura que si un auto espera en el sensor, dispare el evento inmediatamente
            this.sensor.resetCarSensors(this.cars);
        }

        this._checkDeadlocks(); // Nueva supervisión
        this._updateUI();
    }

    /**
     * Supervisa colapsos de tráfico y aplica nudges de emergencia
     */
    _checkDeadlocks() {
        // Si hay un auto trabado por mucho tiempo en la intersección
        // le damos un pequeño "nudge" visual o forzamos su avance.
        // La propia lógica de Car.js (GhostMode) ya hace el trabajo pesado,
        // pero aquí podríamos implementar limpiezas de emergencia si fuera necesario.
        const stuckCars = this.cars.filter(c => c.stoppedTime > 400);
        if (stuckCars.length > 2) {
            console.warn("Detectado posible colapso de tráfico. Limpiando intersección...");
            // Forzamos a todos a avanzar un poco si la situación es crítica
            // stk.stoppedTime = 0; 
        }
    }

    _scheduleMainCarSpawn() {
        if (!this.running) return;

        const direction = Math.random() > 0.5 ? 1 : -1;
        const routeData = this.navigator.getRandomRoute('main', direction);

        const car = new Car({
            type: 'main',
            direction: direction,
            path: routeData.path,
            turnType: routeData.turnType
        });

        this.cars.push(car);
        this.renderer.createCar(car);

        this.intervals.spawn = setTimeout(() => this._scheduleMainCarSpawn(), this.spawnInterval);
    }

    spawnSecondaryCar(side) {
        if (!this.running) return;

        // Verificar si el área de spawn está despejada para evitar que se bloqueen al nacer
        const spawnX = side === 'left' ? -100 : 1000;
        const spawnY = side === 'left' ? 365 : 285;

        const isBlocked = this.cars.some(car => {
            const dx = car.x - spawnX;
            const dy = car.y - spawnY;
            return Math.sqrt(dx * dx + dy * dy) < 100;
        });

        if (isBlocked) {
            console.warn("Área de spawn bloqueada. Espera a que el auto actual avance.");
            return;
        }

        const routeData = this.navigator.getRandomRoute('secondary', side);
        const dx = (side === 'left') ? 1 : -1;

        const car = new Car({
            type: 'secondary',
            side: side,
            dx: dx,
            path: routeData.path,
            turnType: routeData.turnType
        });

        this.cars.push(car);
        this.renderer.createCar(car);
        console.log(`Auto secundario añadido por la ${side}.`);
    }

    setTrafficMode(mode) {
        let controller;
        if (mode === 'fixed') {
            controller = new FixedTimeController(this.trafficLight);
        } else {
            controller = new AdaptiveController(this.trafficLight);
        }
        this.trafficLight.setController(controller);
        console.log(`Modo de tráfico cambiado a: ${mode}`);
    }

    _updateUI() {
        const state = this.trafficLight.getState();

        // Formato mejorado del estado
        let statusText = 'Inactivo';
        if (this.running) {
            const modeNames = {
                'principal': '🟢 Verde Principal',
                'amarillo': '🟡 Amarillo Principal',
                'secundaria': '🟢 Verde Secundaria',
                'amarillo_sec': '🟡 Amarillo Secundaria'
            };
            statusText = modeNames[state.mode] || state.statusText;
        }

        this.uiElements.statusTxt.textContent = statusText;
        this.uiElements.timer.textContent = state.timer + 's';
        this.uiElements.autosCount.textContent = this.sensor.getCount();
    }
}
