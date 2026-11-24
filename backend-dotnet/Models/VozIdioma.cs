namespace backend_dotnet.Models;

public class VozIdioma
{
    public int IdVoz { get; set; }

    public int IdIdioma { get; set; }

    public Voz Voz { get; set; } = null!;

    public Idioma Idioma { get; set; } = null!;
}
