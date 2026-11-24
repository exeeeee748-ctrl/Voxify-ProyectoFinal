using backend_dotnet.Data;
using backend_dotnet.DTOs.Usuarios;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly IDevUserProvider _devUser;

    public UsuariosController(VoxifyDbContext context, IDevUserProvider devUser)
    {
        _context = context;
        _devUser = devUser;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var usuario = await _devUser.ObtenerAsync();
        return Ok(ToDto(usuario));
    }

    [HttpPut("me")]
    public async Task<IActionResult> ActualizarMe(UsuarioUpdateDto dto)
    {
        var usuario = await _devUser.ObtenerAsync();

        if (!string.IsNullOrWhiteSpace(dto.Nombre))
            usuario.Nombre = dto.Nombre.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Correo))
            usuario.Correo = dto.Correo.Trim();

        await _context.SaveChangesAsync();

        return Ok(ToDto(usuario));
    }

    private static UsuarioResponseDto ToDto(Models.Usuario usuario) => new()
    {
        IdUsuario = usuario.IdUsuario,
        Nombre = usuario.Nombre,
        Correo = usuario.Correo,
        Estado = usuario.Estado.ToString()
    };
}
