using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.Configuracion;

public class ConfiguracionUsuarioDto
{
    public int? IdUltimaVoz { get; set; }

    public int? IdUltimoIdioma { get; set; }

    [StringLength(20)]
    public string? Tema { get; set; }
}
