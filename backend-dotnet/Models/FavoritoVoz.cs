using System;

namespace backend_dotnet.Models;

public class FavoritoVoz
{
    public int IdUsuario { get; set; }

    public int IdVoz { get; set; }

    // Relaciones
    public Usuario Usuario { get; set; } = null!;

    public Voz Voz { get; set; } = null!;
}
