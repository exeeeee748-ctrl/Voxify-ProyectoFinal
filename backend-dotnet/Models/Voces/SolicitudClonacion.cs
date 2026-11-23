namespace backend_dotnet.Models.Voces;

public class SolicitudClonacion
{
    public int IdSolicitudClonacion { get; set; }

    public int UsuarioId { get; set; }

    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public bool Activa { get; set; } = true;

    public ICollection<MuestraVoz> Muestras { get; set; } = new List<MuestraVoz>();
}
