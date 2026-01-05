/**
 * TrafficController.js
 * Interfaz base para controladores de semáforos.
 */
class TrafficController {
    constructor(trafficLight) {
        this.trafficLight = trafficLight;
    }

    /**
     * Se llama en cada tick del simulador.
     */
    update() {
        throw new Error("Método update() debe ser implementado");
    }

    /**
     * Se llama cuando un sensor detecta algo.
     */
    onSensorEvent(event, data) {
        // Opcional
    }
}
