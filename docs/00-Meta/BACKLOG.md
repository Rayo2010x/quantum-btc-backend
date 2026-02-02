
# Project Backlog & Roadmap

> **Status:** Active
> **Last Updated:** 2026-02-02

Este documento centraliza los pendientes técnicos, deuda técnica y roadmap del proyecto Quantum BTC.

## 1. Backend Core (v0.1.0)
- [x] **Setup Inicial:** Configuración de servidor, BD y entorno (Completado).
- [x] **Lógica de Apuestas:** MVP de Ruleta Europea (Completado).
- [x] **Integración ANU QRNG:** Worker de entropía cuántica (Completado).
- [ ] **Integración `drand`:** Añadir beacon de aleatoriedad pública para auditoría temporal (Pendiente - Post-MVP).
- [ ] **Websockets:** Notificaciones en tiempo real para el frontend (Pendiente).

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
