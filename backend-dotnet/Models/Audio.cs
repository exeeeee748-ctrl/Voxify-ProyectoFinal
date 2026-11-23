using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.Models;

public class Audio
{
    public int Id { get; set; }

    [Required]
    public string NombreArchivo { get; set; } = string.Empty;

    public string RutaArchivo { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public int SolicitudGeneracionId { get; set; }

    public SolicitudGeneracion? SolicitudGeneracion { get; set; }

    public bool Activo { get; set; } = true;
}
