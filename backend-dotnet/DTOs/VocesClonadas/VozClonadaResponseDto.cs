namespace backend_dotnet.DTOs.VocesClonadas;

public class VozClonadaResponseDto
{
    public int IdVoz { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public int IdUsuario { get; set; }

    public int? IdSolicitudClonacion { get; set; }

    public DateTime FechaCreacion { get; set; }

    public string Estado { get; set; } = string.Empty;

    public string? Archivo { get; set; }
}
