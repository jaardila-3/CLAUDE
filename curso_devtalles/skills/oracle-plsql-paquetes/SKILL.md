---
name: oracle-plsql-paquetes
description: "Patrones y convenciones para escribir funciones y procedimientos PL/SQL Oracle en paquetes (.pkh header / .pkb body) para proyectos de la Policía Nacional de Colombia. Aplica cuando el usuario pida crear, modificar o revisar funciones Oracle, procedimientos almacenados, paquetes PL/SQL, funciones que retornan SYS_REFCURSOR, manejo de excepciones en PL/SQL, comentarios de cabecera, o cualquier objeto PL/SQL en Oracle 21c. También aplica cuando el usuario mencione PACKAGE, FUNCTION, PROCEDURE, SYS_REFCURSOR, WHEN OTHERS, EXCEPTION, OPEN ... FOR, RETURN, o pida generar el header y body de un paquete."
argument-hint: 'nombre de la función/procedimiento, o qué debe hacer'
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Skill: PL/SQL Oracle — Paquetes, Funciones y Procedimientos

## Cuándo NO aplica

No uses esta skill para T-SQL / SQL Server, para DDL de tablas e índices, ni para el SQL inline
escrito desde C# (eso lo cubre la skill `odp-net-repositorio`).

---

## Contexto del proyecto

- **Motor**: Oracle 21c
- **Organización**: todo el código va dentro de paquetes (`PACKAGE` / `PACKAGE BODY`)
- **Consumidor principal**: aplicaciones C# con ODP.NET — los cursores deben ser siempre válidos y tipados

---

## Estructura de un paquete

Todo objeto PL/SQL tiene dos partes que deben mantenerse sincronizadas:

```
PK_NOMBRE.pkh  →  PACKAGE (header/especificación)
PK_NOMBRE.pkb  →  PACKAGE BODY (implementación)
```

### Reglas de nomenclatura

| Objeto | Prefijo | Ejemplo |
|---|---|---|
| Paquete | `PK_` | `PK_PLAN_CARRERA` |
| Función | `F_` | `F_GetCargosEmpleado` |
| Procedimiento | `P_` | `P_InsertarRegistro` |
| Variable local | `v_` | `v_resultado` |
| Cursor local | `v_cursor` | `v_cursor SYS_REFCURSOR` |
| Parámetro de entrada | `P_` | `P_Identificacion` |
| Parámetro de salida | `P_out_` | `P_out_cursor`, `P_out_id` |

---

## Comentarios — regla obligatoria

El mismo bloque de comentario va en **tres lugares**: header del paquete, body del paquete, y justo antes de la implementación en el body. Formato estándar:

```sql
-- =========================================================
-- FUNCIÓN  : F_NombreFuncion
-- MÓDULO   : Nombre del módulo funcional
-- Descripción: Qué hace la función, qué retorna y para qué se usa.
-- Parámetros:
--   P_Param1  IN NUMBER  — descripción
--   P_Param2  IN VARCHAR2 — descripción
-- Retorna: SYS_REFCURSOR con columnas col1, col2, col3
-- =========================================================
```

Para procedimientos, reemplazar `FUNCIÓN` por `PROCEDIMIENTO` y `Retorna` por los parámetros OUT.

### Dónde va cada comentario

**En el header (`PACKAGE`):**
```sql
-- =========================================================
-- FUNCIÓN  : F_GetCargosEmpleado
-- MÓDULO   : Carrera Policial
-- Descripción: Retorna los cargos ocupados por un empleado ordenados por fecha.
-- =========================================================
FUNCTION F_GetCargosEmpleado(
  P_EmplConsecutivo     IN NUMBER,
  P_EmplUndeConsecutivo IN NUMBER,
  P_EmplUndeFuerza      IN NUMBER
) RETURN SYS_REFCURSOR;
```

