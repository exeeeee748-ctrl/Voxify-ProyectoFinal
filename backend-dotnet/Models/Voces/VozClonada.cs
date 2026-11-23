namespace backend_dotnet.Models.Voces;

public class VozClonada
{
    public int IdVozClonada { get; set; }

    public int UsuarioId { get; set; }

    public int? IdVoz { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Archivo { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public bool Activa { get; set; } = true;

    public Voz? Voz { get; set; }
}
