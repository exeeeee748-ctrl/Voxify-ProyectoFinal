namespace backend_dotnet.Models.Voces;

public class MuestraVoz
{
    public int IdMuestraVoz { get; set; }

    public int IdSolicitudClonacion { get; set; }

    public string Archivo { get; set; } = string.Empty;

    public double? DuracionSegundos { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public bool Activa { get; set; } = true;

    public SolicitudClonacion? SolicitudClonacion { get; set; }
}
