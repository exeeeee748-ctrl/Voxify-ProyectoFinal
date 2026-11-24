namespace backend_dotnet.Models;

public class Audio
{
    public int IdAudio { get; set; }

    public string DireccionFisica { get; set; } = string.Empty;

    public string NombreArchivo { get; set; } = string.Empty;

    public string Formato { get; set; } = string.Empty;

    public long? TamanoBytes { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public double? DuracionSegundos { get; set; }

    public string Estado { get; set; } = "Disponible";

    public int IdUsuario { get; set; }

    public int IdVoz { get; set; }

    public int IdIdioma { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public Voz Voz { get; set; } = null!;

    public Idioma Idioma { get; set; } = null!;

    public SolicitudGeneracion? SolicitudGeneracion { get; set; }
}
