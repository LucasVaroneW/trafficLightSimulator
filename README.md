# 🚦 Simulador de Tráfico Inteligente - Modular Evolution

![Version](https://img.shields.io/badge/version-5.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación y Uso](#-instalación-y-uso)
- [Panel de Control](#-panel-de-control)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Guía de Configuración](#-guía-de-configuración)
- [Guía de Desarrollo](#-guía-de-desarrollo)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)

---

## 🎯 Descripción

**Simulador de Tráfico Inteligente** es una aplicación web avanzada que simula el comportamiento de vehículos en una intersección urbana con semáforos adaptativos. El proyecto está diseñado con una arquitectura modular que separa completamente la lógica de negocio del motor de renderizado, permitiendo migrar fácilmente a diferentes tecnologías de visualización (DOM, Canvas, Three.js, etc.).

### 🎓 Propósito Educativo

Este simulador es ideal para:
- Estudiar algoritmos de control de tráfico
- Aprender patrones de diseño (Strategy, Observer, etc.)
- Experimentar con sistemas multi-agente
- Visualizar conceptos de ingeniería de tráfico

---

## ✨ Características

### 🚗 Simulación de Tráfico Realista
- **Navegación Inteligente**: Sistema de waypoints para giros suaves y naturales
- **Detección de Colisiones**: Algoritmo avanzado con prioridad situacional
- **Jerarquía Vial**: Respeto automático entre avenida principal y calle secundaria
- **Reglas de Tránsito**: Implementación de "Giro a la Izquierda Cede el Paso"
- **Luces de Giro**: Balizas visuales que indican la intención de cada vehículo
- **Auto-Corrección**: Sistema de desbloqueo automático ante atascos

### 🚦 Control de Semáforos Adaptativo
- **Modo Adaptativo (Sensores)**: Los semáforos responden a la demanda real de tráfico
- **Modo Tiempos Fijos**: Ciclos predefinidos para comparación
- **Sensores Inteligentes**: Detección matemática de vehículos sin acoplamiento al DOM
- **Intervalo Mínimo Configurable**: Protección del flujo de la avenida principal

### 🎛️ Panel de Control Interactivo
- **Sliders en Tiempo Real**: Ajusta parámetros mientras observas los cambios
- **Control de Densidad**: Modifica la frecuencia de spawn de vehículos
- **Visualización de Estado**: Panel informativo con métricas en vivo
- **Aplicación Dinámica**: Cambios sin necesidad de recargar la página

### 🏗️ Arquitectura Escalable
- **Desacoplamiento Total**: Lógica independiente del renderizado
- **Patrón Strategy**: Controladores de semáforo intercambiables
- **Preparado para 3D**: Migración a Three.js sin cambiar la lógica
- **Modular y Extensible**: Fácil agregar nuevos tipos de vehículos o señales

---

## 🏛️ Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    SIMULADOR (Core)                      │
│  - Orquestación general                                 │
│  - Gestión del loop de actualización                    │
│  - Coordinación entre módulos                           │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼─────────────────────────────────┐
│ LÓGICA │      │         RENDERIZADO                   │
│        │      │  ┌─────────────────────────────────┐ │
│ ┌──────▼───┐ │  │  Renderer (Abstract)            │ │
│ │   Car    │ │  │  ├─ DOMRenderer (Actual)        │ │
│ │ Navigator│ │  │  └─ ThreeJSRenderer (Futuro)    │ │
│ │   Road   │ │  └─────────────────────────────────┘ │
│ │  Sensor  │ │                                        │
│ │TrafficLt │ │                                        │
│ └──────────┘ │                                        │
│              │                                        │
│ ┌──────────┐ │                                        │
│ │Controllers│ │                                        │
│ │ Strategy │ │                                        │
│ │ Pattern  │ │                                        │
│ └──────────┘ │                                        │
└──────────────┘                                        │
                                                        │
```

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada clase tiene un propósito único y bien definido
2. **Inversión de Dependencias**: La lógica no conoce al renderizador, solo su interfaz
3. **Abierto/Cerrado**: Extensible sin modificar código existente
4. **Sustitución de Liskov**: Los controladores son intercambiables

---

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, recomendado para desarrollo)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/simuladorSemaforos.git
cd simuladorSemaforos/traffic-simulator-modular
```

2. **Abrir el simulador**
   - **Opción A (Simple)**: Abrir `index.html` directamente en el navegador
   - **Opción B (Recomendada)**: Usar un servidor local
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # Con Node.js (npx)
   npx http-server -p 8000
   ```
   Luego abrir `http://localhost:8000` en el navegador

### Uso Básico

1. **Iniciar la Simulación**: Click en el botón **▶ Play**
2. **Detener**: Click en **■ Stop**
3. **Añadir Vehículos Manualmente**: Usa los botones verdes en los laterales
4. **Ajustar Configuración**: Mueve los sliders del panel de control
5. **Aplicar Cambios**: Click en **✅ Aplicar Cambios**

---

## 🎛️ Panel de Control

### Parámetros Configurables

#### 🚦 Modo de Control
- **Adaptativo (Sensores)**: Los semáforos responden a la presencia de vehículos
  - Recomendado para tráfico variable
  - Maximiza la eficiencia de la avenida principal
- **Tiempos Fijos**: Ciclos predefinidos sin sensores
  - Útil para comparación y análisis

#### 🟢 Verde Principal (10-180s)
Duración del verde en la avenida vertical (principal)
- **Valor bajo (10-30s)**: Tráfico equilibrado entre ambas calles
- **Valor medio (60-90s)**: Configuración urbana estándar
- **Valor alto (120-180s)**: Autopista con calle secundaria de bajo tráfico

#### 🟢 Verde Secundaria (3-30s)
Duración base del verde en la calle horizontal
- **Valor bajo (3-5s)**: Calle residencial con poco tráfico
- **Valor medio (10-15s)**: Calle comercial
- **Valor alto (20-30s)**: Avenida secundaria importante

#### ⏳ Intervalo Mínimo (5-60s)
Tiempo mínimo que debe estar en verde la principal antes de que un sensor pueda interrumpirla
- **Valor bajo (5-15s)**: Máxima sensibilidad a la demanda secundaria
- **Valor medio (20-40s)**: Balance entre eficiencia y justicia
- **Valor alto (45-60s)**: Protección extrema de la avenida principal

#### 🚗 Límite Autos Secundaria (1-15)
Cantidad de autos que pueden pasar en la calle secundaria antes de volver a la principal
- **Valor bajo (1-3)**: Prioridad absoluta a la principal
- **Valor medio (5-7)**: Configuración equilibrada
- **Valor alto (10-15)**: Permite vaciar colas largas

#### 🚙 Densidad Principal (1-10s)
Intervalo entre spawns de vehículos en la avenida principal
- **Valor bajo (1-2s)**: Tráfico muy denso (hora pico)
- **Valor medio (3-5s)**: Tráfico moderado
- **Valor alto (7-10s)**: Tráfico ligero (madrugada)

---

## 📁 Estructura del Proyecto

```
traffic-simulator-modular/
│
├── index.html                 # Punto de entrada de la aplicación
├── README.md                  # Este archivo
├── ROADMAP_EVOLUTION.md       # Plan de evolución del proyecto
│
├── css/
│   └── styles.css            # Estilos visuales (DOM Renderer)
│
├── js/
│   ├── main.js               # Inicialización y event listeners
│   ├── Simulator.js          # Orquestador principal
│   │
│   ├── Car.js                # Lógica de vehículos
│   ├── Road.js               # Geometría de calles y carriles
│   ├── Navigator.js          # Sistema de rutas y waypoints
│   ├── TrafficLight.js       # Lógica de semáforos (contexto)
│   ├── Sensor.js             # Detección matemática de vehículos
│   │
│   ├── controllers/          # Patrón Strategy para semáforos
│   │   ├── TrafficController.js      # Clase base abstracta
│   │   ├── FixedTimeController.js    # Controlador de tiempos fijos
│   │   └── AdaptiveController.js     # Controlador adaptativo
│   │
│   └── renderer/             # Capa de visualización
│       ├── Renderer.js       # Interfaz abstracta
│       └── DOMRenderer.js    # Implementación DOM
│
└── .gitignore
```

---

## ⚙️ Guía de Configuración

### Modificar Parámetros por Defecto

**Archivo**: `index.html`

```html
<!-- Buscar el panel de control -->
<input type="range" id="txtPri" min="10" max="180" value="120">
```

Cambiar el atributo `value` para modificar el valor inicial.

### Ajustar Física de Vehículos

**Archivo**: `js/Car.js`

```javascript
class Car {
    static ACCELERATION = 0.05;    // Aceleración
    static DECELERATION = 0.25;    // Frenado
    static MIN_GAP = 85;           // Distancia mínima entre autos
    // ...
}
```

### Modificar Rutas y Waypoints

**Archivo**: `js/Navigator.js`

```javascript
this.POINTS = {
    NORTH_IN: { x: 490, y: -100 },   // Punto de entrada norte
    SOUTH_OUT: { x: 490, y: 900 },   // Punto de salida sur
    // ... modificar coordenadas según necesidad
};
```

### Cambiar Geometría de Calles

**Archivo**: `js/Road.js`

```javascript
this.mainRoad = {
    x: 450,          // Centro horizontal de la avenida
    width: 160,      // Ancho total
    lanes: {
        down: { x: 490, direction: 1 },  // Carril sur
        up: { x: 410, direction: -1 }    // Carril norte
    }
};
```

### Personalizar Colores de Vehículos

**Archivo**: `css/styles.css`

```css
.blue {
  background: linear-gradient(#4a90e2, #0d47a1);
}
/* Añadir nuevos colores */
.purple {
  background: linear-gradient(#9b59b6, #8e44ad);
}
```

**Archivo**: `js/Car.js`
```javascript
static COLORS = ['blue', 'redc', 'orange', 'greenc', 'purple'];
```

### Ajustar Tiempos de Auto-Corrección

**Archivo**: `js/Car.js`

```javascript
_checkCollisions(otherCars) {
    const ghostMode = this.stoppedTime > 60;  // Cambiar umbral (frames)
    // ...
}
```

---

## 🛠️ Guía de Desarrollo

### Añadir un Nuevo Tipo de Vehículo

1. **Modificar `Car.js`**:
```javascript
constructor(config) {
    this.type = config.type; // 'main', 'secondary', 'bus', 'truck'
    
    if (this.type === 'bus') {
        this.maxSpeed = 1.5; // Más lento
        this.color = 'yellow';
    }
}
```

2. **Actualizar `DOMRenderer.js`**:
```javascript
createCar(car) {
    const el = document.createElement('div');
    el.className = `car ${car.color}`;
    
    if (car.type === 'bus') {
        el.style.width = '30px';
        el.style.height = '60px';
    }
    // ...
}
```

### Crear un Nuevo Controlador de Semáforo

1. **Crear archivo** `js/controllers/MyController.js`:
```javascript
class MyController extends TrafficController {
    constructor(trafficLight) {
        super(trafficLight);
    }

    update() {
        // Tu lógica personalizada
    }

    onSensorEvent(event, data) {
        // Respuesta a eventos de sensores
    }
}
```

2. **Registrar en `index.html`**:
```html
<script src="js/controllers/MyController.js"></script>
```

3. **Añadir opción en el selector**:
```html
<select id="selModoTL">
    <option value="my-mode">Mi Controlador</option>
</select>
```

4. **Actualizar `main.js`**:
```javascript
document.getElementById('selModoTL').addEventListener('change', (e) => {
    if (e.target.value === 'my-mode') {
        const controller = new MyController(simulator.trafficLight);
        simulator.trafficLight.setController(controller);
    }
});
```

### Migrar a Three.js

1. **Crear** `js/renderer/ThreeJSRenderer.js`:
```javascript
class ThreeJSRenderer extends Renderer {
    constructor(container) {
        super();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(/*...*/);
        this.renderer = new THREE.WebGLRenderer();
        // ...
    }

    createCar(car) {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({/*...*/});
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.carMeshes.set(car, mesh);
    }

    updateCar(car) {
        const mesh = this.carMeshes.get(car);
        mesh.position.set(car.x, 0, car.y);
        mesh.rotation.y = car.angle * Math.PI / 180;
    }
    // ...
}
```

2. **Modificar `main.js`**:
```javascript
// const renderer = new DOMRenderer(scene);
const renderer = new ThreeJSRenderer(document.getElementById('scene'));
```

**¡Listo!** La lógica de `Car.js`, `Navigator.js`, `Sensor.js`, etc. funciona sin cambios.

---

## 🗺️ Roadmap

### ✅ Fase 1-4: Completadas
- [x] Desacoplamiento de lógica y renderizado
- [x] Sistema de navegación con waypoints
- [x] Controladores adaptativos (Strategy Pattern)
- [x] Luces de giro y señalización
- [x] Sistema anti-bloqueo y auto-corrección
- [x] Panel de control interactivo

### 🚧 Fase 5: En Desarrollo
- [ ] Configuración de escenarios (JSON)
- [ ] Multi-intersecciones coordinadas
- [ ] Estadísticas y métricas avanzadas

### 🔮 Fase 6: Futuro
- [ ] Migración a Three.js
- [ ] Modelos 3D de vehículos
- [ ] Semáforos peatonales
- [ ] IA para control predictivo

Ver [ROADMAP_EVOLUTION.md](ROADMAP_EVOLUTION.md) para más detalles.

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Estilo
- **JavaScript**: Usar ES6+, nombres descriptivos, comentarios JSDoc
- **Arquitectura**: Mantener la separación lógica/renderizado
- **Commits**: Mensajes claros y descriptivos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Micay Lucas**
- GitHub: [@micaylucas](https://github.com/micaylucas)

---

## 🙏 Agradecimientos

- Inspirado en sistemas de control de tráfico reales
- Comunidad de desarrolladores de simulaciones
- Patrones de diseño de Gang of Four

---

**¡Disfruta experimentando con el simulador!** 🚦🚗💨
