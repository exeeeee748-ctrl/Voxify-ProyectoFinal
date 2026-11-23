using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.Models;

public class SolicitudGeneracion
{
    public int Id { get; set; }

    [Required]
    public string Texto { get; set; } = string.Empty;

    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public string Estado { get; set; } = "Pendiente";

    public int IdiomaId { get; set; }

    public Idioma? Idioma { get; set; }
public bool Activo { get; set; } = true;
}
