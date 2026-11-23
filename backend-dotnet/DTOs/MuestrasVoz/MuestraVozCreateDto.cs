using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.MuestrasVoz;

public class MuestraVozCreateDto
{
    [Range(1, int.MaxValue)]
    public int IdSolicitudClonacion { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string Archivo { get; set; } = string.Empty;

    [Range(0.1, 3600)]
    public double? DuracionSegundos { get; set; }
}
