namespace backend_dotnet.DTOs.Clonaciones;

public class SolicitudClonacionResponseDto
{
    public int IdSolicitudClonacion { get; set; }

    public string NombreVoz { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public DateTime FechaSolicitud { get; set; }

    public DateTime? FechaFinalizacion { get; set; }

    public string? MensajeError { get; set; }

    public int? IdMuestra { get; set; }

    public int? IdVozClonada { get; set; }
}
