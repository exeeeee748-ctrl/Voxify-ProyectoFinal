using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.Generaciones;

public class SolicitudGeneracionCreateDto
{
    [Required]
    public string Texto { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int IdVoz { get; set; }

    [Range(1, int.MaxValue)]
    public int IdIdioma { get; set; }
}
