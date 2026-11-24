using System.ComponentModel.DataAnnotations;

namespace backend_dotnet.DTOs.Usuarios;

public class UsuarioUpdateDto
{
    [StringLength(100)]
    public string? Nombre { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? Correo { get; set; }
}
