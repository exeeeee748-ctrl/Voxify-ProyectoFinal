using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.Voces;

public class VozCreateDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [StringLength(50)]
    public string? Genero { get; set; }

    [StringLength(100)]
    public string? Acento { get; set; }
}
