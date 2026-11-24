using backend_dotnet.Data;
using backend_dotnet.DTOs.VocesClonadas;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VozClonada = backend_dotnet.Models.Voces.VozClonada;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/voces-clonadas")]
public class VocesClonadasController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly IDevUserProvider _devUser;

    public VocesClonadasController(VoxifyDbContext context, IDevUserProvider devUser)
    {
        _context = context;
        _devUser = devUser;
    }

    [HttpGet("/api/usuarios/me/voces-clonadas")]
    public async Task<IActionResult> MisVoces()
    {
        var usuario = await _devUser.ObtenerAsync();

        var voces = await _context.VocesClonadas
            .Where(v => v.IdUsuario == usuario.IdUsuario)
            .Include(v => v.Voz)
            .OrderBy(v => v.FechaCreacion)
            .ToListAsync();

        return Ok(voces.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var usuario = await _devUser.ObtenerAsync();

        var voz = await _context.VocesClonadas
            .Include(v => v.Voz)
            .FirstOrDefaultAsync(v => v.IdVoz == id && v.IdUsuario == usuario.IdUsuario);

        if (voz == null)
            return NotFound("Voz clonada no encontrada.");

        return Ok(ToDto(voz));
    }

    private static VozClonadaResponseDto ToDto(VozClonada voz) => new()
    {
        IdVoz = voz.IdVoz,
        Nombre = voz.Voz.Nombre,
        IdUsuario = voz.IdUsuario,
        IdSolicitudClonacion = voz.IdSolicitudClonacion,
        FechaCreacion = voz.FechaCreacion,
        Estado = voz.Estado.ToString(),
        Archivo = voz.Archivo
    };
}
