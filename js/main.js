/**
 * main.js
 * Punto de entrada de la aplicación.
 * 
 * Inicializa el simulador y conecta los controles de la UI.
 */

let simulator;

window.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar el motor de renderizado (DOM por ahora)
    const scene = document.getElementById('scene');
    const renderer = new DOMRenderer(scene);

    // 2. Inicializar el simulador con el renderer
    simulator = new Simulator({
        renderer: renderer
    });

    // 3. Conectar botones de UI
    document.getElementById('btnPlay').addEventListener('click', () => {
        simulator.start();
    });

    document.getElementById('btnStop').addEventListener('click', () => {
        simulator.stop();
    });

    // Botones de spawning manual
    document.querySelectorAll('.btn-spawn').forEach(btn => {
        btn.addEventListener('click', () => {
            const side = btn.dataset.side;
            if (side) {
                simulator.spawnSecondaryCar(side);
            }
        });
    });

    // Selector de modo de semáforo
    document.getElementById('selModoTL').addEventListener('change', (e) => {
        if (simulator) {
            simulator.setTrafficMode(e.target.value);
        }
    });

    // ===== CONTROLES INTERACTIVOS DEL PANEL =====
    // Los inputs numéricos no necesitan listeners para actualizar valores visualmente

    // Botón "Aplicar Cambios"
    document.getElementById('btnApply').addEventListener('click', () => {
        const wasRunning = simulator.running;

        // Detener el simulador si estaba corriendo
        if (wasRunning) {
            simulator.stop();
        }

        // Aplicar nueva densidad de tráfico (spawn interval)
        const newDensity = parseFloat(document.getElementById('densityMain').value);
        simulator.spawnInterval = newDensity * 1000; // Convertir a ms

        // Reiniciar si estaba corriendo
        if (wasRunning) {
            simulator.start();
        }

        // Feedback visual
        const btn = document.getElementById('btnApply');
        const originalText = btn.textContent;
        btn.textContent = '✅ ¡Aplicado!';
        btn.style.background = '#27ae60';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#2ecc71';
        }, 1500);
    });
});

/**
 * Funciones globales para botones definidos en HTML (onclick)
 */
function playSystem() {
    if (simulator) simulator.start();
}

function stopSystem() {
    if (simulator) simulator.stop();
}

function spawnSecCar(side) {
    if (simulator) simulator.spawnSecondaryCar(side);
}
