---
name: odp-net-repositorio
description: "Patrones y convenciones para escribir métodos de acceso a datos con ODP.NET (Oracle.ManagedDataAccess) en proyectos C# .NET Framework 4.8 de la Policía Nacional de Colombia. Aplica cuando el usuario pida crear, modificar o revisar repositorios que consulten Oracle con ODP.NET: métodos SELECT, INSERT, UPDATE, llamadas a stored procedures, funciones con RefCursor, parámetros de salida, o mapeo de DTOs desde OracleDataReader. También aplica cuando el usuario mencione OracleCommand, OracleConnection, OracleDbType, BindByName, RefCursor, OracleDataReader, ConDBOracle, o cualquier patrón de repositorio con Oracle en este stack."
argument-hint: 'método de repositorio a crear o revisar'
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Skill: ODP.NET Repositorio — .NET Framework 4.8

Instrucciones para generar métodos de acceso a datos consistentes con los patrones reales del proyecto.

## Cuándo NO aplica

No uses esta skill para Entity Framework / EF Core / Dapper, para .NET Core / .NET 5+, ni para
lógica de controladores, servicios o vistas. Es específica de repositorios ODP.NET en .NET Framework 4.8.

---

## Contexto del proyecto

- **Motor de base de datos**: Oracle 21c
- **Driver**: `Oracle.ManagedDataAccess.Client` (ODP.NET Managed)
- **Framework**: .NET Framework 4.8 / ASP.NET MVC
- **Connection string**: leída desde `ConfigurationManager.ConnectionStrings["strConexionPSI"].ConnectionString`
- **Todos los métodos son `async/await`**

---

## Dos estilos de conexión — cuál usar

### Estilo A — `OracleConnection` directo ✅ (preferido para código nuevo)

Úsalo cuando el método es nuevo o se reescribe. Es el estilo moderno del proyecto.

```csharp
private string OracleConnectionString =>
    ConfigurationManager.ConnectionStrings["strConexionPSI"].ConnectionString;
```

Flujo:
```csharp
using (OracleConnection conn = new OracleConnection(OracleConnectionString))
using (OracleCommand cmd = new OracleCommand(sql, conn))
{
    cmd.BindByName = true;
    // agregar parámetros...
    await conn.OpenAsync();
    // ExecuteReaderAsync / ExecuteNonQueryAsync
}
```

### Estilo B — `ConDBOracle` wrapper (solo en código legacy existente)

Úsalo únicamente si el método está dentro de una clase que ya usa este helper, para no mezclar estilos.

```csharp
ConDBOracle cnOracle = new ConDBOracle("strConexionPSI");
OracleCommand objCommand = new OracleCommand();
DataTable resultado = new DataTable();
// ...
if (cnOracle.Conectar())
{
    resultado.Load(await objCommand.ExecuteReaderAsync());
    cnOracle.Desconectar();
}
// iterar resultado.Rows con DataRow
```

> ⚠️ En código nuevo, siempre Estilo A. No mezclar estilos dentro del mismo método.

---

## Convenciones de parámetros Oracle

- Siempre `cmd.BindByName = true`
- Prefijo de parámetro: `:P_nombreParam` (mayúsculas para parámetros de entrada)
- Ejemplo:

```csharp
cmd.Parameters.Add(":P_empl_consecutivo", OracleDbType.Int32).Value = llaves.EmplConsecutivo;
cmd.Parameters.Add(":P_empl_unde_fuerza", OracleDbType.Int16).Value = llaves.EmplUndeFuerza;
cmd.Parameters.Add(":P_fecha_inicio_ciclo", OracleDbType.Date).Value = fecha.Date;
```

### Mapeo de tipos C# → OracleDbType

| C#             | OracleDbType        | Nota                              |
|----------------|---------------------|-----------------------------------|
| `int`          | `OracleDbType.Int32`  |                                   |
| `short`/`int16`| `OracleDbType.Int16`  |                                   |
| `long`         | `OracleDbType.Int64`  |                                   |
| `string`       | `OracleDbType.Varchar2` |                                 |
| `DateTime`     | `OracleDbType.Date`   | Usar `.Date` para quitar la hora  |
| `decimal`      | `OracleDbType.Decimal`|                                   |
| `double`       | `OracleDbType.Double` |                                   |
| RefCursor      | `OracleDbType.RefCursor` |                                |

---

## Patrones por tipo de operación

### 1. SELECT con SQL inline — retorna lista

