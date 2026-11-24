namespace backend_dotnet.Models;

public class SolicitudGeneracion
{
    public int IdSolicitudGeneracion { get; set; }

    public int IdUsuario { get; set; }

    public int IdVoz { get; set; }

    public int IdIdioma { get; set; }

    public string Texto { get; set; } = string.Empty;

    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public DateTime? FechaFinalizacion { get; set; }

    public string? MensajeError { get; set; }

    public int? IdAudio { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public Voz Voz { get; set; } = null!;

    public Idioma Idioma { get; set; } = null!;

    public Audio? Audio { get; set; }
}
