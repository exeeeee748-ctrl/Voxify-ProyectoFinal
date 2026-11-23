using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.SolicitudesClonacion;

public class SolicitudClonacionCreateDto
{
    [Range(1, int.MaxValue)]
    public int UsuarioId { get; set; }
}
