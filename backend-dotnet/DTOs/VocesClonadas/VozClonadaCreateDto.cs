using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.VocesClonadas;

public class VozClonadaCreateDto
{
    [Range(1, int.MaxValue)]
    public int UsuarioId { get; set; }

    [Range(1, int.MaxValue)]
    public int? IdVoz { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Archivo { get; set; }
}
