namespace backend_dotnet.Models.Voces;

public class VozClonada
{
    public int IdVoz { get; set; }

    public int IdUsuario { get; set; }

    public int? IdSolicitudClonacion { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public backend_dotnet.Models.EstadoVoz Estado { get; set; }
        = backend_dotnet.Models.EstadoVoz.Disponible;

    public string? Archivo { get; set; }

    public backend_dotnet.Models.Voz Voz { get; set; } = null!;

    public backend_dotnet.Models.Usuario Usuario { get; set; } = null!;

    public SolicitudClonacion? SolicitudClonacion { get; set; }
}
