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
        this.POINTS = {
            NORTH_IN: { x: 490, y: -100 },
            NORTH_OUT: { x: 410, y: -200 },
            SOUTH_IN: { x: 410, y: 750 },
            SOUTH_OUT: { x: 490, y: 900 },
            WEST_IN: { x: -100, y: 365 },
            WEST_OUT: { x: -200, y: 285 },
            EAST_IN: { x: 1000, y: 285 },
            EAST_OUT: { x: 1100, y: 365 }
        };

        this.ROUTES = this._buildRoutes();
    }

    _buildRoutes() {
        return {
            // --- Rutas Rectas ---
            'STRAIGHT_SOUTH': [this.POINTS.NORTH_IN, this.POINTS.SOUTH_OUT],
            'STRAIGHT_NORTH': [this.POINTS.SOUTH_IN, this.POINTS.NORTH_OUT],
            'STRAIGHT_EAST': [this.POINTS.WEST_IN, this.POINTS.EAST_OUT],
            'STRAIGHT_WEST': [this.POINTS.EAST_IN, this.POINTS.WEST_OUT],

            // --- Giros a la Derecha ---
            'NORTH_TO_WEST': [
                this.POINTS.NORTH_IN,
                { x: 490, y: 285 },
                this.POINTS.WEST_OUT
            ],
            'SOUTH_TO_EAST': [
                this.POINTS.SOUTH_IN,
                { x: 410, y: 365 },
                this.POINTS.EAST_OUT
            ],
            'WEST_TO_SOUTH': [
                this.POINTS.WEST_IN,
                { x: 490, y: 365 },
                this.POINTS.SOUTH_OUT
            ],
            'EAST_TO_NORTH': [
                this.POINTS.EAST_IN,
                { x: 410, y: 285 },
                this.POINTS.NORTH_OUT
            ],

            // --- Giros a la Izquierda (Trayectorias más limpias) ---
            'NORTH_TO_EAST': [
                this.POINTS.NORTH_IN,
                { x: 490, y: 365 }, // Baja hasta el carril horizontal derecho
                this.POINTS.EAST_OUT
            ],
            'SOUTH_TO_WEST': [
                this.POINTS.SOUTH_IN,
                { x: 410, y: 285 }, // Sube hasta el carril horizontal izquierdo
                this.POINTS.WEST_OUT
            ],
            'WEST_TO_NORTH': [
                this.POINTS.WEST_IN,
                { x: 410, y: 365 },
                { x: 410, y: 285 },
                this.POINTS.NORTH_OUT
            ],
            'EAST_TO_SOUTH': [
                this.POINTS.EAST_IN,
                { x: 490, y: 285 },
                { x: 490, y: 365 },
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
            if (sideOrDir === 1) {
                possibleKeys = ['STRAIGHT_SOUTH', 'NORTH_TO_WEST', 'NORTH_TO_EAST'];
            } else {
                possibleKeys = ['STRAIGHT_NORTH', 'SOUTH_TO_EAST', 'SOUTH_TO_WEST'];
            }
        } else {
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
            // Lógica para determinar si es izq o der basado en las rutas definidas
            const isLeft = ['NORTH_TO_EAST', 'SOUTH_TO_WEST', 'WEST_TO_NORTH', 'EAST_TO_SOUTH'].includes(key);
            turnType = isLeft ? 'left' : 'right';
        }

        return {
            path: this.ROUTES[key],
            turnType: turnType
        };
    }
}