**En el body (`PACKAGE BODY`)** — el mismo comentario precede la implementación:
```sql
-- =========================================================
-- FUNCIÓN  : F_GetCargosEmpleado
-- MÓDULO   : Carrera Policial
-- Descripción: Retorna los cargos ocupados por un empleado ordenados por fecha.
-- =========================================================
FUNCTION F_GetCargosEmpleado(
  P_EmplConsecutivo     IN NUMBER,
  P_EmplUndeConsecutivo IN NUMBER,
  P_EmplUndeFuerza      IN NUMBER
) RETURN SYS_REFCURSOR IS
  v_cursor SYS_REFCURSOR;
BEGIN
  ...
END F_GetCargosEmpleado;
```

---

## Funciones que retornan SYS_REFCURSOR

### Estructura base obligatoria

```sql
FUNCTION F_NombreFuncion(P_Param IN NUMBER)
  RETURN SYS_REFCURSOR IS
  v_cursor SYS_REFCURSOR;
BEGIN

  OPEN v_cursor FOR
    SELECT col1, col2, col3
      FROM MI_TABLA
     WHERE columna = P_Param;

  RETURN v_cursor;

EXCEPTION
  WHEN OTHERS THEN
    -- Registrar el error si hay procedimiento de log disponible en el paquete
    OPEN v_cursor FOR
      SELECT CAST(NULL AS VARCHAR2(200)) AS col1,
             CAST(NULL AS NUMBER)        AS col2,
             CAST(NULL AS DATE)          AS col3
        FROM DUAL
       WHERE 1 = 0;
    RETURN v_cursor;
END F_NombreFuncion;
```

**Regla clave**: una función `SYS_REFCURSOR` **nunca** hace `RETURN NULL` — ni en el flujo
normal ni en `EXCEPTION`. Siempre retorna un cursor, vacío y tipado si hubo error. El detalle
completo (tabla de `CAST` por tipo, antipatrón `ORA-01001`, resumen de patrones de excepción)
está en `references/excepciones.md` — léelo antes de escribir el bloque `EXCEPTION`.

---

## Procedimientos almacenados

Estructura base, convenciones de parámetros `P_out_`, `ROLLBACK` en DML y captura de
`SQLERRM` — todo en `references/procedimientos.md`. Léelo antes de escribir un `PROCEDURE`.

---

## Ejemplo completo y buenas prácticas SQL

Ejemplo íntegro de header + body de una función `SYS_REFCURSOR`, y buenas prácticas de
alias, `NVL`, `TO_CHAR`, `FETCH FIRST` y `DECODE` — en `references/ejemplo-completo.md`.

---

## Reglas obligatorias — siempre aplicar

- El mismo comentario de cabecera en el header, en el body antes de la implementación
- Nombre del objeto al final del `END`: `END F_NombreFuncion;` — nunca solo `END;`
- Variables locales declaradas con `%TYPE` cuando referencian columnas de tabla: `v_grado grados.ALFABETICO%TYPE`
- Funciones que retornan `SYS_REFCURSOR`: cursor vacío tipado en `EXCEPTION`, **nunca `RETURN NULL`**
- Procedimientos con DML: `ROLLBACK` en `EXCEPTION` y parámetros `P_out_resultado` / `P_out_mensaje`
- `SUBSTR(SQLERRM, 1, 200)` para capturar errores — nunca concatenar `SQLERRM` directamente sin truncar
- Alias de tabla en todas las columnas del `SELECT`
- `SYSDATE` directo en SQL, nunca como variable intermedia salvo que se reutilice

---

## Skill relacionada

El consumidor de estos paquetes es C# con ODP.NET (skill `odp-net-repositorio`). Por eso un
`RETURN(NULL)` en una función `SYS_REFCURSOR` no es solo un antipatrón PL/SQL: revienta con
`ORA-01001: invalid cursor` del lado C# al intentar leer el `RefCursor`. Si estás generando
ambos lados de la llamada, revisa también esa skill para el código C# que invoca la función/procedimiento.
