namespace backend_dotnet.Services;

public class TtsOptions
{
    public const string SectionName = "Tts";

    public string BaseUrl { get; set; } = "http://localhost:8000";

    public int MaxTextLength { get; set; } = 1500;

    public int TimeoutSeconds { get; set; } = 120;

    public string StoragePath { get; set; } = "Storage/audios";

    public string DefaultSpanishVoice { get; set; } = "SpanishNews";

    public string DefaultVoice { get; set; } = "default";
}
