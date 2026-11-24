namespace backend_dotnet.Models.Dtos;

public class SintetizarSolicitudRequest
{
    public string? Voz { get; set; }

    public double? Velocidad { get; set; }

    public string? Formato { get; set; }
}
