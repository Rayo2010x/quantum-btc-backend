---
Type: Integration Strategy
Title: Frontend V1.0 Premium Integration Plan
Version: 1.0
Last Updated: 2026-03-02
Status: APPROVED
---

# Plan de Integración Frontend V1.0 (Quantum BTC)

El Backend MVP está completado y protegido. Ahora el enfoque se centra 100% en la experiencia del usuario (UI/UX) y en conectar las nuevas defensas del servidor con la vista del cliente.

Basado en el documento `UI_UX_Guidelines.md` y nuestro `BACKLOG.md`, este es el plan táctico para la Fase 2 (Frontend):

## 1. Integración de Lógica y Defensas (Conexión con Backend)
El frontend debe reaccionar de forma elegante a las nuevas reglas que implementamos:
* **Manejo de Límite de Exposición (HTTP 400):** Capturar el error cuando una apuesta supera el 2% del Bankroll dinámico y mostrar un *Toast* o alerta visual Premium explicando el límite máximo de pago al jugador, en lugar de un error técnico genérico.
* **Manejo de Bancarrota / Mantenimiento (HTTP 503):** Si el servidor entra en Alerta Roja (< 20k Sats), la UI debe bloquear los controles de apuesta (deshabilitar botones) y mostrar un *Overlay* o Banner (ej. "Sistema en Mantenimiento de Liquidez").
* **Sincronización WebSockets:** Asegurar que la animación de la ruleta y los resultados de *Provably Fair* aterricen suavemente en la UI sin desincronizaciones post-pago.

## 2. Refinamiento Estético (Premium UI/UX)
Siguiendo las directrices "Anti-Genéricas":
* **Paleta y Temática:** Asegurar un Dark Mode cohesivo, evitando colores por defecto del navegador. Usar colores de acento vibrantes (ej. neones sutiles) contrastados con fondos oscuros profundos y legibles.
* **Tipografía Deliberada:** Implementar una fuente Display distintiva para los balances/premios (ej. *Outfit*, *Space Grotesk* u *Orbitron* para vibra cyber/cuántica) y una fuente de lectura refinada.
* **Micro-interacciones y Flujo:** 
    * Transiciones suaves al mostrar el código QR de depósito y retiro (LNURL).
    * Estados *Hover* interactivos en el tapete de apuestas.
    * _Glassmorphism_ sutil en los modales y tarjetas para dar profundidad.

## 3. Seguridad Frontend (Secure by Design)
* **Sanitización:** Validar inputs locales.
* **Manejo Blindado de Errores:** Evitar imprimir errores de API crudos en la interfaz, traduciéndolos a mensajes amigables para el usuario final.

## 4. Estructuración del Trabajo (Ejecución Atómica)
Para arrancar el desarrollo, proporcionarle al agente la siguiente estructuración:
1. **Paso A:** Auditoría visual del estado actual del frontend (levantar el frontend y mapear la deuda de diseño).
2. **Paso B:** Inyección de tipografías, colores Premium e interacciones Base (CSS / Tailwind).
3. **Paso C:** Conexión de los Estados de Error HTTP (Límites de Apuesta) y testeo de la experiencia completa de inicio a fin.
