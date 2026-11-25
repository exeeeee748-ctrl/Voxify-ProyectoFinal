namespace backend_dotnet.Models;

public class Usuario
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;

    // TikTok puede no devolver correo; por eso el correo es opcional.
    public string? Correo { get; set; }

    public string? AvatarUrl { get; set; }

    // Reservado para futuras cuentas locales; las cuentas OAuth no lo usan.
    public string? PasswordHash { get; set; }

    public EstadoUsuario Estado { get; set; } = EstadoUsuario.Activo;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public DateTime? FechaActualizacion { get; set; }

    // Relaciones
    public ICollection<CuentaExterna> CuentasExternas { get; set; }
        = new List<CuentaExterna>();

    public ICollection<SesionUsuario> Sesiones { get; set; }
        = new List<SesionUsuario>();

    public ConfiguracionUsuario? Configuracion { get; set; }

    public ICollection<FavoritoVoz> VocesFavoritas { get; set; }
        = new List<FavoritoVoz>();

    public ICollection<FavoritoIdioma> IdiomasFavoritos { get; set; }
        = new List<FavoritoIdioma>();

    public ICollection<backend_dotnet.Models.Voces.VozClonada> VocesClonadas { get; set; }
        = new List<backend_dotnet.Models.Voces.VozClonada>();

    public ICollection<backend_dotnet.Models.Voces.SolicitudClonacion> SolicitudesClonacion { get; set; }
        = new List<backend_dotnet.Models.Voces.SolicitudClonacion>();

    public ICollection<SolicitudGeneracion> SolicitudesGeneracion { get; set; }
        = new List<SolicitudGeneracion>();

    public ICollection<Audio> Audios { get; set; }
        = new List<Audio>();
}
