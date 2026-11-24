using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class FavoritoIdiomaConfiguration
    : IEntityTypeConfiguration<FavoritoIdioma>
{
    public void Configure(EntityTypeBuilder<FavoritoIdioma> builder)
    {
        builder.HasKey(f => new
        {
            f.IdUsuario,
            f.IdIdioma
        });

        builder.HasOne(f => f.Usuario)
            .WithMany(u => u.IdiomasFavoritos)
            .HasForeignKey(f => f.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Idioma)
            .WithMany(i => i.Favoritos)
            .HasForeignKey(f => f.IdIdioma)
            .OnDelete(DeleteBehavior.Cascade);
    }
}