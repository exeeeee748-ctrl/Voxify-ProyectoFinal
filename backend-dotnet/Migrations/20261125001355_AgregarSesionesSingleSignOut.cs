using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSesionesSingleSignOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SesionesUsuario",
                columns: table => new
                {
                    IdSesion = table.Column<Guid>(type: "uuid", nullable: false),
                    IdUsuario = table.Column<int>(type: "integer", nullable: false),
                    Proveedor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaExpiracion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaRevocacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Activa = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    MotivoRevocacion = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    IpOrigen = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SesionesUsuario", x => x.IdSesion);
                    table.ForeignKey(
                        name: "FK_SesionesUsuario_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SesionesUsuario_IdUsuario_Activa",
                table: "SesionesUsuario",
                columns: new[] { "IdUsuario", "Activa" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SesionesUsuario");
        }
    }
}
