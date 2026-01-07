/**
 * Navigator.js
 * Responsabilidad: Definir y proveer rutas (secuencias de waypoints) para los vehículos.
 */

class Navigator {
    constructor() {
        // Puntos de entrada y salida (basados en Road.js)
        // Puntos de entrada y salida (Ajustados para centrar en carril de 80px)
        // Avenida Principal (Ancho 160, Centro 450) -> Carriles en 410 y 490
        // Avenida Secundaria (Ancho 120, Centro 325) -> Carriles en 285 y 365
        // Puntos de entrada y salida (Alineación perfecta para tráfico por la derecha)
        // Puntos de entrada y salida (Alineación RHT - Mano Derecha)
        // Main Road Lane West (410): BAJA (Sur) ⬇️
        // Main Road Lane East (490): SUBE (Norte) ⬆️
        this.POINTS = {
            // Norte (Arriba)
            NORTH_IN: { x: 410, y: -100 },  // Entrada para bajar al Sur
            NORTH_OUT: { x: 490, y: -200 }, // Salida viniendo del Sur

            // Sur (Abajo)
            SOUTH_IN: { x: 490, y: 750 },   // Entrada para subir al Norte
            SOUTH_OUT: { x: 410, y: 900 },  // Salida viniendo del Norte

            // Oeste (Izquierda) - INTOCADO
            WEST_IN: { x: -100, y: 365 },   // Entrada para ir al Este (Abajo)
            WEST_OUT: { x: -200, y: 285 },  // Salida viniendo del Este (Arriba)

            // Este (Derecha) - INTOCADO
            EAST_IN: { x: 1000, y: 285 },   // Entrada para ir al Oeste (Arriba)
            EAST_OUT: { x: 1100, y: 365 }   // Salida viniendo del Oeste (Abajo)
        };

        this.ROUTES = this._buildRoutes();
    }

    _buildRoutes() {
        return {
            // --- Rutas Rectas ---
            'STRAIGHT_SOUTH': [this.POINTS.NORTH_IN, this.POINTS.SOUTH_OUT], // 410 -> 410
            'STRAIGHT_NORTH': [this.POINTS.SOUTH_IN, this.POINTS.NORTH_OUT], // 490 -> 490
            'STRAIGHT_EAST': [this.POINTS.WEST_IN, this.POINTS.EAST_OUT],    // 365 -> 365
            'STRAIGHT_WEST': [this.POINTS.EAST_IN, this.POINTS.WEST_OUT],    // 285 -> 285

            // --- Giros a la Derecha (Cerrados - Near Side) ---
            'SOUTH_TO_WEST': [ // Baja (410) -> Dobla Derecha -> Oeste (285)
                this.POINTS.NORTH_IN,
                { x: 410, y: 285 },
                this.POINTS.WEST_OUT
            ],
            'NORTH_TO_EAST': [ // Sube (490) -> Dobla Derecha -> Este (365)
                this.POINTS.SOUTH_IN,
                { x: 490, y: 365 },
                this.POINTS.EAST_OUT
            ],
            'WEST_TO_SOUTH': [ // Derecha (365) -> Dobla Derecha -> Sur (410)
                // Wait, WEST_IN is bottom lane (365)? Check Points.
                // WEST_IN: y=365. Goes East. Correct.
                // Wants to go South (Down). South Out is 410.
                // 365 -> 410.
                this.POINTS.WEST_IN,
                { x: 410, y: 365 },
                this.POINTS.SOUTH_OUT
            ],
            'EAST_TO_NORTH': [ // Izquierda (285) -> Dobla Derecha -> Norte (490)
                // EAST_IN: y=285. Goes West.
                // Wants to go North (Up). North Out is 490.
                this.POINTS.EAST_IN,
                { x: 490, y: 285 },
                this.POINTS.NORTH_OUT
            ],

            // --- Giros a la Izquierda (Abiertos - Far Side - Cruzan Carril) ---
            'SOUTH_TO_EAST': [ // Baja (410) -> Dobla Izquierda -> Este (365)
                this.POINTS.NORTH_IN,
                { x: 410, y: 365 }, // Cruza hasta centro de su carril y destino
                this.POINTS.EAST_OUT
            ],
            'NORTH_TO_WEST': [ // Sube (490) -> Dobla Izquierda -> Oeste (285)
                this.POINTS.SOUTH_IN,
                { x: 490, y: 285 },
                this.POINTS.WEST_OUT
            ],
            'WEST_TO_NORTH': [ // Derecha (365) -> Dobla Izquierda -> Norte (490)
                this.POINTS.WEST_IN,
                { x: 490, y: 365 }, // Cruza
                this.POINTS.NORTH_OUT
            ],
            'EAST_TO_SOUTH': [ // Izquierda (285) -> Dobla Izquierda -> Sur (410)
                this.POINTS.EAST_IN,
                { x: 410, y: 285 },
                this.POINTS.SOUTH_OUT
            ]
        };
    }

    /**
     * Retorna una ruta aleatoria para un tipo de vehículo y entrada
     */
    getRandomRoute(type, sideOrDir) {
        let possibleKeys = [];

        if (type === 'main') {
            // CAMBIO: Autos principales SOLO van directo, NO doblan
            if (sideOrDir === 1) {
                possibleKeys = ['STRAIGHT_SOUTH'];  // Solo sur
            } else {
                possibleKeys = ['STRAIGHT_NORTH'];  // Solo norte
            }
        } else {
            // Autos horizontales pueden doblar o ir directo
            if (sideOrDir === 'left') {
                possibleKeys = ['STRAIGHT_EAST', 'WEST_TO_SOUTH', 'WEST_TO_NORTH'];
            } else {
                possibleKeys = ['STRAIGHT_WEST', 'EAST_TO_NORTH', 'EAST_TO_SOUTH'];
            }
        }

        const key = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];

        // Determinar tipo de giro
        let turnType = 'straight';
        if (key.includes('TO')) {
            // Giros a la IZQUIERDA (cruzan tráfico opuesto)
            const leftTurns = ['NORTH_TO_WEST', 'SOUTH_TO_EAST', 'WEST_TO_NORTH', 'EAST_TO_SOUTH'];
            // Giros a la DERECHA (cerrados, no cruzan)
            const rightTurns = ['NORTH_TO_EAST', 'SOUTH_TO_WEST', 'WEST_TO_SOUTH', 'EAST_TO_NORTH'];

            if (leftTurns.includes(key)) {
                turnType = 'left';
            } else if (rightTurns.includes(key)) {
                turnType = 'right';
            }
        }

        return {
            path: this.ROUTES[key],
            turnType: turnType
        };
    }
}
