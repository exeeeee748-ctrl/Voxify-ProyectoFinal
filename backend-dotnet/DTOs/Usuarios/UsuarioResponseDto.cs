namespace backend_dotnet.DTOs.Usuarios;

public class UsuarioResponseDto
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;
}
