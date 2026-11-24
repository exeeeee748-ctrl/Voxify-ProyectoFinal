using System;

namespace backend_dotnet.Models;

public class FavoritoIdioma
{
    public int IdUsuario { get; set; }

    public int IdIdioma { get; set; }

    // Relaciones
    public Usuario Usuario { get; set; } = null!;

    public Idioma Idioma { get; set; } = null!;
}
