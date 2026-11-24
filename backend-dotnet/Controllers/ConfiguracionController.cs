using backend_dotnet.Data;
using backend_dotnet.DTOs.Configuracion;
using backend_dotnet.Models;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/usuarios/me/configuracion")]
public class ConfiguracionController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly IDevUserProvider _devUser;

    public ConfiguracionController(VoxifyDbContext context, IDevUserProvider devUser)
    {
        _context = context;
        _devUser = devUser;
    }

    [HttpGet]
    public async Task<IActionResult> Obtener()
    {
        var usuario = await _devUser.ObtenerAsync();

        var configuracion = await _context.ConfiguracionesUsuario
            .FirstOrDefaultAsync(c => c.IdUsuario == usuario.IdUsuario);

        return Ok(configuracion == null ? new ConfiguracionUsuarioDto() : ToDto(configuracion));
    }

    [HttpPut]
    public async Task<IActionResult> Guardar(ConfiguracionUsuarioDto dto)
    {
        var usuario = await _devUser.ObtenerAsync();

        if (dto.IdUltimaVoz.HasValue &&
            !await _context.Voces.AnyAsync(v => v.IdVoz == dto.IdUltimaVoz.Value))
            return BadRequest(new { detail = "La voz indicada no existe." });

        if (dto.IdUltimoIdioma.HasValue &&
            !await _context.Idiomas.AnyAsync(i => i.IdIdioma == dto.IdUltimoIdioma.Value && i.Activo))
            return BadRequest(new { detail = "El idioma indicado no existe o está inactivo." });

        var configuracion = await _context.ConfiguracionesUsuario
            .FirstOrDefaultAsync(c => c.IdUsuario == usuario.IdUsuario);

        if (configuracion == null)
        {
            configuracion = new ConfiguracionUsuario
            {
                IdUsuario = usuario.IdUsuario,
                FechaActualizacion = DateTime.UtcNow
            };
            _context.ConfiguracionesUsuario.Add(configuracion);
        }

        configuracion.IdUltimaVoz = dto.IdUltimaVoz;
        configuracion.IdUltimoIdioma = dto.IdUltimoIdioma;
        configuracion.Tema = dto.Tema;
        configuracion.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ToDto(configuracion));
    }

    private static ConfiguracionUsuarioDto ToDto(ConfiguracionUsuario c) => new()
    {
        IdUltimaVoz = c.IdUltimaVoz,
        IdUltimoIdioma = c.IdUltimoIdioma,
        Tema = c.Tema
    };
}
