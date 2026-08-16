# Procedimientos almacenados

## Estructura base

```sql
PROCEDURE P_NombreProcedimiento(
  P_Param1          IN  NUMBER,
  P_Param2          IN  VARCHAR2,
  P_out_resultado   OUT VARCHAR2,
  P_out_mensaje     OUT VARCHAR2
) IS
  v_error VARCHAR2(200);
BEGIN

  -- lógica principal
  P_out_resultado := 'SUCCESS';
  P_out_mensaje   := 'Operación completada exitosamente';

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    v_error         := SUBSTR(SQLERRM, 1, 200);
    P_out_resultado := 'ERROR';
    P_out_mensaje   := 'Error en P_NombreProcedimiento: ' || v_error;
END P_NombreProcedimiento;
```

## Convenciones para procedimientos

- Parámetros de salida escalares: `P_out_nombre` con tipo `OUT`
- Parámetros de salida cursor: `P_out_cursor OUT SYS_REFCURSOR`
- En el `EXCEPTION`: siempre `ROLLBACK` si el procedimiento hace DML
- Capturar `SQLERRM` con `SUBSTR(..., 1, 200)` para evitar truncamiento en el parámetro de salida
- Resultado de operación siempre en `P_out_resultado`: valores `'SUCCESS'` o `'ERROR'`
- Si el paquete tiene `P_RegistrarLog`, llamarlo desde el `EXCEPTION` con `P_TipoLog => 'ERROR_NOMBRE_PROC'`
