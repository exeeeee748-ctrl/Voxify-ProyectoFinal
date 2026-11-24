using System;

namespace backend_dotnet.Models;

public class ConfiguracionUsuario
{
    public int IdConfiguracion { get; set; }

    public int IdUsuario { get; set; }

    public int? IdUltimaVoz { get; set; }

    public int? IdUltimoIdioma { get; set; }

    public string? Tema { get; set; }

    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    // Relaciones
    public Usuario Usuario { get; set; } = null!;

    public Voz? UltimaVoz { get; set; }

    public Idioma? UltimoIdioma { get; set; }
}
