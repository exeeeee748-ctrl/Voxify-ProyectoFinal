namespace backend_dotnet.Models;

public class CuentaExterna
{
    public int IdCuentaExterna { get; set; }

    public string Proveedor { get; set; } = string.Empty;

    public string IdUsuarioProveedor { get; set; } = string.Empty;

    public string? CorreoProveedor { get; set; }

    // Los tokens se guardan solo si una integración futura los necesita.
    // Voxify no depende de ellos para mantener su propia sesión.
    public string? AccessToken { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? ExpiraEn { get; set; }

    public DateTime FechaVinculacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaUltimoAcceso { get; set; }

    public int IdUsuario { get; set; }

    // Relación
    public Usuario Usuario { get; set; } = null!;
}
