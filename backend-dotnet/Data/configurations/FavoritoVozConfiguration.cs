using System;
using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend_dotnet.Data.configurations;

public class FavoritoVozConfiguration
    : IEntityTypeConfiguration<FavoritoVoz>
{
    public void Configure(EntityTypeBuilder<FavoritoVoz> builder)
    {
        builder.HasKey(f => new
        {
            f.IdUsuario,
            f.IdVoz
        });

        builder.HasOne(f => f.Usuario)
            .WithMany(u => u.VocesFavoritas)
            .HasForeignKey(f => f.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Voz)
            .WithMany(v => v.Favoritos)
            .HasForeignKey(f => f.IdVoz)
            .OnDelete(DeleteBehavior.Cascade);
    }
}