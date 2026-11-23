using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.Models;

public class HistorialAudio
{
    public int Id { get; set; }

    public int AudioId { get; set; }

    public Audio? Audio { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public bool Visible { get; set; } = true;
}
