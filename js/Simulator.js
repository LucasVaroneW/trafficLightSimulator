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
            statusTxt: document.getElementById('statusTxt'),
            timer: document.getElementById('timer'),
            intervalDisplay: document.getElementById('intervalDisplay')
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
            priGreen: parseInt(document.getElementById('txtPriMax').value),
            horzGreen: parseInt(document.getElementById('txtHorz').value),
            priMinimum: parseInt(document.getElementById('txtPriMin').value),
            maxAutosHorz: parseInt(document.getElementById('txtMaxAutos').value),
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
                    // Determinar qué mano horizontal es (left o right) basado en posición
                    const isLeft = car.side === 'left';
                    const roadType = isLeft ? 'horizontal-left' : 'horizontal-right';
                    if (!this.trafficLight.canPass(roadType) && this.road.isInStopZone(car, mode)) canMove = false;
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

        if (oldMode !== 'horizontal_left' && newMode === 'horizontal_left') {
            this.sensor.resetCounter();
        }
        if (oldMode !== 'horizontal_right' && newMode === 'horizontal_right') {
            this.sensor.resetCounter();
        }

        if (oldMode !== 'principal' && newMode === 'principal') {
            // Forzar re-detección de autos que llegaron durante el rojo
            this.sensor.resetCarSensors(this.cars);
        }

        this._checkDeadlocks(); // Nueva supervisión
        this._updateUI();
    }

    /**
     * Supervisa colapsos de tráfico y aplica nudges de emergencia
     */
    _checkDeadlocks() {
        this._resolveDeadlocks();
    }

    /**
     * Árbitro Global de Intersección ("Deadlock Breaker")
     * Detecta nudos de tráfico (A bloquea a B, B a C...) y fuerza una salida.
     */
    _resolveDeadlocks() {
        // 1. Definir "Kill Zone" (El cuadrado central de la muerte)
        // Coordenadas aproximadas del cruce de calles
        const killZone = { xMin: 370, xMax: 530, yMin: 245, yMax: 405 };
        const centerX = 450, centerY = 325;

        // 2. Buscar autos TRABADOS en la zona
        const stuckCars = this.cars.filter(car => {
            const inZone = car.x > killZone.xMin && car.x < killZone.xMax &&
                car.y > killZone.yMin && car.y < killZone.yMax;

            // Criterio de "Trabado": Velocidad nula y lleva tiempo detenido (> 3 segs / 180 frames)
            // Nota: stoppedTime se incrementa si canMove es true pero no avanza.
            return inZone && car.currentSpeed < 0.2 && car.stoppedTime > 180;
        });

        // 3. Si hay un nudo (2 o más autos bloqueados mutuamente)
        if (stuckCars.length >= 2) {
            // Estrategia: "Salida del más apto".
            // Priorizamos al que esté más cerca de SALIR (más lejos del centro).
            // Esto ayuda a "descascarar" el nudo desde afuera.
            stuckCars.sort((a, b) => {
                const distA = (a.x - centerX) ** 2 + (a.y - centerY) ** 2;
                const distB = (b.x - centerX) ** 2 + (b.y - centerY) ** 2;
                return distB - distA; // Descendente: Mayor distancia primero
            });

            const winner = stuckCars[0];

            if (!winner.forcedPriority) {
                console.warn(`👮‍♂️ Árbitro Interviene: Ordenando al Auto ${winner.id} que despeje INMEDIATAMENTE.`);
                winner.forcedPriority = true;
                winner.color = 'orange'; // Visual feedback: Se pone en modo alerta
                // Reset de stoppedTime para que la física agresiva actúe sin entrar en GhostMode todavía
                winner.stoppedTime = 0;

                // Forzar actualización visual inmediata para ver el cambio de color
                this.renderer.removeCar(winner);
                this.renderer.createCar(winner);
            }
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
                'amarillo': '🟡 Cambio a Horizontal',
                'horizontal_left': '🟢 Verde Horizontal Izq',
                'amarillo_hl': '🟡 Cambio a Principal',
                'horizontal_right': '🟢 Verde Horizontal Der',
                'amarillo_hr': '🟡 Cambio a Principal'
            };
            statusText = modeNames[state.mode] || state.statusText;
            // Actualizar timer
            // REQUEST: Mostrar solo un tiempo (el máximo descontando)
            // Ejemplo: 120 bajando...
            let timerValue = 0;
            const currentLight = this.trafficLight.getState();

            if (currentLight.mode === 'principal') {
                // En verde principal, mostramos el timer de emergencia (cuenta regresiva)
                timerValue = Math.ceil(currentLight.emergencyTimer);
            } else {
                // En otras fases, mostrar el timer genérico de la fase
                timerValue = Math.ceil(currentLight.timer);
            }

            this.uiElements.timer.textContent = timerValue + 's';

            // Actualizar display de intervalo (mínimo)
            const intervalVal = state.minimumTimer > 0 ? Math.ceil(state.minimumTimer) : 0;
            this.uiElements.intervalDisplay.textContent = intervalVal + 's';
        }

        // Mostrar conteo total de ambas manos
        const leftCount = this.sensor.getCount('left');
        const rightCount = this.sensor.getCount('right');
        this.uiElements.autosCount.textContent = leftCount + rightCount;
    }
}
