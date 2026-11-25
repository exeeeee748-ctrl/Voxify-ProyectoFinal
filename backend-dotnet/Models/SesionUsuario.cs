namespace backend_dotnet.Models;

public class SesionUsuario
{
    public Guid IdSesion { get; set; } = Guid.NewGuid();

    public int IdUsuario { get; set; }

    public string Proveedor { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime FechaExpiracion { get; set; } = DateTime.UtcNow.AddDays(7);

    public DateTime? FechaRevocacion { get; set; }

    public bool Activa { get; set; } = true;

    public string? MotivoRevocacion { get; set; }

    public string? IpOrigen { get; set; }

    public string? UserAgent { get; set; }

    // Navegacion
    public Usuario Usuario { get; set; } = null!;
}
