namespace backend_dotnet.Models.Voces;

public class Voz
{
    public int IdVoz { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Genero { get; set; }

    public string? Acento { get; set; }

    public bool Activa { get; set; } = true;
}
