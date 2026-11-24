using System;
using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Voxify.API.Data.Configurations;

public class ConfiguracionUsuarioConfiguration
    : IEntityTypeConfiguration<ConfiguracionUsuario>
{
    public void Configure(EntityTypeBuilder<ConfiguracionUsuario> builder)
    {
        builder.HasKey(c => c.IdConfiguracion);

        builder.HasIndex(c => c.IdUsuario)
            .IsUnique();

        builder.Property(c => c.Tema)
            .HasMaxLength(20);

        builder.HasOne(c => c.Usuario)
            .WithOne(u => u.Configuracion)
            .HasForeignKey<ConfiguracionUsuario>(c => c.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.UltimaVoz)
            .WithMany(v => v.Configuraciones)
            .HasForeignKey(c => c.IdUltimaVoz)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.UltimoIdioma)
            .WithMany(i => i.Configuraciones)
            .HasForeignKey(c => c.IdUltimoIdioma)
            .OnDelete(DeleteBehavior.SetNull);
            }
}