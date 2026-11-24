using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend_dotnet.Services;

public interface ITtsService
{
    Task<TtsAudio> SynthesizeAsync(
        string text,
        string voice,
        double speed,
        string audioFormat,
        CancellationToken cancellationToken = default);
}

public sealed record TtsAudio(
    byte[] Content,
    string ContentType,
    string Extension,
    int? SampleRate,
    double? DurationSeconds);

public sealed class TtsServiceException : Exception
{
    public HttpStatusCode? StatusCode { get; }

    public TtsServiceException(
        string message,
        HttpStatusCode? statusCode = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }
}

public sealed class TtsService : ITtsService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly ILogger<TtsService> _logger;

    public TtsService(HttpClient httpClient, ILogger<TtsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<TtsAudio> SynthesizeAsync(
        string text,
        string voice,
        double speed,
        string audioFormat,
        CancellationToken cancellationToken = default)
    {
        var payload = new SynthesizePayload
        {
            Text = text,
            Voice = voice,
            Speed = speed,
            AudioFormat = audioFormat
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsJsonAsync(
                "tts/generate",
                payload,
                JsonOptions,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new TtsServiceException(
                "No se pudo conectar con el microservicio TTS.",
                statusCode: null,
                innerException: ex);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var detalle = await LeerDetalleAsync(response, cancellationToken);

                _logger.LogWarning(
                    "El microservicio TTS respondió {StatusCode}: {Detalle}",
                    (int)response.StatusCode,
                    detalle);

                throw new TtsServiceException(
                    detalle,
                    response.StatusCode);
            }

            var contenido = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            if (contenido.Length == 0)
            {
                throw new TtsServiceException(
                    "El microservicio TTS devolvió un audio vacío.",
                    response.StatusCode);
            }

            var contentType = response.Content.Headers.ContentType?.MediaType
                ?? ObtenerContentType(audioFormat);

            var sampleRate = LeerSampleRate(response);
            var duracionSegundos = LeerDuracionSegundos(response);
            var extension = LeerExtension(response, audioFormat);

            return new TtsAudio(
                contenido,
                contentType,
                extension,
                sampleRate,
                duracionSegundos);
        }
    }

    private static async Task<string> LeerDetalleAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        string cuerpo;
        try
        {
            cuerpo = await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (Exception)
        {
            return $"El microservicio TTS respondió {(int)response.StatusCode}.";
        }

        if (string.IsNullOrWhiteSpace(cuerpo))
        {
            return $"El microservicio TTS respondió {(int)response.StatusCode}.";
        }

        try
        {
            using var document = JsonDocument.Parse(cuerpo);
            if (document.RootElement.ValueKind == JsonValueKind.Object &&
                document.RootElement.TryGetProperty("detail", out var detail))
            {
                return detail.ValueKind == JsonValueKind.String
                    ? detail.GetString() ?? cuerpo
                    : detail.ToString();
            }
        }
        catch (JsonException)
        {
            // El cuerpo no es JSON; se devuelve tal cual.
        }

        return cuerpo.Length > 500 ? cuerpo[..500] : cuerpo;
    }

    private static int? LeerSampleRate(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues("X-Sample-Rate", out var values) &&
            int.TryParse(values.FirstOrDefault(), out var sampleRate))
        {
            return sampleRate;
        }

        return null;
    }

    private static double? LeerDuracionSegundos(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues("X-Duration-Seconds", out var values) &&
            double.TryParse(
                values.FirstOrDefault(),
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture,
                out var duration))
        {
            return duration;
        }

        return null;
    }

    private static string LeerExtension(HttpResponseMessage response, string audioFormat)
    {
        if (response.Headers.TryGetValues("X-Audio-Format", out var values))
        {
            var extension = values.FirstOrDefault()?.Trim().ToLowerInvariant();
            if (extension is "wav" or "mp3" or "ogg")
                return extension;
        }

        return ObtenerExtension(audioFormat);
    }

    private static string ObtenerExtension(string audioFormat) =>
        audioFormat.ToLowerInvariant() switch
        {
            "mp3" => "mp3",
            "ogg" => "ogg",
            _ => "wav"
        };

    private static string ObtenerContentType(string audioFormat) =>
        audioFormat.ToLowerInvariant() switch
        {
            "mp3" => "audio/mpeg",
            "ogg" => "audio/ogg",
            _ => "audio/wav"
        };

    private sealed class SynthesizePayload
    {
        [JsonPropertyName("text")]
        public string Text { get; init; } = string.Empty;

        [JsonPropertyName("voice")]
        public string Voice { get; init; } = string.Empty;

        [JsonPropertyName("speed")]
        public double Speed { get; init; } = 1.0;

        [JsonPropertyName("audio_format")]
        public string AudioFormat { get; init; } = "wav";
    }
}
