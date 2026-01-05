class Car {
    // Constantes de física
    static ACCELERATION = 0.05;
    static DECELERATION = 0.25;
    static MIN_GAP = 85;
    static COLORS = ['blue', 'redc', 'orange', 'greenc'];
    static nextId = 0; // Contador global de IDs

    /**
     * Constructor de un vehículo
     */
    constructor(config) {
        this.id = Car.nextId++; // Asignar ID único
        this.type = config.type;
        this.path = config.path;
        this.turnType = config.turnType || 'straight';
        this.currentWaypointIndex = 0;

        // Posición inicial en el primer waypoint
        const start = this.path[0];
        this.x = start.x;
        this.y = start.y;

        // Propiedades de dirección para compatibilidad temporal
        this.direction = config.direction || 0;
        this.dx = config.dx || 0;
        this.side = config.side;

        // Física del vehículo
        this.maxSpeed = this.type === 'main' ? 1.8 + Math.random() : 2.2;
        this.currentSpeed = 0;
        this.angle = 0;

        // Color aleatorio
        this.color = Car.COLORS[Math.floor(Math.random() * Car.COLORS.length)];

        // Estado de sensor y giro
        this.inSensor = false;
        this.turnActive = false;
        this.stoppedTime = 0; // Para auto-corrección
    }

    /**
     * Actualiza la posición del auto siguiendo su ruta
     */
    update(canMove, otherCars = []) {
        if (this.currentWaypointIndex >= this.path.length - 1) return;

        let hasCollision = this._checkCollisions(otherCars);
        let shouldMove = canMove && !hasCollision;

        if (shouldMove) {
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + Car.ACCELERATION);
            this.stoppedTime = 0;
        } else {
            this.currentSpeed = Math.max(0, this.currentSpeed - Car.DECELERATION);
            if (this.currentSpeed < 0.1) this.currentSpeed = 0;
            if (canMove) this.stoppedTime++; // Solo contamos si el semáforo deja pasar pero algo me frena
        }

        // Activar luz de giro cerca del centro (entre waypoint 0 y 1 si hay curva)
        const centerX = 450, centerY = 325;
        const distToCenter = Math.sqrt((this.x - centerX) ** 2 + (this.y - centerY) ** 2);
        this.turnActive = (this.turnType !== 'straight' && distToCenter < 200 && distToCenter > 30);

        if (this.currentSpeed > 0) {
            this._moveTowardsWaypoint();
        }
    }

    _moveTowardsWaypoint() {
        const target = this.path[this.currentWaypointIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.currentSpeed) {
            this.x = target.x;
            this.y = target.y;
            this.currentWaypointIndex++;
        } else {
            const vx = (dx / distance) * this.currentSpeed;
            const vy = (dy / distance) * this.currentSpeed;
            this.x += vx;
            this.y += vy;

            // Calcular ángulo (en grados)
            // atan2 devuelve radianes, los pasamos a grados
            // Ajustamos +90 para que el "Top" del CSS (donde están las luces) sea el frente
            this.angle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
        }
    }

    _checkCollisions(otherCars) {
        // MODO FANTASMA ULTRA-AGRESIVO: Tras solo 1 segundo trabado (~60 frames)
        // El usuario reportó bloqueos persistentes en giros. Priorizo fluidez absoluta.
        const ghostMode = this.stoppedTime > 60;
        if (ghostMode) {
            console.log(`🚀 Modo Fantasma activado en auto ${this.id} tras ${this.stoppedTime} frames`);
            return false; // Ignoro TODAS las colisiones
        }

        // Recuperación suave
        const selfRecovery = this.stoppedTime > 40;

        for (let other of otherCars) {
            if (other === this) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSq = dx * dx + dy * dy;

            // 1. Distancia de seguridad básica (Círculo de 75px)
            if (distSq < 75 * 75) {
                // Obtenemos nuestro vector de dirección hacia el siguiente waypoint
                const nextWP = this.path[this.currentWaypointIndex + 1];
                if (!nextWP) continue;

                const dirX = nextWP.x - this.x;
                const dirY = nextWP.y - this.y;
                const distToWP = Math.sqrt(dirX * dirX + dirY * dirY);
                const vx = dirX / distToWP;
                const vy = dirY / distToWP;

                // 2. Producto punto para ver si el otro auto está EN MI CAMINO
                // (positivo significa está adelante, negativo significa está atrás)
                const dot = dx * vx + dy * vy;

                // 3. Distancia lateral (qué tan a la izquierda/derecha está de mi línea de visión)
                const lateralDist = Math.abs(dx * (-vy) + dy * vx);

                // CASO A: MISMO CARRIL (Seguimiento lineal)
                // Si está adelante (dot > 0) y alineado lateralmente
                if (dot > 0 && lateralDist < 35) {
                    // Si está en el gap de frenado, frenamos obligatoriamente
                    if (dot < 80) return true;
                }

                // CASO B: CONFLICTO DE CRUCE (Intersección)
                else if (!selfRecovery && distSq < 110 * 110 && dot > -20) {
                    const centerX = 450, centerY = 325;
                    const toCenter = { x: centerX - this.x, y: centerY - this.y };
                    const distCenter = Math.sqrt(toCenter.x ** 2 + toCenter.y ** 2);

                    const vel = nextWP ? { x: nextWP.x - this.x, y: nextWP.y - this.y } : { x: 0, y: 0 };
                    const velMag = Math.sqrt(vel.x ** 2 + vel.y ** 2) || 1;
                    const dotCenter = (vel.x / velMag) * (toCenter.x / distCenter) + (vel.y / velMag) * (toCenter.y / distCenter);

                    const otherToCenter = { x: centerX - other.x, y: centerY - other.y };
                    const otherDistCenter = Math.sqrt(otherToCenter.x ** 2 + otherToCenter.y ** 2);

                    // --- REGLA 1: PRIORIDAD DE SALIDA ---
                    // Si ya me estoy alejando del centro, ¡Acelero y salgo! No cedo paso.
                    if (dotCenter < 0) continue;

                    // --- REGLA 2: JERARQUÍA VIAL (CON EXCEPCIÓN DE GIRO COMPROMETIDO) ---
                    // Secundario cede a Principal... SALVO que ya esté girando activamente.
                    // Si mi luz de giro está encendida, es porque ya me comprometí. Debo terminar.
                    if (this.type === 'secondary' && other.type === 'main') {
                        // Solo cedo si estoy REALMENTE lejos (>120px) y NO estoy girando
                        if (distCenter > 120 && !this.turnActive) {
                            return true; // Espero antes de entrar
                        }
                        // Si distCenter <= 120 o turnActive, estoy comprometido. AVANZO.
                    }
                    if (this.type === 'main' && other.type === 'secondary') {
                        // Soy Principal. Solo freno si hay colisión física inminente (Caso A).
                    }

                    // --- REGLA 3: GIRO A LA IZQUIERDA (LEFT TURN YIELD) ---
                    // Solo aplica entre pares iguales (Main vs Main, Sec vs Sec) o si la jerarquía no decidió.
                    if (this.type === other.type) {
                        const opposed = Math.abs(this.angle - other.angle) > 135 && Math.abs(this.angle - other.angle) < 225;
                        // Si vengo de frente y voy a girar a la izquierda...
                        if (this.turnType === 'left' && opposed) {
                            // Cedo ante quien sigue recto o gira a la derecha
                            if (other.turnType === 'straight' || other.turnType === 'right') {
                                return true;
                            }
                        }
                    }

                    // --- REGLA 4: PRIORIDAD BASE (CERCANÍA) ---
                    // El que esté más cerca del centro gana.
                    if (otherDistCenter < distCenter) {
                        return true; // El otro está más adelante en la maniobra, le dejo terminar
                    }
                }
            }
        }
        return false;
    }

    shouldRemove() {
        return this.currentWaypointIndex >= this.path.length - 1;
    }

    getPosition() {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            turnActive: this.turnActive,
            turnType: this.turnType
        };
    }
}
