using backend_dotnet.Data;
using backend_dotnet.DTOs.Idiomas;
using backend_dotnet.DTOs.Voces;
using backend_dotnet.Models;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Authorize]
[Route("api/usuarios/me/favoritos")]
public class FavoritosController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly ICurrentUserProvider _currentUser;

    public FavoritosController(VoxifyDbContext context, ICurrentUserProvider currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // Voces favoritas

    [HttpGet("voces")]
    public async Task<IActionResult> VocesFavoritas()
    {
        var usuario = await _currentUser.ObtenerAsync();

        var voces = await _context.FavoritosVoz
            .Where(f => f.IdUsuario == usuario.IdUsuario)
            .Include(f => f.Voz)
                .ThenInclude(v => v.VozIdioma)
                .ThenInclude(vi => vi.Idioma)
            .Select(f => f.Voz)
            .OrderBy(v => v.Nombre)
            .ToListAsync();

        return Ok(voces.Select(ToVozDto));
    }

    [HttpPost("voces/{idVoz}")]
    public async Task<IActionResult> AgregarVozFavorita(int idVoz)
    {
        var usuario = await _currentUser.ObtenerAsync();

        if (!await _context.Voces.AnyAsync(v => v.IdVoz == idVoz))
            return NotFound("Voz no encontrada.");

        var existe = await _context.FavoritosVoz
            .AnyAsync(f => f.IdUsuario == usuario.IdUsuario && f.IdVoz == idVoz);

        if (!existe)
        {
            _context.FavoritosVoz.Add(new FavoritoVoz
            {
                IdUsuario = usuario.IdUsuario,
                IdVoz = idVoz
            });
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("voces/{idVoz}")]
    public async Task<IActionResult> QuitarVozFavorita(int idVoz)
    {
        var usuario = await _currentUser.ObtenerAsync();

        var favorito = await _context.FavoritosVoz
            .FirstOrDefaultAsync(f => f.IdUsuario == usuario.IdUsuario && f.IdVoz == idVoz);

        if (favorito != null)
        {
            _context.FavoritosVoz.Remove(favorito);
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    // Idiomas favoritos

    [HttpGet("idiomas")]
    public async Task<IActionResult> IdiomasFavoritos()
    {
        var usuario = await _currentUser.ObtenerAsync();

        var idiomas = await _context.FavoritosIdioma
            .Where(f => f.IdUsuario == usuario.IdUsuario)
            .Include(f => f.Idioma)
            .Select(f => f.Idioma)
            .OrderBy(i => i.Nombre)
            .ToListAsync();

        return Ok(idiomas.Select(ToIdiomaDto));
    }

    [HttpPost("idiomas/{idIdioma}")]
    public async Task<IActionResult> AgregarIdiomaFavorito(int idIdioma)
    {
        var usuario = await _currentUser.ObtenerAsync();

        if (!await _context.Idiomas.AnyAsync(i => i.IdIdioma == idIdioma && i.Activo))
            return NotFound("Idioma no encontrado.");

        var existe = await _context.FavoritosIdioma
            .AnyAsync(f => f.IdUsuario == usuario.IdUsuario && f.IdIdioma == idIdioma);

        if (!existe)
        {
            _context.FavoritosIdioma.Add(new FavoritoIdioma
            {
                IdUsuario = usuario.IdUsuario,
                IdIdioma = idIdioma
            });
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("idiomas/{idIdioma}")]
    public async Task<IActionResult> QuitarIdiomaFavorito(int idIdioma)
    {
        var usuario = await _currentUser.ObtenerAsync();

        var favorito = await _context.FavoritosIdioma
            .FirstOrDefaultAsync(f => f.IdUsuario == usuario.IdUsuario && f.IdIdioma == idIdioma);

        if (favorito != null)
        {
            _context.FavoritosIdioma.Remove(favorito);
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    private static VozResponseDto ToVozDto(Voz voz) => new()
    {
        IdVoz = voz.IdVoz,
        Nombre = voz.Nombre,
        Descripcion = voz.Descripcion,
        Genero = voz.Genero,
        Acento = voz.Acento,
        Tipo = voz.Tipo.ToString(),
        Estado = voz.Estado.ToString(),
        Idiomas = voz.VozIdioma.Select(vi => vi.Idioma.Codigo).OrderBy(c => c).ToList()
    };

    private static IdiomaResponseDto ToIdiomaDto(Idioma idioma) => new()
    {
        IdIdioma = idioma.IdIdioma,
        Nombre = idioma.Nombre,
        Codigo = idioma.Codigo
    };
}
