# Excepciones y cursor vacío tipado

## Reglas para el cursor vacío tipado en EXCEPTION

- **Siempre** retornar un cursor vacío tipado, **nunca** `RETURN NULL` ni `RETURN(NULL)`
- Las columnas del cursor vacío deben coincidir exactamente (nombre y tipo) con las del `SELECT` principal
- Usar `CAST(NULL AS tipo)` para cada columna — no omitir columnas
- Usar `FROM DUAL WHERE 1 = 0` para garantizar cero filas
- Tipos `CAST` según el tipo Oracle de la columna original:

| Tipo Oracle | CAST en cursor vacío |
|---|---|
| `VARCHAR2(n)` | `CAST(NULL AS VARCHAR2(n))` |
| `NUMBER` | `CAST(NULL AS NUMBER)` |
| `DATE` | `CAST(NULL AS DATE)` |
| `CHAR(n)` | `CAST(NULL AS CHAR(n))` |
| `CLOB` | `CAST(NULL AS CLOB)` — usar con precaución |

> ⚠️ **Antipatrón a corregir**: `WHEN OTHERS THEN NULL; RETURN(NULL);`
> Esto genera `ORA-01001: invalid cursor` en el consumidor C#.
> Siempre reemplazarlo por el cursor vacío tipado.

---

## Manejo de excepciones — resumen de patrones

| Situación | Patrón correcto |
|---|---|
| Función retorna `SYS_REFCURSOR` | Cursor vacío tipado con `CAST` + `WHERE 1=0` |
| Función retorna escalar (`VARCHAR2`, `NUMBER`) | `RETURN NULL` es válido |
| Procedimiento con DML | `ROLLBACK` + asignar `P_out_resultado := 'ERROR'` |
| Error esperado con acción específica | `WHEN NO_DATA_FOUND THEN` antes de `WHEN OTHERS` |
| Captura de mensaje de error | `SUBSTR(SQLERRM, 1, 200)` |

### Excepciones específicas antes de OTHERS

Cuando se espera un caso concreto, manejarlo explícitamente antes del `WHEN OTHERS`:

```sql
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL;
  WHEN TOO_MANY_ROWS THEN
    RETURN NULL;
  WHEN OTHERS THEN
    -- manejo general
END;
```
