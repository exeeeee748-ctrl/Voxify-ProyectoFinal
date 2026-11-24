namespace backend_dotnet.Models;

public class Voz
{
    public int IdVoz { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Genero { get; set; }

    public string? Acento { get; set; }

    public TipoVoz Tipo { get; set; } = TipoVoz.Predeterminada;

    public EstadoVoz Estado { get; set; } = EstadoVoz.Disponible;

    // Relaciones
    public ICollection<FavoritoVoz> Favoritos { get; set; }
        = new List<FavoritoVoz>();

    public ICollection<ConfiguracionUsuario> Configuraciones { get; set; }
        = new List<ConfiguracionUsuario>();

    public ICollection<VozIdioma> VozIdioma { get; set; }
        = new List<VozIdioma>();

    public backend_dotnet.Models.Voces.VozClonada? VozClonada { get; set; }

    public ICollection<Audio> Audios { get; set; }
        = new List<Audio>();

    public ICollection<SolicitudGeneracion> SolicitudesGeneracion { get; set; }
        = new List<SolicitudGeneracion>();
}
