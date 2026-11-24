using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using backend_dotnet.Data;
using backend_dotnet.DTOs.Audios;
using backend_dotnet.DTOs.Generaciones;
using backend_dotnet.Models;
using backend_dotnet.Models.Dtos;
using backend_dotnet.Services;

namespace backend_dotnet.Controllers;

[ApiController]
[Authorize]
[Route("api/generaciones")]
public class GeneracionesController : ControllerBase
{
    private readonly VoxifyDbContext _context;
    private readonly ICurrentUserProvider _currentUser;
    private readonly ITtsService _ttsService;
    private readonly TtsOptions _ttsOptions;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<GeneracionesController> _logger;

    public GeneracionesController(
        VoxifyDbContext context,
        ICurrentUserProvider currentUser,
        ITtsService ttsService,
        IOptions<TtsOptions> ttsOptions,
        IWebHostEnvironment environment,
        ILogger<GeneracionesController> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _ttsService = ttsService;
        _ttsOptions = ttsOptions.Value;
        _environment = environment;
        _logger = logger;
    }

    // POST: api/generaciones
    [HttpPost]
    public async Task<IActionResult> Crear(SolicitudGeneracionCreateDto dto)
    {
        var usuario = await _currentUser.ObtenerAsync();

        var voz = await _context.Voces.FindAsync(dto.IdVoz);
        if (voz == null)
            return BadRequest(new { detail = "La voz indicada no existe." });

        var idioma = await _context.Idiomas
            .FirstOrDefaultAsync(i => i.IdIdioma == dto.IdIdioma && i.Activo);
        if (idioma == null)
            return BadRequest(new { detail = "El idioma indicado no existe o está inactivo." });

        var solicitud = new SolicitudGeneracion
        {
            IdUsuario = usuario.IdUsuario,
            IdVoz = dto.IdVoz,
            IdIdioma = dto.IdIdioma,
            Texto = dto.Texto.Trim(),
            Estado = "Pendiente",
            FechaSolicitud = DateTime.UtcNow,
            Voz = voz,
            Idioma = idioma
        };

        _context.SolicitudesGeneracion.Add(solicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = solicitud.IdSolicitudGeneracion }, ToDto(solicitud));
    }

    // GET: api/usuarios/me/generaciones
    [HttpGet("/api/usuarios/me/generaciones")]
    public async Task<IActionResult> MisGeneraciones()
    {
        var usuario = await _currentUser.ObtenerAsync();

        var solicitudes = await _context.SolicitudesGeneracion
            .Where(s => s.IdUsuario == usuario.IdUsuario)
            .Include(s => s.Voz)
            .Include(s => s.Idioma)
            .OrderByDescending(s => s.FechaSolicitud)
            .ToListAsync();

        return Ok(solicitudes.Select(ToDto));
    }

    // GET: api/generaciones/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var usuario = await _currentUser.ObtenerAsync();

        var solicitud = await _context.SolicitudesGeneracion
            .Include(s => s.Voz)
            .Include(s => s.Idioma)
            .FirstOrDefaultAsync(s => s.IdSolicitudGeneracion == id && s.IdUsuario == usuario.IdUsuario);

        if (solicitud == null)
            return NotFound("Solicitud no encontrada.");

        return Ok(ToDto(solicitud));
    }

    // POST: api/generaciones/5/sintetizar
    [HttpPost("{id}/sintetizar")]
    public async Task<IActionResult> Sintetizar(
        int id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)]
        SintetizarSolicitudRequest? datos,
        CancellationToken cancellationToken)
    {
        var usuario = await _currentUser.ObtenerAsync(cancellationToken);

        var solicitud = await _context.SolicitudesGeneracion
            .Include(s => s.Idioma)
            .Include(s => s.Voz)
            .FirstOrDefaultAsync(s => s.IdSolicitudGeneracion == id && s.IdUsuario == usuario.IdUsuario,
                cancellationToken);

        if (solicitud == null)
            return NotFound("Solicitud no encontrada.");

        var texto = solicitud.Texto?.Trim() ?? string.Empty;
        if (texto.Length == 0)
            return BadRequest(new { detail = "La solicitud no tiene texto para sintetizar." });

        if (texto.Length > _ttsOptions.MaxTextLength)
            return BadRequest(new
            {
                detail = $"El texto excede el máximo de {_ttsOptions.MaxTextLength} caracteres."
            });

        var formato = (datos?.Formato ?? "wav").Trim().ToLowerInvariant();
        if (formato is not ("wav" or "mp3" or "ogg"))
            return BadRequest(new { detail = "Formato no válido. Use \"wav\", \"mp3\" u \"ogg\"." });

        var velocidad = datos?.Velocidad ?? 1.0;
        if (velocidad < 0.5 || velocidad > 2.0)
            return BadRequest(new { detail = "La velocidad debe estar entre 0.5 y 2.0." });

        solicitud.Estado = "Procesando";
        await _context.SaveChangesAsync(cancellationToken);

        var voz = ResolverVoz(datos?.Voz, solicitud.Idioma?.Codigo, solicitud.Voz?.Nombre);

        TtsAudio audio;
        try
        {
            audio = await _ttsService.SynthesizeAsync(
                texto, voz, velocidad, formato, cancellationToken);
        }
        catch (TtsServiceException ex)
        {
            solicitud.Estado = "Fallida";
            solicitud.FechaFinalizacion = DateTime.UtcNow;
            solicitud.MensajeError = ex.Message;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(ex, "No se pudo sintetizar la solicitud {SolicitudId}.", id);

            var estado = ex.StatusCode switch
            {
                null => StatusCodes.Status503ServiceUnavailable,
                HttpStatusCode.ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
                HttpStatusCode.BadRequest or
                HttpStatusCode.UnprocessableEntity or
                HttpStatusCode.RequestEntityTooLarge => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status502BadGateway
            };

            return StatusCode(estado, new
            {
                detail = "No se pudo generar el audio con el microservicio TTS.",
                tts = ex.Message
            });
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            solicitud.Estado = "Fallida";
            solicitud.FechaFinalizacion = DateTime.UtcNow;
            solicitud.MensajeError = "El microservicio TTS agotó el tiempo de espera.";
            await _context.SaveChangesAsync(cancellationToken);

            return StatusCode(StatusCodes.Status504GatewayTimeout, new
            {
                detail = "El microservicio TTS agotó el tiempo de espera."
            });
        }

        var carpeta = Path.IsPathRooted(_ttsOptions.StoragePath)
            ? _ttsOptions.StoragePath
            : Path.Combine(_environment.ContentRootPath, _ttsOptions.StoragePath);

        Directory.CreateDirectory(carpeta);

        var nombreArchivo = $"{Guid.NewGuid():N}.{audio.Extension}";
        var rutaCompleta = Path.Combine(carpeta, nombreArchivo);
        await System.IO.File.WriteAllBytesAsync(rutaCompleta, audio.Content, cancellationToken);

        var rutaRelativa = Path
            .GetRelativePath(_environment.ContentRootPath, rutaCompleta)
            .Replace('\\', '/');

        var registro = new Audio
        {
            DireccionFisica = rutaRelativa,
            NombreArchivo = nombreArchivo,
            Formato = audio.Extension,
            TamanoBytes = audio.Content.LongLength,
            FechaCreacion = DateTime.UtcNow,
            DuracionSegundos = audio.DurationSeconds,
            Estado = "Disponible",
            IdUsuario = solicitud.IdUsuario,
            IdVoz = solicitud.IdVoz,
            IdIdioma = solicitud.IdIdioma
        };

        _context.Audios.Add(registro);

        solicitud.Estado = "Completada";
        solicitud.FechaFinalizacion = DateTime.UtcNow;
        solicitud.MensajeError = null;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            solicitud.IdAudio = registro.IdAudio;
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            System.IO.File.Delete(rutaCompleta);
            throw;
        }

        return Ok(ToAudioDto(registro));
    }

    private string ResolverVoz(string? voz, string? codigoIdioma, string? nombreVoz)
    {
        if (!string.IsNullOrWhiteSpace(voz))
            return voz.Trim();

        if (!string.IsNullOrWhiteSpace(nombreVoz))
            return nombreVoz.Trim();

        return codigoIdioma?.ToLowerInvariant() switch
        {
            "es" or "spa" or "spanish" => _ttsOptions.DefaultSpanishVoice,
            _ => _ttsOptions.DefaultVoice
        };
    }

    private static SolicitudGeneracionResponseDto ToDto(SolicitudGeneracion s) => new()
    {
        IdSolicitudGeneracion = s.IdSolicitudGeneracion,
        Texto = s.Texto,
        Estado = s.Estado,
        FechaSolicitud = s.FechaSolicitud,
        FechaFinalizacion = s.FechaFinalizacion,
        MensajeError = s.MensajeError,
        IdVoz = s.IdVoz,
        NombreVoz = s.Voz?.Nombre,
        IdIdioma = s.IdIdioma,
        NombreIdioma = s.Idioma?.Nombre,
        IdAudio = s.IdAudio
    };

    private static AudioResponseDto ToAudioDto(Audio a) => new()
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
