namespace backend_dotnet.DTOs.Voces;

public class VozResponseDto
{
    public int IdVoz { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Genero { get; set; }

    public string? Acento { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public List<string> Idiomas { get; set; } = new List<string>();
}
