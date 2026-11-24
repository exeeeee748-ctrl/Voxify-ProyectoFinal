namespace backend_dotnet.DTOs.Generaciones;

public class SolicitudGeneracionResponseDto
{
    public int IdSolicitudGeneracion { get; set; }

    public string Texto { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public DateTime FechaSolicitud { get; set; }

    public DateTime? FechaFinalizacion { get; set; }

    public string? MensajeError { get; set; }

    public int IdVoz { get; set; }

    public string? NombreVoz { get; set; }

    public int IdIdioma { get; set; }

    public string? NombreIdioma { get; set; }

    public int? IdAudio { get; set; }
}
