using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpGet("login/twitch")]
    [AllowAnonymous]
    public IActionResult LoginTwitch()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/me"
        };

        return Challenge(properties, "Twitch");
    }

    [HttpGet("login/microsoft")]
    [AllowAnonymous]
    public IActionResult LoginMicrosoft()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/me"
        };

        return Challenge(properties, "Microsoft");
    }

    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login()
    {
        return Redirect("/api/auth/login/twitch");
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var provider = User.Identities
            .Select(identity => identity.AuthenticationType)
            .FirstOrDefault(type => type is "Twitch" or "Microsoft");

        return Ok(new
        {
            Autenticado = User.Identity?.IsAuthenticated,
            Nombre = User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("preferred_username")?.Value,
            Proveedor = provider,
            Identificador = User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier
            )?.Value
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        return Ok(new { mensaje = "Sesión cerrada correctamente" });
    }
}
