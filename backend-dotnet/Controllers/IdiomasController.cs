using backend_dotnet.Data;
using backend_dotnet.DTOs.Idiomas;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/idiomas")]
public class IdiomasController : ControllerBase
{
    private readonly VoxifyDbContext _context;

    public IdiomasController(VoxifyDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var idiomas = await _context.Idiomas
            .Where(i => i.Activo)
            .OrderBy(i => i.Nombre)
            .ToListAsync();

        return Ok(idiomas.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var idioma = await _context.Idiomas
            .FirstOrDefaultAsync(i => i.IdIdioma == id && i.Activo);

        if (idioma == null)
            return NotFound("Idioma no encontrado.");

        return Ok(ToDto(idioma));
    }

    private static IdiomaResponseDto ToDto(Idioma idioma) => new()
    {
        IdIdioma = idioma.IdIdioma,
        Nombre = idioma.Nombre,
        Codigo = idioma.Codigo
    };
}
