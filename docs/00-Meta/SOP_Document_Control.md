# SOP: Control de Documentos

> **ID:** SOP_Document_Control
> **Versión:** 1.0
> **Fecha:** 2026-02-03
> **Estado:** APPROVED

## 1. Objetivo
Establecer un estándar unificado para la creación, nomenclatura, versionado y mantenimiento de la documentación del proyecto Quantum BTC, garantizando la consistencia y facilitando la trazabilidad.

## 2. Convención de Nombres (Naming Convention)
Para evitar la fragmentación de enlaces y facilitar la lectura, los nombres de archivos deben seguir estas reglas estrictas:

1.  **Sin Versionado en el Nombre:** El nombre del archivo **NUNCA** debe incluir números de versión (ej. `_v1.0`). La versión es un metadato interno, no parte de la identidad del archivo.
2.  **Sin Fechas en el Nombre:** No incluir prefijos de fecha (ej. `20260130_`). El historial de cambios se gestiona mediante Git.
3.  **Formato:** Usar `Snake_Case` (recomendado) o `PascalCase`. Ser consistente dentro de cada directorio.
4.  **Idioma:** Inglés o Español (según el contexto del documento), pero preferiblemente consistente.

**Ejemplos:**
*   ❌ Incorrecto: `20260130_Architecture_Overview_v1.0.md`
*   ✅ Correcto: `Architecture_Overview.md`

## 3. Metadatos y Versionado
Todo documento oficial debe incluir un bloque de metadatos al inicio (Frontmatter o Cita en Markdown):

```markdown
> **ID:** [Nombre_del_Archivo]
> **Versión:** X.Y (ej. 1.0)
> **Fecha:** YYYY-MM-DD (Última actualización)
> **Estado:** DRAFT | REVIEW | APPROVED | OBSOLETE
```

### Criterios de Versión:
*   **0.x:** Borrador inicial o documento en trabajo.
*   **1.0:** Primera versión aprobada/estable.
*   **X.Y:** Incremento menor (correcciones, aclaraciones).
*   **X+1.0:** Cambio mayor (cambio estructural o de lógica).

## 4. Índice Maestro
El archivo `docs/DOCUMENT_INDEX.md` es la **Única Fuente de Verdad** (SSOT) para saber qué versión de un documento está vigente.
*   Al actualizar una versión interna de un documento, se debe actualizar su entrada en el Índice Maestro.

## 5. Procedimiento de Cambio
1.  **Edición:** Se edita el mismo archivo existente. No se crea una copia nueva (ej. `_v2.md`) a menos que sea estrictamente necesario mantener ambas versiones vivas simultáneamente (raro).
2.  **Commit:** El mensaje de Git debe reflejar el cambio.
3.  **Index Update:** Actualizar la versión y fecha en `DOCUMENT_INDEX.md`.

## 6. Archivos Obsoletos
Los documentos que ya no tienen validez deben moverse a la carpeta `docs/07-Archive` o marcarse claramente como `OBSOLETE` en su cabecera.
