
# Project Backlog & Roadmap

> **Status:** Active
> **Last Updated:** 2026-02-06

Este documento centraliza los pendientes técnicos, deuda técnica y roadmap del proyecto Quantum BTC.

## 1. Backend Core (v0.1.0)
- [x] **Setup Inicial:** Configuración de servidor, BD y entorno (Completado).
- [x] **Lógica de Apuestas:** MVP de Ruleta Europea (Completado).
- [x] **Integración ANU QRNG:** Worker de entropía cuántica (Completado - Fix Prod 2026-02-04).
- [ ] **Integración `drand`:** Añadir beacon de aleatoriedad pública para auditoría temporal (Pendiente - Post-MVP).
- [x] **Websockets:** Notificaciones en tiempo real para el frontend (Completado).

## 2. Frontend (v0.1.0)
- [x] **Inicialización:** Setup de Next.js/React + Vite (Completado).
- [x] **Diseño UI:** Implementar la interfaz "Premium" (MVP funcional con BetControls).
- [x] **Integración LNURL:** Mostrar QRs de retiro (Completado).
- [x] **Animación de Ruleta:** Visualización del resultado (Completado - Verificado en Prod).

## 3. QA & Testing
## 3. QA & Testing
- [x] **Smoke Tests:** Scripts básicos de flujo completo (Verificado Localmente con `auto_simulate.ts`).
- [ ] **Load Testing:** Pruebas de carga para el Entropy Worker.
- [ ] **Security Audit:** Revisión de dependencias y secretos.

## 4. Documentación
- [x] **Completar DRAFTs:** Finalizar documentos de Arquitectura y Seguridad (Completado v1.1).
- [x] **API Registry:** Documentar endpoints finales con ejemplos de Request/Response (Completado en API Spec v1.1).

## 5. Technical Debt
- [ ] **Cleanup Debug Routes:** Remover `/admin/debug/routes`, `/admin/debug/requests` y logs detallados en `lnurl.ts`.
- [ ] **Cleanup Scripts:** Eliminar scripts de prueba manual (`manual_withdrawal_qr.ts`, `debug_opennode.ts`) de la rama principal.

## 6. Security & Critical Fixes
- [x] **LNURL-Withdraw Amount Validation (HIGH):** Validar que el monto de la factura (`pr`) recibida en el callback NO exceda el monto autorizado en `withdrawal_tokens`. Evita robos por facturas infladas.
- [x] **LNURL-Withdraw Expiration Check (HIGH):** Implementar validación `metrics.expires_at > NOW()` también en el paso 2 (Callback/Pago), no solo en el paso 1.

## 7. Compliance & Geo-Blocking
- [x] **IP Tracking & Audit:** Registrar `ip_address` al crear sesión (POST `/session/init`) y eliminar columna redundante `updated_at`.
- [x] **Geo-Blocking (US/EU):** Implementar middleware para bloquear acceso desde direcciones IP de Estados Unidos y Unión Europea.
    - Utilizar librería local (ej: `fast-geoip`) para minimizar latencia.
    - Retornar `403 Forbidden` con mensaje "Service Not Available in your Region".

