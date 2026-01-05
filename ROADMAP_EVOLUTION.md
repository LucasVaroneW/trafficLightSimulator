# 🗺️ Roadmap de Evolución: Simulador de Tráfico Inteligente

Este documento detalla el plan de evolución para convertir el simulador actual en un sistema robusto, escalable y preparado para futuras tecnologías como **Three.js** e **Inteligencia Artificial**.

## 📊 Análisis de Robustez Actual

| Característica | Estado | Observación |
| --- | --- | --- |
| **Separación de Responsabilidades** | ✅ Bueno | Cada clase tiene un propósito claro. |
| **Acoplamiento al DOM** | 🔴 Crítico | La lógica depende directamente de elementos HTML, dificultando migrar a 3D. |
| **Flexibilidad de Movimiento** | 🔴 Limitado | Los autos solo se mueven en línea recta; no existe concepto de ruta o giro. |
| **Escalabilidad de Mapa** | 🟡 Medio | Geometría hardcoded que dificulta crear múltiples intersecciones. |

---

## 🚀 Fases de Evolución

### **Fase 1: Desacoplar Renderizado de Lógica** (CRÍTICO)
*Objetivo: Separar qué hace el simulador de cómo se ve.*
- [x] Crear capa de abstracción de Rendering (`Renderer.js`).
- [x] Implementar `DOMRenderer.js` para mantener funcionalidad actual.
- [x] Limpiar `Car.js`, `TrafficLight.js` y `Sensor.js` de referencias al DOM.
- [x] Mudar detección de colisiones a coordenadas matemáticas puras.

### **Fase 2: Sistema de Navegación y Giros** (CEREBRO)
*Objetivo: Permitir que los autos doblen y sigan rutas.*
- [x] Implementar sistema de Waypoints y Rutas.
- [x] Crear `Navigator.js` para toma de decisiones en intersecciones.
- [x] Actualizar física de `Car.js` para seguir ángulos en lugar de solo ejes X/Y.

### **Fase 3: Lógicas Adaptativas y Extensibles** 
*Objetivo: Soporte para múltiples tipos de señales y lógicas.*
- [x] Implementar Patrón Strategy para lógicas de semáforo (IA vs Tiempos Fijos).
- [x] Crear sistema de Señalización modular (semáforos de giro, balizas).
- [x] Implementar prioridad situacional inteligente y despeje de intersección.

### **Fase 4: Dinámicas Avanzadas y Anti-Bloqueo**
*Objetivo: Tráfico denso, realista y autónomo ante fallas.*
- [x] Implementar Luces de Giro (balizas dinámicas en cada auto).
- [x] Prioridad por intención de giro para evitar colisiones frontales.
- [x] Sistema de Autocorrección (Anti-trabado) para recuperar fluidez en atascos.

### **Fase 5: Escenarios y Multi-Intersección**
*Objetivo: Simular entornos urbanos complejos.*
- [ ] Cargar configuraciones de mapa desde JSON.
- [ ] Implementar gestor de escenarios (Hora Pico, Accidentes, etc.).

### **Fase 6: Migración a Visuales 3D (Three.js)**
*Objetivo: Experiencia visual premium.*
- [ ] Implementar `ThreeJSRenderer.js`.
- [ ] Agregar modelos 3D de autos y entorno.

---

## 🛠️ Seguimiento de Fase Actual: [Fase 5: Escenarios]

### **5.1 Configuración Dinámica**
- [ ] Exportar/Importar estados de simulación.
- [ ] Ajustar densidades de spawn dinámicamente.
