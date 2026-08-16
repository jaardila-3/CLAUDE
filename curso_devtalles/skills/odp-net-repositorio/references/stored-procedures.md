# Stored procedures y funciones Oracle desde ODP.NET

## 4. Stored Procedure — ReturnValue (función Oracle con RETURN)

Cuando el SP es una **función Oracle** (`FUNCTION ... RETURN`):

```csharp
using (OracleCommand cmd = new OracleCommand("SCHEMA.PAQUETE.F_NombreFuncion", conn))
{
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.BindByName = true;

    // ReturnValue SIEMPRE primero
    OracleParameter returnParam = new OracleParameter("RETURN_VALUE", OracleDbType.Varchar2, 2000);
    returnParam.Direction = ParameterDirection.ReturnValue;
    cmd.Parameters.Add(returnParam);

    cmd.Parameters.Add("P_Param1", OracleDbType.Int32).Value = valor1;

    await conn.OpenAsync();
    await cmd.ExecuteNonQueryAsync();

    string resultado = returnParam.Value?.ToString() ?? string.Empty;
}
```

---

## 5. Stored Procedure — RefCursor como ReturnValue (función que retorna cursor)

```csharp
using (OracleCommand cmd = new OracleCommand("PAQUETE.F_GetLista", conn))
{
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.BindByName = true;

    OracleParameter cursorParam = new OracleParameter("RETURN_VALUE", OracleDbType.RefCursor);
    cursorParam.Direction = ParameterDirection.ReturnValue;
    cmd.Parameters.Add(cursorParam);

    cmd.Parameters.Add("P_Param", OracleDbType.Varchar2).Value = valor;

    await conn.OpenAsync();
    await cmd.ExecuteReaderAsync(); // Ejecuta la función

    using (OracleDataReader reader = ((OracleRefCursor)cursorParam.Value).GetDataReader())
    {
        while (await reader.ReadAsync())
        {
            lista.Add(MapearEntidad(reader));
        }
    }
}
```

---

## 6. Stored Procedure — parámetros de salida OUTPUT (procedimiento Oracle con OUT)

Cuando el SP es un **procedimiento** (`PROCEDURE`) con parámetros `OUT`:

```csharp
using (OracleCommand cmd = new OracleCommand("PAQUETE.P_NombreProcedimiento", conn))
{
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.BindByName = true;

    // Parámetros de entrada
    cmd.Parameters.Add("P_empl_consecutivo", OracleDbType.Int32).Value = llaves.EmplConsecutivo;

    // Parámetro de salida cursor
    OracleParameter cursorParam = new OracleParameter("P_out_cursor", OracleDbType.RefCursor);
    cursorParam.Direction = ParameterDirection.Output;
    cmd.Parameters.Add(cursorParam);

    // Parámetro de salida escalar
    OracleParameter outFecha = new OracleParameter("P_out_fecha", OracleDbType.Date);
    outFecha.Direction = ParameterDirection.Output;
    cmd.Parameters.Add(outFecha);

    await conn.OpenAsync();
    await cmd.ExecuteNonQueryAsync();

    // Leer el cursor
    using (OracleDataReader reader = ((OracleRefCursor)cursorParam.Value).GetDataReader())
    {
        // mapear...
    }

    // Leer escalar de salida
    if (outFecha.Value is OracleDate oracleDate && !oracleDate.IsNull)
        resultado.Fecha = oracleDate.Value;
}
```

> Nota: `PAQUETE.F_Funcion` y `PAQUETE.P_Procedimiento` siguen la convención de nombres definida en la skill `oracle-plsql-paquetes` — parámetros de salida siempre `P_out_...`, cursores de función nunca `NULL` (siempre cursor vacío tipado, ver `oracle-plsql-paquetes/references/excepciones.md`).
