namespace backend_dotnet.Services.OAuth;

public sealed class OAuthProviderDefinition
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required string Scheme { get; init; }

    public string? ClientId { get; init; }

    public string? ClientSecret { get; init; }

    public string RedirectUri { get; init; } = string.Empty;

    public string CallbackPath { get; init; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);

    public string LoginPath => $"/api/auth/login/{Id}";
}

public sealed class OAuthProviderSettings
{
    public OAuthProviderDefinition TikTok { get; init; } = new()
    {
        Id = "tiktok",
        Name = "TikTok",
        Scheme = "TikTok"
    };

    public OAuthProviderDefinition Microsoft { get; init; } = new()
    {
        Id = "microsoft",
        Name = "Microsoft",
        Scheme = "Microsoft"
    };

    public OAuthProviderDefinition Twitch { get; init; } = new()
    {
        Id = "twitch",
        Name = "Twitch",
        Scheme = "Twitch"
    };

    public string MicrosoftTenantId { get; init; } = "common";

    public string FrontendUrl { get; init; } = "http://localhost:3000";

    public bool DevLoginEnabled { get; init; }

    public IReadOnlyList<OAuthProviderDefinition> All => new[] { TikTok, Microsoft, Twitch };

    public OAuthProviderDefinition? Find(string provider) =>
        All.FirstOrDefault(item => string.Equals(item.Id, provider, StringComparison.OrdinalIgnoreCase));

    public static OAuthProviderSettings FromEnvironment(bool isDevelopment)
    {
        var backendUrl = Read("BACKEND_URL") ?? "http://localhost:5173";
        var frontendUrl = Read("FRONTEND_URL") ?? "http://localhost:3000";
        var devLoginRaw = Read("ALLOW_DEV_USER");
        var devLoginEnabled = devLoginRaw is null
            ? isDevelopment
            : bool.TryParse(devLoginRaw, out var enabled) && enabled;

        var tiktokRedirect = Read("TIKTOK_REDIRECT_URI")
            ?? $"{backendUrl.TrimEnd('/')}/auth/tiktok/callback";
        var microsoftRedirect = Read("MICROSOFT_REDIRECT_URI")
            ?? $"{backendUrl.TrimEnd('/')}/auth/microsoft/callback";
        var twitchRedirect = Read("TWITCH_REDIRECT_URI")
            ?? $"{backendUrl.TrimEnd('/')}/auth/twitch/callback";

        return new OAuthProviderSettings
        {
            FrontendUrl = frontendUrl.TrimEnd('/'),
            DevLoginEnabled = devLoginEnabled,
            MicrosoftTenantId = Read("MICROSOFT_TENANT_ID") ?? "common",
            TikTok = new OAuthProviderDefinition
            {
                Id = "tiktok",
                Name = "TikTok",
                Scheme = "TikTok",
                ClientId = Read("TIKTOK_CLIENT_KEY"),
                ClientSecret = Read("TIKTOK_CLIENT_SECRET"),
                RedirectUri = tiktokRedirect,
                CallbackPath = PathOf(tiktokRedirect, "/auth/tiktok/callback")
            },
            Microsoft = new OAuthProviderDefinition
            {
                Id = "microsoft",
                Name = "Microsoft",
                Scheme = "Microsoft",
                ClientId = Read("MICROSOFT_CLIENT_ID"),
                ClientSecret = Read("MICROSOFT_CLIENT_SECRET"),
                RedirectUri = microsoftRedirect,
                CallbackPath = PathOf(microsoftRedirect, "/auth/microsoft/callback")
            },
            Twitch = new OAuthProviderDefinition
            {
                Id = "twitch",
                Name = "Twitch",
                Scheme = "Twitch",
                ClientId = Read("TWITCH_CLIENT_ID"),
                ClientSecret = Read("TWITCH_CLIENT_SECRET"),
                RedirectUri = twitchRedirect,
                CallbackPath = PathOf(twitchRedirect, "/auth/twitch/callback")
            }
        };
    }

    private static string? Read(string key)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string PathOf(string redirectUri, string fallback)
    {
        if (Uri.TryCreate(redirectUri, UriKind.Absolute, out var uri) &&
            !string.IsNullOrWhiteSpace(uri.AbsolutePath))
        {
            return uri.AbsolutePath;
        }

        return fallback;
    }
}