```csharp
public async Task<List<DtoMiEntidad>> GetEntidadesAsync(int id)
{
    var lista = new List<DtoMiEntidad>();
    string sql = @"SELECT col1, col2 FROM MI_TABLA WHERE id = :P_id";

    try
    {
        using (OracleConnection conn = new OracleConnection(OracleConnectionString))
        using (OracleCommand cmd = new OracleCommand(sql, conn))
        {
            cmd.BindByName = true;
            cmd.Parameters.Add(":P_id", OracleDbType.Int32).Value = id;

            await conn.OpenAsync();
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    lista.Add(MapearEntidad(reader));
                }
            }
        }
    }
    catch (Exception ex)
    {
        LogException.Nivel = LogException.TipoMensaje.M_ERROR;
        LogException.err("Error en GetEntidadesAsync:", ex);
        throw; // o no throw si se prefiere retornar lista vacía
    }
    return lista;
}
```

> **`throw` o no `throw`**: Si el error debe propagarse al servicio (para mostrar mensaje de error al usuario), usar `throw`. Si la UI puede mostrar lista vacía sin error, omitirlo.

---

### 2. SELECT que retorna un solo objeto

```csharp
public async Task<DtoMiEntidad> GetEntidadAsync(int id)
{
    DtoMiEntidad entidad = null;
    string sql = @"SELECT col1, col2 FROM MI_TABLA WHERE id = :P_id";

    try
    {
        using (OracleConnection conn = new OracleConnection(OracleConnectionString))
        using (OracleCommand cmd = new OracleCommand(sql, conn))
        {
            cmd.BindByName = true;
            cmd.Parameters.Add(":P_id", OracleDbType.Int32).Value = id;

            await conn.OpenAsync();
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (reader.Read()) // No await aquí — primer registro
                {
                    entidad = MapearEntidad(reader);
                }
            }
        }
    }
    catch (Exception ex)
    {
        LogException.Nivel = LogException.TipoMensaje.M_ERROR;
        LogException.err("Error en GetEntidadAsync:", ex);
    }
    return entidad;
}
```

---

### 3. INSERT / UPDATE / DELETE

```csharp
public async Task InsertarAsync(DtoMiEntidad dto)
{
    string sql = @"INSERT INTO MI_TABLA (col1, col2, fecha_creacion)
                   VALUES (:P_col1, :P_col2, SYSDATE)";
    try
    {
        using (OracleConnection conn = new OracleConnection(OracleConnectionString))
        using (OracleCommand cmd = new OracleCommand(sql, conn))
        {
            cmd.BindByName = true;
            cmd.Parameters.Add(":P_col1", OracleDbType.Int32).Value = dto.Col1;
            cmd.Parameters.Add(":P_col2", OracleDbType.Varchar2).Value = dto.Col2;

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }
    }
    catch (Exception ex)
    {
        LogException.Nivel = LogException.TipoMensaje.M_ERROR;
        LogException.err("Error en InsertarAsync:", ex);
    }
}
```

> **`SYSDATE`** se escribe directamente en el SQL, nunca como parámetro.

---

## Stored procedures y funciones Oracle

Para llamar a `PAQUETE.F_Funcion` o `PAQUETE.P_Procedimiento` (ReturnValue de función,
RefCursor como ReturnValue, parámetros `OUT`), lee `references/stored-procedures.md`
antes de escribir el método.

---

## Mapeo de OracleDataReader → DTO

Patrón `GetOrdinal` + `IsDBNull`, reglas de nulabilidad por tipo, y tipos ODP.NET
especiales (`OracleDecimal`, `OracleDate`) — en `references/mapeo-dto.md`.

---

## Manejo de errores

```csharp
catch (Exception ex)
{
    LogException.Nivel = LogException.TipoMensaje.M_ERROR;
    LogException.err("Descripción del método o contexto:", ex);
    // throw; — solo si el error debe propagarse
}
```

> - Sin `throw`: el método retorna null/lista vacía (la UI maneja silenciosamente).
> - Con `throw`: el error sube al servicio o controlador para mostrar mensaje al usuario.

---

## Reglas obligatorias — siempre aplicar

Todo método de repositorio generado debe cumplir sin excepción:

- Firma `async Task<T>` en todos los métodos de acceso a datos
- `using` en `OracleConnection` y `OracleCommand`
- `cmd.BindByName = true` siempre presente
- Parámetros con prefijo `:P_` y tipo `OracleDbType` explícito en cada uno
- `await conn.OpenAsync()` antes de cualquier ejecución
- Mapeo con `GetOrdinal` + `IsDBNull` en todos los campos del reader
- `LogException` en el bloque `catch`
- `SYSDATE` escrito directamente en el SQL, nunca como parámetro
- Comentario XML `/// <summary>` en todo método público

---

## Skill relacionada

El contrato de nombres del lado Oracle (`PK_`, `F_`, `P_`, parámetros `P_out_...`) y la regla
de que las funciones `SYS_REFCURSOR` nunca retornan `NULL` (siempre cursor vacío tipado) están
definidos en la skill `oracle-plsql-paquetes`. Revisa esa skill si también estás escribiendo o
modificando el paquete PL/SQL que este repositorio consume.
