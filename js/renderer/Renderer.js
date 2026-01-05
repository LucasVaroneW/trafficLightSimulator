/**
 * Renderer.js
 * Interfaz base (clase abstracta) para el renderizado del simulador.
 * 
 * Define el contrato que cualquier motor de renderizado (DOM, Three.js, Canvas, etc.)
 * debe cumplir para trabajar con el sistema.
 */

class Renderer {
    constructor(scene) {
        if (this.constructor === Renderer) {
            throw new Error("No se puede instanciar la clase abstracta Renderer.");
        }
        this.scene = scene;
    }

    /**
     * Inicializa el renderizado de la escena (avenidas, líneas, etc.)
     * @param {Object} roadInfo - Información geométrica de la carretera
     */
    initScene(roadInfo) {
        throw new Error("Método 'initScene()' debe ser implementado.");
    }

    /**
     * Crea la representación visual de un auto
     * @param {Car} car - Objeto Car con su lógica
     */
    createCar(car) {
        throw new Error("Método 'createCar()' debe ser implementado.");
    }

    /**
     * Actualiza la posición visual de un auto
     * @param {Car} car - Objeto Car actualizado
     */
    updateCar(car) {
        throw new Error("Método 'updateCar()' debe ser implementado.");
    }

    /**
     * Elimina el auto del motor de renderizado
     * @param {Car} car
     */
    removeCar(car) {
        throw new Error("Método 'removeCar()' debe ser implementado.");
    }

    /**
     * Actualiza la visualización de los semáforos
     * @param {Object} lightsState - Estado actual de los semáforos
     */
    updateTrafficLights(lightsState) {
        throw new Error("Método 'updateTrafficLights()' debe ser implementado.");
    }

    /**
     * Limpia la escena visual completa
     */
    clear() {
        throw new Error("Método 'clear()' debe ser implementado.");
    }
}
