using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/me"
        };

        return Challenge(properties, "Twitch");
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            Autenticado = User.Identity?.IsAuthenticated,
            Nombre = User.Identity?.Name,
            Proveedor = "Twitch",
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

