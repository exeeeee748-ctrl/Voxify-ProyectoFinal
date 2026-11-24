using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend_dotnet.Security.TikTok;

public sealed class TikTokOptions : OAuthOptions
{
    public TikTokOptions()
    {
        CallbackPath = new PathString("/auth/tiktok/callback");
        AuthorizationEndpoint = "https://www.tiktok.com/v2/auth/authorize/";
        TokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";
        UserInformationEndpoint =
            "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name";
        Scope.Add("user.info.basic");
        UsePkce = true;
        SaveTokens = true;
    }
}

public sealed class TikTokAuthenticationHandler : OAuthHandler<TikTokOptions>
{
    private const string CodeVerifierKey = ".code_verifier";

    public TikTokAuthenticationHandler(
        IOptionsMonitor<TikTokOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override string BuildChallengeUrl(
        AuthenticationProperties properties,
        string redirectUri)
    {
        var parameters = new Dictionary<string, string?>
        {
            ["client_key"] = Options.ClientId,
            ["scope"] = string.Join(",", Options.Scope),
            ["response_type"] = "code",
            ["redirect_uri"] = redirectUri
        };

        if (Options.UsePkce)
        {
            var codeVerifier = Microsoft.AspNetCore.WebUtilities.Base64UrlTextEncoder.Encode(
                RandomNumberGenerator.GetBytes(32));

            properties.Items[CodeVerifierKey] = codeVerifier;

            var challenge = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
            // TikTok Login Kit v2 exige code_challenge en hexadecimal minúsculas (no Base64URL)
            parameters["code_challenge"] = Convert.ToHexString(challenge).ToLowerInvariant();
            parameters["code_challenge_method"] = "S256";
        }

        parameters["state"] = Options.StateDataFormat.Protect(properties);

        return QueryHelpers.AddQueryString(Options.AuthorizationEndpoint, parameters);
    }

    protected override async Task<OAuthTokenResponse> ExchangeCodeAsync(
        OAuthCodeExchangeContext context)
    {
        var parameters = new Dictionary<string, string?>
        {
            ["client_key"] = Options.ClientId,
            ["client_secret"] = Options.ClientSecret,
            ["code"] = context.Code,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = context.RedirectUri
        };

        if (context.Properties.Items.TryGetValue(CodeVerifierKey, out var verifier) &&
            !string.IsNullOrWhiteSpace(verifier))
        {
            parameters["code_verifier"] = verifier;
        }

        var form = parameters
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .Select(item => new KeyValuePair<string, string>(item.Key, item.Value!));

        using var request = new HttpRequestMessage(HttpMethod.Post, Options.TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(form)
        };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await Backchannel.SendAsync(
            request,
            Context.RequestAborted);

        var body = await response.Content.ReadAsStringAsync(Context.RequestAborted);

        if (!response.IsSuccessStatusCode)
        {
            Logger.LogError(
                "TikTok rechazó el intercambio de código ({StatusCode}): {Body}",
                (int)response.StatusCode,
                body);
            return OAuthTokenResponse.Failed(
                new HttpRequestException("TikTok rechazó el intercambio de código."));
        }

        var payload = JsonDocument.Parse(body);
        var error = LeerError(payload.RootElement);
        if (!string.IsNullOrWhiteSpace(error))
        {
            var desc = ObtenerTexto(payload.RootElement, "error_description");
            payload.Dispose();
            Logger.LogError("TikTok devolvió un error al solicitar tokens: {Error} ({Description})", error, desc);
            return OAuthTokenResponse.Failed(
                new HttpRequestException("TikTok devolvió un error al solicitar tokens."));
        }

        return OAuthTokenResponse.Success(payload);
    }

    protected override async Task<AuthenticationTicket> CreateTicketAsync(
        ClaimsIdentity identity,
        AuthenticationProperties properties,
        OAuthTokenResponse tokens)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            Options.UserInformationEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            tokens.AccessToken ?? string.Empty);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await Backchannel.SendAsync(
            request,
            Context.RequestAborted);
        var body = await response.Content.ReadAsStringAsync(Context.RequestAborted);

        if (!response.IsSuccessStatusCode)
        {
            Logger.LogError(
                "TikTok rechazó la consulta del perfil ({StatusCode}): {Body}",
                (int)response.StatusCode,
                body);
            throw new HttpRequestException("TikTok rechazó la consulta del perfil.");
        }

        using var payload = JsonDocument.Parse(body);
        var error = LeerError(payload.RootElement);
        if (!string.IsNullOrWhiteSpace(error))
            throw new HttpRequestException("TikTok devolvió un error al consultar el perfil.");

        if (!payload.RootElement.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("user", out var user))
        {
            throw new HttpRequestException("TikTok no devolvió el perfil del usuario.");
        }

        var openId = ObtenerTexto(user, "open_id");
        if (string.IsNullOrWhiteSpace(openId))
            throw new HttpRequestException("TikTok no devolvió el open_id del usuario.");

        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, openId));
        identity.AddClaim(new Claim(VoxifyClaims.Proveedor, "tiktok"));

        var displayName = ObtenerTexto(user, "display_name");
        if (!string.IsNullOrWhiteSpace(displayName))
            identity.AddClaim(new Claim(ClaimTypes.Name, displayName));

        var avatarUrl = ObtenerTexto(user, "avatar_url");
        if (!string.IsNullOrWhiteSpace(avatarUrl))
            identity.AddClaim(new Claim("avatar_url", avatarUrl));

        var creatingContext = new OAuthCreatingTicketContext(
            new ClaimsPrincipal(identity),
            properties,
            Context,
            Scheme,
            Options,
            Backchannel,
            tokens,
            user);

        await Events.CreatingTicket(creatingContext);

        return new AuthenticationTicket(
            creatingContext.Principal!,
            creatingContext.Properties,
            Scheme.Name);
    }

    private static string? LeerError(JsonElement root)
    {
        if (!root.TryGetProperty("error", out var error))
            return null;

        if (error.ValueKind == JsonValueKind.String)
        {
            var value = error.GetString();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        if (error.ValueKind == JsonValueKind.Object &&
            error.TryGetProperty("code", out var code))
        {
            var value = code.GetString();
            return string.IsNullOrWhiteSpace(value) || value == "ok" ? null : value;
        }

        return null;
    }

    private static string? ObtenerTexto(JsonElement element, string property)
    {
        return element.TryGetProperty(property, out var value) &&
               value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }
}

public static class TikTokAuthenticationExtensions
{
    public static AuthenticationBuilder AddTikTok(
        this AuthenticationBuilder builder,
        Action<TikTokOptions> configureOptions)
    {
        return builder.AddOAuth<TikTokOptions, TikTokAuthenticationHandler>(
            "TikTok",
            "TikTok",
            configureOptions);
    }
}
