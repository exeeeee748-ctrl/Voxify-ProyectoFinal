using System;
using backend_dotnet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace backend_dotnet.Data.configurations;

public class CuentaExternaConfiguration : IEntityTypeConfiguration<CuentaExterna>
{
    public void Configure(EntityTypeBuilder<CuentaExterna> builder)
    {
        builder.HasKey(c => c.IdCuentaExterna);

        builder.Property(c => c.Proveedor)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.IdUsuarioProveedor)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(c => c.CorreoProveedor)
            .HasMaxLength(255);

        builder.Property(c => c.AccessToken)
            .HasMaxLength(4000);

        builder.Property(c => c.RefreshToken)
            .HasMaxLength(4000);

        builder.HasIndex(c => new
        {
            c.Proveedor,
            c.IdUsuarioProveedor
        }).IsUnique();

        builder.HasOne(c => c.Usuario)
            .WithMany(u => u.CuentasExternas)
            .HasForeignKey(c => c.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
