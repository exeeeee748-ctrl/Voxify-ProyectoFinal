namespace backend_dotnet.Models.Voces;

public class SolicitudClonacion
{
    public int IdSolicitudClonacion { get; set; }

    public int IdUsuario { get; set; }

    public string NombreVoz { get; set; } = string.Empty;

    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public DateTime? FechaFinalizacion { get; set; }

    public string? MensajeError { get; set; }

    public backend_dotnet.Models.Usuario Usuario { get; set; } = null!;

    public MuestraVoz? Muestra { get; set; }

    public VozClonada? VozClonada { get; set; }
}
