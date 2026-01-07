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
        // Autos principales más rápidos para evitar congestión
        this.maxSpeed = this.type === 'main' ? 2.3 + Math.random() : 2.2;
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

        // --- LÓGICA DE DECISIÓN (BRAIN) ---
        let shouldAccel = true;
        let stopReason = null;

        // 1. Semáforo / Stop Zone
        if (!canMove) { // provided by Simulator based on lights & STOP zone overlap
            shouldAccel = false;
            stopReason = 'LIGHT';
        }

        // 2. Colisiones Inmediatas (Coche de adelante)
        const collision = this._checkCollisions(otherCars);
        if (collision) {
            shouldAccel = false;
            stopReason = 'COLLISION';
        }

        // 3. REGLA DE CAJA AMARILLA (Yellow Box) - FASE 7
        // Si tengo luz verde (canMove es true) PERO estoy a punto de entrar al cruce...
        // debo verificar si tengo salida.
        if (shouldAccel && this._isApproachingIntersection()) {
            const exitClear = this._checkExitClear(otherCars);
            if (!exitClear) {
                shouldAccel = false;
                stopReason = 'YELLOW_BOX';
                // console.log(`Auto ${this.id} esperando por Yellow Box Rule`);
            }
        }

        // --- FÍSICA (BODY) ---
        if (shouldAccel) {
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + Car.ACCELERATION);
            this.stoppedTime = 0;
        } else {
            this.currentSpeed = Math.max(0, this.currentSpeed - Car.DECELERATION);
            if (this.currentSpeed < 0.1) this.currentSpeed = 0;
            // Solo contamos tiempo detenido si NO es por semáforo (es decir, bloqueo real)
            if (canMove || stopReason === 'YELLOW_BOX') this.stoppedTime++;
        }

        // Activar luz de giro cerca del centro (entre waypoint 0 y 1 si hay curva)
        const centerX = 450, centerY = 325;
        const distToCenter = Math.sqrt((this.x - centerX) ** 2 + (this.y - centerY) ** 2);
        this.turnActive = (this.turnType !== 'straight' && distToCenter < 200 && distToCenter > 30);

        if (this.currentSpeed > 0) {
            this._moveTowardsWaypoint();
        }
    }

    _isApproachingIntersection() {
        // Simple: Si estoy cerca del centro pero aún no he entrado
        // Distancia al centro < 140 (aprox stop line) y > 100 (inicio cruce real)
        const centerX = 450, centerY = 325;
        const dist = Math.sqrt((this.x - centerX) ** 2 + (this.y - centerY) ** 2);
        return dist < 140 && dist > 110;
    }

    _checkExitClear(otherCars) {
        // Determinar zona de salida basada en mi dirección final (después del giro)
        // Simplificación: Miramos mi último waypoint o deducimos.
        // O más robusto: Si soy 'main' y voy recto, mi salida es 'STRAIGHT_...'

        // Estrategia simplificada para RHT:
        // Si voy al Norte, reviso x=490, y < 265
        // Si voy al Sur, reviso x=410, y > 385
        // Si voy al Este, reviso y=365, x > 530
        // Si voy al Oeste, reviso y=285, x < 370

        let targetZone = null;

        // Deducir dirección final
        // Si voy recto main up (-1) -> Norte
        // Si giro derecha main up -> Este
        // Si giro izq main up -> Oeste

        // Lógica bruta basada en path final:
        const lastWP = this.path[this.path.length - 1];

        if (lastWP.y < 0) { // Norte
            targetZone = { x: 490, yMin: -999, yMax: 275, vertical: true };
        } else if (lastWP.y > 700) { // Sur
            targetZone = { x: 410, yMin: 375, yMax: 999, vertical: true };
        } else if (lastWP.x > 900) { // Este
            targetZone = { y: 365, xMin: 520, xMax: 999, vertical: false };
        } else if (lastWP.x < 0) { // Oeste
            targetZone = { y: 285, xMin: -999, xMax: 380, vertical: false };
        }

        if (!targetZone) return true; // No sé a dónde voy, asumo libre (fallback)

        // Verificar si hay alguien ESTANCADO en esa zona
        // Un auto moviéndose rápido no cuenta como bloqueo, pero uno lento o parado sí.
        const blockedBy = otherCars.find(c => {
            if (c === this) return false;

            // Chequear si 'c' está en targetZone
            let inZone = false;
            if (targetZone.vertical) {
                // Margen lateral de 20px
                inZone = Math.abs(c.x - targetZone.x) < 30 && c.y >= targetZone.yMin && c.y <= targetZone.yMax;
            } else {
                inZone = Math.abs(c.y - targetZone.y) < 30 && c.x >= targetZone.xMin && c.x <= targetZone.xMax;
            }

            // Si está en la zona y está lento/parado (< 0.5 vel), es un bloqueo.
            // Si se mueve rápido, asumimos que liberará el espacio.
            return inZone && c.currentSpeed < 0.5;
        });

        return !blockedBy;
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

            // Calcular ángulo objetivo
            const targetAngle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;

            // Interpolación suave del ángulo con easing
            const angleDiff = this._normalizeAngle(targetAngle - this.angle);

            // Velocidad de rotación adaptativa basada en la diferencia angular
            // Más rápido al principio, más lento al final (easing out)
            const maxRotationSpeed = 15; // Grados por frame
            const minRotationSpeed = 3;  // Grados por frame

            // Función de easing: cuanto mayor es angleDiff, mayor es la velocidad
            const t = Math.min(Math.abs(angleDiff) / 90, 1); // Normalizar a [0,1]
            const easedSpeed = minRotationSpeed + (maxRotationSpeed - minRotationSpeed) * t;

            if (Math.abs(angleDiff) < easedSpeed) {
                this.angle = targetAngle;
            } else {
                this.angle += Math.sign(angleDiff) * easedSpeed;
                this.angle = this._normalizeAngle(this.angle);
            }
        }
    }

    /**
     * Normaliza un ángulo para mantenerlo en el rango [-180, 180]
     */
    _normalizeAngle(angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
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
                    // Solo aplica entre pares iguales (Main vs Main, Sec vs Sec) o si lajerarquía no decidió.
                    if (this.type === other.type) {
                        const opposed = Math.abs(this.angle - other.angle) > 135 && Math.abs(this.angle - other.angle) < 225;
                        // Si vengo de frente y voy a girar a la izquierda...
                        if (this.turnType === 'left' && opposed) {
                            // Cedo ante quien sigue recto o gira a la derecha
                            // OPTIMIZACIÓN RHT: Solo ceder si está MUY cerca (< 85px).
                            // Si está a 100px, hay hueco para pasar.
                            if (distSq < 85 * 85) {
                                if (other.turnType === 'straight' || other.turnType === 'right') {
                                    return true;
                                }
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
