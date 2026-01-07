/**
 * Road.js
 * Responsabilidad: Gestión de avenidas y sus carriles (Solo Lógica)
 */

class Road {
    constructor() {
        // Configuración de avenida principal (vertical)
        this.mainRoad = {
            x: 450,
            width: 160,
            lanes: {
                down: { x: 410, direction: 1 }, // RHT: Sur va por la Izquierda (Oeste)
                up: { x: 490, direction: -1 }   // RHT: Norte va por la Derecha (Este)
            }
        };

        // Configuración de avenida secundaria (horizontal)
        this.secondaryRoad = {
            y: 325,
            height: 120,
            lanes: {
                right: { y: 365, dx: 1, side: 'left' },
                left: { y: 285, dx: -1, side: 'right' }
            }
        };

        // Zonas de detención (Alineadas con Navigator.js)
        this.stopZones = {
            main: {
                down: { yMin: 170, yMax: 230 }, // Baja (Norte->Sur)
                up: { yMin: 370, yMax: 430 }    // Sube (Sur->Norte)
            },
            secondary: {
                right: { xMin: 285, xMax: 350 }, // Derecha (Oeste->Este)
                left: { xMin: 550, xMax: 615 }  // Izquierda (Este->Oeste)
            }
        };

        // Zonas de SALIDA (Yellow Box Check)
        // Espacios justo después del cruce que deben estar libres para entrar
        this.exitZones = {
            // Sube hacia el Norte (x=490, y < 265)
            'STRAIGHT_NORTH': { x: 490, yMin: -200, yMax: 260 },
            // Baja hacia el Sur (x=410, y > 385)
            'STRAIGHT_SOUTH': { x: 410, yMin: 390, yMax: 1000 },
            // Va hacia el Este (y=365, x > 530)
            'STRAIGHT_EAST': { y: 365, xMin: 540, xMax: 1200 },
            // Va hacia el Oeste (y=285, x < 370)
            'STRAIGHT_WEST': { y: 285, xMin: -200, xMax: 360 }
        };
    }

    isInStopZone(car, mode) {
        if (car.type === 'main') {
            if (mode === 'principal') return false;
            const zone = car.direction === 1 ? this.stopZones.main.down : this.stopZones.main.up;
            return car.y > zone.yMin && car.y < zone.yMax;
        } else {
            if (mode === 'secundaria') return false;
            const zone = car.dx === 1 ? this.stopZones.secondary.right : this.stopZones.secondary.left;
            return car.x >= zone.xMin && car.x < zone.xMax;
        }
    }

    createMainCarConfig() {
        const lane = Math.random() > 0.5 ? this.mainRoad.lanes.down : this.mainRoad.lanes.up;
        return {
            type: 'main',
            x: lane.x,
            y: lane.direction === 1 ? -100 : 750,
            direction: lane.direction,
            dx: 0
        };
    }

    createSecondaryCarConfig(side) {
        const lane = side === 'left' ? this.secondaryRoad.lanes.right : this.secondaryRoad.lanes.left;
        return {
            type: 'secondary',
            x: side === 'left' ? -100 : 1000,
            y: lane.y,
            direction: 0,
            dx: lane.dx,
            side: side
        };
    }

    isInIntersection(x, y) {
        const mainRoadLeft = this.mainRoad.x - this.mainRoad.width / 2;
        const mainRoadRight = this.mainRoad.x + this.mainRoad.width / 2;
        const secondaryRoadTop = this.secondaryRoad.y - this.secondaryRoad.height / 2;
        const secondaryRoadBottom = this.secondaryRoad.y + this.secondaryRoad.height / 2;

        return x >= mainRoadLeft - 10 && x <= mainRoadRight + 10 &&
            y >= secondaryRoadTop - 10 && y <= secondaryRoadBottom + 10;
    }
}
