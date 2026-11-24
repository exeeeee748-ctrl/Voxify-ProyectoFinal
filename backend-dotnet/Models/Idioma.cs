namespace backend_dotnet.Models;

public class Idioma
{
    public int IdIdioma { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Codigo { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    // Relaciones
    public ICollection<FavoritoIdioma> Favoritos { get; set; }
        = new List<FavoritoIdioma>();

    public ICollection<ConfiguracionUsuario> Configuraciones { get; set; }
        = new List<ConfiguracionUsuario>();

    public ICollection<VozIdioma> VozIdioma { get; set; }
        = new List<VozIdioma>();

    public ICollection<Audio> Audios { get; set; }
        = new List<Audio>();

    public ICollection<SolicitudGeneracion> SolicitudesGeneracion { get; set; }
        = new List<SolicitudGeneracion>();
}
