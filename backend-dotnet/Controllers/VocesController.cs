using backend_dotnet.Data;
using backend_dotnet.DTOs.Voces;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/voces")]
public class VocesController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public VocesController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodas(int? idiomaId, string? tipo)
    {
        var query = _context.Voces.AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            query = tipo.ToLowerInvariant() switch
            {
                "clonada" => query.Where(v => v.Tipo == TipoVoz.Clonada),
                "predeterminada" => query.Where(v => v.Tipo == TipoVoz.Predeterminada),
                _ => query
            };
        }
        else
        {
            // Catálogo público: solo voces predeterminadas.
            query = query.Where(v => v.Tipo == TipoVoz.Predeterminada);
        }

        if (idiomaId.HasValue)
        {
            query = query.Where(v => v.VozIdioma.Any(vi => vi.IdIdioma == idiomaId.Value));
        }

        var voces = await query
            .Include(v => v.VozIdioma)
                .ThenInclude(vi => vi.Idioma)
            .OrderBy(v => v.Nombre)
            .ToListAsync();

        return Ok(voces.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var voz = await _context.Voces
            .Include(v => v.VozIdioma)
                .ThenInclude(vi => vi.Idioma)
            .FirstOrDefaultAsync(v => v.IdVoz == id);

        if (voz == null)
            return NotFound("Voz no encontrada.");

        return Ok(ToDto(voz));
    }

    private static VozResponseDto ToDto(Voz voz) => new()
    {
        IdVoz = voz.IdVoz,
        Nombre = voz.Nombre,
        Descripcion = voz.Descripcion,
        Genero = voz.Genero,
        Acento = voz.Acento,
        Tipo = voz.Tipo.ToString(),
        Estado = voz.Estado.ToString(),
        Idiomas = voz.VozIdioma
            .Select(vi => vi.Idioma.Codigo)
            .OrderBy(codigo => codigo)
            .ToList()
    };
}
