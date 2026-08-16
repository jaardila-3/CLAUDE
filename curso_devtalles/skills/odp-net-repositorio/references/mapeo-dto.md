# Mapeo de OracleDataReader → DTO

## Patrón estándar con GetOrdinal

```csharp
private DtoMiEntidad MapearEntidad(IDataReader reader)
{
    return new DtoMiEntidad
    {
        Id          = reader.IsDBNull(reader.GetOrdinal("ID"))          ? 0    : reader.GetInt32(reader.GetOrdinal("ID")),
        Nombre      = reader.IsDBNull(reader.GetOrdinal("NOMBRE"))      ? null : reader.GetString(reader.GetOrdinal("NOMBRE")),
        Fecha       = reader.IsDBNull(reader.GetOrdinal("FECHA"))       ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("FECHA")),
        Activo      = reader.IsDBNull(reader.GetOrdinal("ACTIVO"))      ? false : reader.GetString(reader.GetOrdinal("ACTIVO")) == "S",
    };
}
```

## Reglas de mapeo por tipo

| Oracle / C#       | Nulable               | No nulable (default)    |
|-------------------|-----------------------|-------------------------|
| Número entero     | `(int?)null`          | `0`                     |
| Varchar2 / texto  | `null`                | `string.Empty`          |
| Date              | `(DateTime?)null`     | `DateTime.MinValue`     |
| Decimal / double  | `(decimal?)null`      | `0`                     |

> Usar `string.Empty` en lugar de `""` para campos de texto que no deben ser null (Ej: título, descripción requerida).

## Tipos ODP.NET especiales en parámetros de salida

```csharp
// OracleDecimal → int
if (param.Value is OracleDecimal od) resultado.Id = od.ToInt32();

// OracleDate → DateTime
if (param.Value is OracleDate fecha && !fecha.IsNull) resultado.Fecha = fecha.Value;

// Varchar2 de salida
string val = param.Value?.ToString() ?? string.Empty;
```
