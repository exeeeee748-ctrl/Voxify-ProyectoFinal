namespace backend_dotnet.Models.Voces;

public class MuestraVoz
{
    public int IdMuestra { get; set; }

    public int IdSolicitudClonacion { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string DireccionFisica { get; set; } = string.Empty;

    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;

    public double? DuracionSegundos { get; set; }

    public string Estado { get; set; } = "Pendiente";

    public SolicitudClonacion SolicitudClonacion { get; set; } = null!;
}
