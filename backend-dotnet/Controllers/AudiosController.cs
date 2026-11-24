using backend_dotnet.Data;
using backend_dotnet.DTOs.Audios;
using backend_dotnet.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/audios")]
public class AudiosController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly IDevUserProvider _devUser;
    private readonly IWebHostEnvironment _environment;

    public AudiosController(
        VoxifyDbContext context,
        IDevUserProvider devUser,
        IWebHostEnvironment environment)
    {
        _context = context;
        _devUser = devUser;
        _environment = environment;
    }

    // GET: api/audios/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var usuario = await _devUser.ObtenerAsync();

        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.IdAudio == id && a.IdUsuario == usuario.IdUsuario);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        return Ok(ToDto(audio));
    }

    // GET: api/audios/5/reproducir
    [HttpGet("{id}/reproducir")]
    public async Task<IActionResult> Reproducir(int id)
    {
        var usuario = await _devUser.ObtenerAsync();

        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.IdAudio == id && a.IdUsuario == usuario.IdUsuario);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        var ruta = ResolverRuta(audio.DireccionFisica);
        if (!System.IO.File.Exists(ruta))
            return NotFound("El archivo de audio no existe.");

        return PhysicalFile(ruta, ObtenerContentType(audio.Formato));
    }

    // GET: api/audios/5/descargar
    [HttpGet("{id}/descargar")]
    public async Task<IActionResult> Descargar(int id)
    {
        var usuario = await _devUser.ObtenerAsync();

        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.IdAudio == id && a.IdUsuario == usuario.IdUsuario);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        var ruta = ResolverRuta(audio.DireccionFisica);
        if (!System.IO.File.Exists(ruta))
            return NotFound("El archivo de audio no existe.");

        return PhysicalFile(ruta, ObtenerContentType(audio.Formato), audio.NombreArchivo);
    }

    // DELETE: api/audios/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Ocultar(int id)
    {
        var usuario = await _devUser.ObtenerAsync();

        var audio = await _context.Audios
            .FirstOrDefaultAsync(a => a.IdAudio == id && a.IdUsuario == usuario.IdUsuario);

        if (audio == null)
            return NotFound("Audio no encontrado.");

        audio.Estado = "Oculto";
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string ResolverRuta(string direccionFisica) =>
        Path.IsPathRooted(direccionFisica)
            ? direccionFisica
            : Path.Combine(_environment.ContentRootPath, direccionFisica);

    private static string ObtenerContentType(string formato) => formato.ToLowerInvariant() switch
    {
        "mp3" => "audio/mpeg",
        "ogg" => "audio/ogg",
        _ => "audio/wav"
    };

    private static AudioResponseDto ToDto(Models.Audio a) => new()
    {
        IdAudio = a.IdAudio,
        NombreArchivo = a.NombreArchivo,
        Formato = a.Formato,
        TamanoBytes = a.TamanoBytes,
        FechaCreacion = a.FechaCreacion,
        DuracionSegundos = a.DuracionSegundos,
        Estado = a.Estado,
        IdUsuario = a.IdUsuario,
        IdVoz = a.IdVoz,
        IdIdioma = a.IdIdioma
    };
}
