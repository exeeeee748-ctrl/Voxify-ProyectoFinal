namespace backend_dotnet.DTOs.Audios;

public class AudioResponseDto
{
    public int IdAudio { get; set; }

    public string NombreArchivo { get; set; } = string.Empty;

    public string Formato { get; set; } = string.Empty;

    public long? TamanoBytes { get; set; }

    public DateTime FechaCreacion { get; set; }

    public double? DuracionSegundos { get; set; }

    public string Estado { get; set; } = string.Empty;

    public int IdUsuario { get; set; }

    public int IdVoz { get; set; }

    public int IdIdioma { get; set; }
}
