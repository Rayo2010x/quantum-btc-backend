---
Type: Core Documentation
Title: UI/UX & Frontend Design Guidelines
Version: 1.1
Last Updated: 2026-03-03
Status: DRAFT
---

# UI/UX & Frontend Design Guidelines

## 1. Propósito y Alcance
Este documento establece las directrices estéticas, funcionales y de seguridad para cualquier interfaz de usuario (UI) o cliente web desarrollado para **Quantum BTC**. Su objetivo principal es garantizar que todas las interfaces sean profesionales, seguras por diseño, y evitar el uso de diseños genéricos o predecibles frecuentemente generados por inteligencias artificiales, priorizando una postura estética audaz y una seguridad férrea.

## 2. Directivas Fundamentales
Cualquier desarrollo de frontend debe regirse por los siguientes principios, en orden de prioridad:

1. **Seguridad Integrada (Secure by Design):** La UI no es solo presentación; es la primera línea de defensa. La seguridad precede a la estética.
2. **Claridad Funcional y Accesibilidad:** Interfaces predecibles, sin ambigüedades, y equitativas para todo usuario.
3. **Calidad Estética (Anti-Genérica):** Diseños profesionales, cohesivos y audaces, evitando plantillas y soluciones visuales repetitivas.

## 3. Seguridad en la Interfaz (Mandatorio)
En estricta alineación con la directiva de seguridad global (Sección Global Security & Professionalism Directive), todo componente frontend debe implementar:

- **Sanitización y Validación Rigurosa:** Validación estricta en el cliente (adicional a la validación obligatoria en el servidor) de todo input del usuario para prevenir ataques como Cross-Site Scripting (XSS).
- **Manejo Seguro de Credenciales y Sesiones:** No almacenar tokens sensibles (ej. JWT Tokens de alta confidencialidad) de forma permanentemente vulnerable en `localStorage`. Aplicar `HttpOnly` y controles de dominio estrictos cuando se interactúe con el backend.
- **Control de Exposición de Errores (Error Handling):** Asegurarse de que el feedback visual (alerts, toasts, errores de formulario) no exponga información técnica, de infraestructura o logs confidenciales del servidor hacia el usuario final.
- **Protección contra Spoofing/Clickjacking:** Establecer políticas preventivas en conjunto con el backend (ej. encabezados `Content-Security-Policy`, `X-Frame-Options`).

## 4. Guías Estéticas y Visuales

### 4.1. Tipografía
- **Prohibición de Fuentes Clicheadas:** Se desaconseja el uso por defecto de fuentes genéricas y sobreexplotadas como Arial, Inter o Roboto, a menos que el componente lo requiera para estricta legibilidad utilitaria.
- **Selección Deliberada:** Elegir pares tipográficos con personalidad: una fuente de visualización (Display) fuertemente distintiva acompañada de una fuente refinada para el cuerpo del texto.

### 4.2. Paleta de Colores
- **Cohesión Temática (Vibe/Aesthetic):** El diseño debe comprometerse con una estética base clara (e.g. lujoso oscuro, minimalista brutalista).
- **Prohibición de Colores Default:** Evitar el uso de azules, rojos o verdes por defecto del navegador. Toda paleta debe utilizar tonos armónicos y curados (ej. esquemas basados en valores de HSL o variables CSS bien construidas).
- **Accesibilidad y Contraste (a11y):** Garantizar un contraste mínimo exigido (WCAG AA o AAA) para legibilidad. Si el diseño se siente monótono, aplicar capas de luces/sombras en lugar de perder homogeneidad.

### 4.3. Composición, Layout y Espaciado
- **Diseño Espacial y Profundidad:** Proveer espacio negativo (whitespace) generoso y rítmico. Evitar la "densidad de cajones amontonados".
- **Estructuras Audaces:** Permitir la experimentación moderada con asimetría, superposiciones o layouts que rompan la red cuando beneficien el flujo narrativo de la pantalla, sin sacrificar UX.
- **Detalles y Texturas (Micro-aesthetics):** Aplicar texturas o patrones de ruido suaves, mallas de degradado (gradient meshes) sutiles o efectos _glassmorphism_ de alta calidad donde aumente la inmersión del usuario.

### 4.4. Referencia Visual (Mesa Europea)
Como referencia fundamental para la diagramación del Frontend (la mesa de apuestas, la ubicación de la ruleta 3D al tope, indicadores de "Hot/Cold Numbers" y controles de fichas al pie), utilizamos la siguiente composición de la Ruleta Europea Clásica (ej. NetEnt):

![Mesa de Ruleta Europea de Referencia](../assets/european_roulette_reference.jpg)
*(Nota: Ver imagen de referencia subida en el Backlog. Si el framework lo exige, el frontend debe apuntar a este grado de elegancia con acentos oscuros)*

### 4.4. Movimiento y Micro-interacciones (Motion)
- **Uso Estructural:** Las animaciones CSS y las transiciones deben usarse de manera intencional para: a) orientar al usuario y b) proporcionar retroalimentación táctil, no solo como "adorno ciego".
- **Revelación Escalonada (Staggered Reveals):** Fomentar que el contenido aterrice con animaciones escalonadas y suaves en la carga inicial para evitar cambios abruptos y desorientadores.
- **Optimización CSS:** Priorizar soluciones CSS puras y amigables con el hardware antes de dependencias masivas en JavaScript para efectos comunes (ej. estados hover dinámicos y transformaciones espaciales).

## 5. Proceso de Implementación y Definición de Terminado

De acuerdo al paradigma de documentación central del proyecto (`quantum-btc-backend`):
1. **El Componente como Unidad Documentada:** Antes de la implementación de un componente o vista principal, la aproximación de UI/UX debe ser descrita o referenciada lógicamente.
2. **Revisión de Seguridad del Componente:** Toda implementación visual crítica (ej. formularios de pagos, login de wallet) debe validarse explícitamente desde la óptica de la seguridad preventiva previo al "merge".

---

> **Control de Cambios y Excepciones:** Cualquier desvío temporal de esta guía por limitaciones técnicas obligadas (paquetes legados, limitaciones del framework, etc.) debe documentarse, priorizando siempre la estabilidad y la regla "Secure by Design" por sobre la sofisticación visual.
