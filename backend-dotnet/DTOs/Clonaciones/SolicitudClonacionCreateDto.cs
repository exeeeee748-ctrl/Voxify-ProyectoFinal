using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.Clonaciones;

public class SolicitudClonacionCreateDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string NombreVoz { get; set; } = string.Empty;
}
