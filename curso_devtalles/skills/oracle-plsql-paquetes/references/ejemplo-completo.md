# Ejemplo completo y buenas prácticas SQL

## Buenas prácticas SQL dentro de funciones

- Usar alias de tabla siempre: `e.IDENTIFICACION`, no solo `IDENTIFICACION`
- Agrupar columnas en el `SELECT` con comentarios de sección cuando la consulta es larga:
  ```sql
  SELECT -- Datos del empleado
         e.IDENTIFICACION,
         e.NOMBRES,
         -- Datos de la unidad
         u.SIGLA_PAPA,
         u.SIGLA_FISICA
  ```
- `NVL(columna, valor_defecto)` para columnas que pueden ser nulas y tienen valor por defecto lógico
- `TO_CHAR(fecha, 'DD/MM/YYYY')` para fechas que van a ser leídas como texto en C#
- `FETCH FIRST n ROWS ONLY` para limitar resultados (Oracle 12c+) — no usar `ROWNUM` en queries nuevas
- `DECODE` para traducciones simples de código a descripción; `CASE WHEN` para lógica más compleja

---

## Ejemplo completo — función con SYS_REFCURSOR

**Header (`PACKAGE`):**
```sql
-- =========================================================
-- FUNCIÓN  : F_GetEmpleadosPorUnidad
-- MÓDULO   : Carrera Policial
-- Descripción: Retorna los empleados activos de una unidad ordenados por grado.
-- Parámetros:
--   P_SiglaFisica  IN VARCHAR2 — sigla física de la unidad
-- Retorna: SYS_REFCURSOR con identificacion, nombres, apellidos, grad_alfabetico
-- =========================================================
FUNCTION F_GetEmpleadosPorUnidad(
  P_SiglaFisica IN VARCHAR2
) RETURN SYS_REFCURSOR;
```

**Body (`PACKAGE BODY`):**
```sql
-- =========================================================
-- FUNCIÓN  : F_GetEmpleadosPorUnidad
-- MÓDULO   : Carrera Policial
-- Descripción: Retorna los empleados activos de una unidad ordenados por grado.
-- Parámetros:
--   P_SiglaFisica  IN VARCHAR2 — sigla física de la unidad
-- Retorna: SYS_REFCURSOR con identificacion, nombres, apellidos, grad_alfabetico
-- =========================================================
FUNCTION F_GetEmpleadosPorUnidad(
  P_SiglaFisica IN VARCHAR2
) RETURN SYS_REFCURSOR IS
  v_cursor SYS_REFCURSOR;
BEGIN

  OPEN v_cursor FOR
    SELECT e.IDENTIFICACION,
           e.NOMBRES,
           e.APELLIDOS,
           e.GRAD_ALFABETICO,
           g.NUMERICO AS grado_numerico
      FROM USR_REHU.EMPLEADOS e
      JOIN USR_REHU.GRADOS g
        ON g.ALFABETICO = e.GRAD_ALFABETICO
     WHERE e.SIGLA_LABORANDO = P_SiglaFisica
       AND e.ACTIVO = 'SI'
     ORDER BY g.NUMERICO ASC, e.APELLIDOS ASC;

  RETURN v_cursor;

EXCEPTION
  WHEN OTHERS THEN
    OPEN v_cursor FOR
      SELECT CAST(NULL AS NUMBER)        AS identificacion,
             CAST(NULL AS VARCHAR2(200)) AS nombres,
             CAST(NULL AS VARCHAR2(200)) AS apellidos,
             CAST(NULL AS VARCHAR2(10))  AS grad_alfabetico,
             CAST(NULL AS NUMBER)        AS grado_numerico
        FROM DUAL
       WHERE 1 = 0;
    RETURN v_cursor;
END F_GetEmpleadosPorUnidad;
```
