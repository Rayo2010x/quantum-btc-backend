
# Project Backlog & Roadmap

> **Status:** Active
> **Last Updated:** 2026-03-13

Este documento centraliza los pendientes técnicos, deuda técnica y roadmap del proyecto Quantum BTC.

## 1. Backend Core (v0.1.0)
- [x] **Setup Inicial:** Configuración de servidor, BD y entorno (Completado).
- [x] **Lógica de Apuestas:** MVP de Ruleta Europea (Completado).
- [x] **Integración ANU QRNG:** Worker de entropía cuántica (Completado - Fix Prod 2026-02-04).
- [x] **Integración `drand`:** Añadir beacon de aleatoriedad pública para auditoría temporal (Completado - 2026-03-02).
- [x] **Websockets:** Notificaciones en tiempo real para el frontend (Completado).
- [x] **Risk & Bankroll Management:** Límite de apuestas dinámico, monitorización de OpenNode y alertas de liquidez (Completado - 2026-03-03).

## 2. Frontend (v0.1.0)
- [x] **Inicialización:** Setup de Next.js/React + Vite (Completado).
- [x] **Diseño UI:** Implementar la interfaz "Premium" (MVP funcional con BetControls).
- [x] **Integración LNURL:** Mostrar QRs de retiro (Completado).
- [x] **Animación de Ruleta:** Visualización del resultado (Completado - Verificado en Prod).

## 3. QA & Testing
- [x] **Smoke Tests:** Scripts básicos de flujo completo (Verificado Localmente con `auto_simulate.ts`).
- [x] **Load Testing:** Pruebas de carga para el Entropy Worker (Completado - 2026-03-02, hallazgo de rendimiento detectado y en resolución).
- [x] **Security Audit:** Revisión de dependencias y secretos (Completado - 2026-03-02).

## 4. Documentación
- [x] **Completar DRAFTs:** Finalizar documentos de Arquitectura y Seguridad (Completado v1.1).
- [x] **API Registry:** Documentar endpoints finales con ejemplos de Request/Response (Completado en API Spec v1.1).

## 5. Technical Debt
- [x] **Cleanup Debug Routes:** Remover `/admin/debug/routes`, `/admin/debug/requests` y logs detallados en `lnurl.ts`.
- [x] **Cleanup Scripts:** Eliminar scripts de prueba manual (`manual_withdrawal_qr.ts`, `debug_opennode.ts`) de la rama principal.

## 6. Security & Critical Fixes
- [x] **LNURL-Withdraw Amount Validation (HIGH):** Validar que el monto de la factura (`pr`) recibida en el callback NO exceda el monto autorizado en `withdrawal_tokens`. Evita robos por facturas infladas.
- [x] **LNURL-Withdraw Expiration Check (HIGH):** Implementar validación `metrics.expires_at > NOW()` también en el paso 2 (Callback/Pago), no solo en el paso 1.

## 8. Post-Release & Maintenance (Pending)
- [x] **Frontend VITE_API_URL:** Recuerda cambiar `API_URL` en `frontend/src/lib/api.ts` de nuevo a Producción (Railway) o configurar variables de entorno reales en Vercel antes del próximo despliegue.

## 7. Compliance & Geo-Blocking
- [x] **IP Tracking & Audit:** Registrar `ip_address` al crear sesión (POST `/session/init`) y eliminar columna redundante `updated_at`.
- [x] **Geo-Blocking (US/EU):** Implementar middleware para bloquear acceso desde direcciones IP de Estados Unidos y Unión Europea.
    - Utilizar librería local (ej: `fast-geoip`) para minimizar latencia.
    - Retornar `403 Forbidden` con mensaje "Service Not Available in your Region".
- [x] **Geo-Blocking Logging (Medium):** Registrar permanentemente el IP bloqueado en Supabase (evaluar si conviene crear una nueva tabla `geo_block_logs` o añadir una bandera booleana a la tabla de sesiones) para mantener consistencia de auditoría (Completado - 2026-03-03).
- [x] **Geo-Blocking UX Fix (Medium):** Revisar la lógica y orden de ejecución (ej. CORS vs GeoBlock) para garantizar que el error *"403 Access Denied / Service not available in your region"* tenga prioridad y llegue correctamente al frontend, evitando que este último colapse prematuramente mostrando un genérico "Network Error".

## 9. Próximos Pasos (Geobloqueo & Trazabilidad) - Completado
- [x] **Extensión de Restricción Regional (Reino Unido):** Incluir `GB` (Reino Unido) en la lista de países bloqueados por el middleware `geoBlock.ts` para cumplir con las normativas locales post-Brexit.
- [x] **Trazabilidad Geográfica en Sesiones:**
    - Modificar la tabla `public.sessions` para añadir la columna `country` (varchar).
    - Actualizar la lógica de `/session/init` para que, al momento de registrar la IP, también se capture y almacene el código de país tal como se hace en la tabla `public.geo_block_logs`.

## 10. Campañas & Recompensas (Completado)
- [x] **Implementación "Quantum Genesis":** Ejecutar el registro de recompensas post-quánticas según `Post_Quantum_Genesis.md`.
    - **Backend (BD):** Crear tabla `reward_registrations` (`session_id` UNIQUE, `reward_address` NOT NULL).
    - **API Logic:**
        - Implementar `POST /v1/campaign/register` con validación de address (RegEx para BTC L1 y Lightning Address).
        - Implementar `/v1/campaign/check?sessionId=...` que retorne el estado de registro y el volumen agregado (STV) por dirección.
    - **Frontend (UX):**
        - Hook de inicialización para detectar sesiones no registradas y disparar el banner de invitación.
        - Modal de registro con advertencia de privacidad.
        - Indicador de "Status de Investigador" (Sovereign Rank) en la pestaña de Estadísticas/Auditoría y FAQ basado en los Tiers de STV.
