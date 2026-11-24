using System;

namespace backend_dotnet.Models;

public class CuentaExterna
{
    public int IdCuentaExterna { get; set; }

    public string Proveedor { get; set; } = string.Empty;

    public string IdUsuarioProveedor { get; set; } = string.Empty;

    public int IdUsuario { get; set; }

    // Relación
    public Usuario Usuario { get; set; } = null!;
}
