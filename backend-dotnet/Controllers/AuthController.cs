using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // --------------------------------------------------------------------------
    // OAuth / OIDC / SSO: DIFERIDO (especificación técnica, sección 1.1).
    // Los endpoints de inicio de sesión con proveedores externos quedan
    // deshabilitados (conservados como comentario) hasta una fase posterior.
    // --------------------------------------------------------------------------

    /*
    [HttpGet("login/twitch")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginTwitch()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/me"
        };

        return Challenge(properties, "Twitch");
    }

    [HttpGet("login/microsoft")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginMicrosoft()
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
    */

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            Autenticado = User.Identity?.IsAuthenticated,
            Nombre = User.Identity?.Name,
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
