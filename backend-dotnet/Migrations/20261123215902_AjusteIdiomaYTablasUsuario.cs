using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class AjusteIdiomaYTablasUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Idiomas",
                newName: "IdIdioma");

            migrationBuilder.AlterColumn<string>(
                name: "Nombre",
                table: "Idiomas",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Codigo",
                table: "Idiomas",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Correo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.IdUsuario);
                });

            migrationBuilder.CreateTable(
                name: "Voces",
                columns: table => new
                {
                    IdVoz = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Voces", x => x.IdVoz);
                });

            migrationBuilder.CreateTable(
                name: "CuentasExternas",
                columns: table => new
                {
                    IdCuentaExterna = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Proveedor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IdUsuarioProveedor = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IdUsuario = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentasExternas", x => x.IdCuentaExterna);
                    table.ForeignKey(
                        name: "FK_CuentasExternas_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FavoritosIdioma",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "integer", nullable: false),
                    IdIdioma = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoritosIdioma", x => new { x.IdUsuario, x.IdIdioma });
                    table.ForeignKey(
                        name: "FK_FavoritosIdioma_Idiomas_IdIdioma",
                        column: x => x.IdIdioma,
                        principalTable: "Idiomas",
                        principalColumn: "IdIdioma",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoritosIdioma_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracionesUsuario",
                columns: table => new
                {
                    IdConfiguracion = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUsuario = table.Column<int>(type: "integer", nullable: false),
                    IdUltimaVoz = table.Column<int>(type: "integer", nullable: true),
                    IdUltimoIdioma = table.Column<int>(type: "integer", nullable: true),
                    Tema = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesUsuario", x => x.IdConfiguracion);
                    table.ForeignKey(
                        name: "FK_ConfiguracionesUsuario_Idiomas_IdUltimoIdioma",
                        column: x => x.IdUltimoIdioma,
                        principalTable: "Idiomas",
                        principalColumn: "IdIdioma",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConfiguracionesUsuario_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConfiguracionesUsuario_Voces_IdUltimaVoz",
                        column: x => x.IdUltimaVoz,
                        principalTable: "Voces",
                        principalColumn: "IdVoz",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FavoritosVoz",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "integer", nullable: false),
                    IdVoz = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoritosVoz", x => new { x.IdUsuario, x.IdVoz });
                    table.ForeignKey(
                        name: "FK_FavoritosVoz_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoritosVoz_Voces_IdVoz",
                        column: x => x.IdVoz,
                        principalTable: "Voces",
                        principalColumn: "IdVoz",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Idiomas_Codigo",
                table: "Idiomas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesUsuario_IdUltimaVoz",
                table: "ConfiguracionesUsuario",
                column: "IdUltimaVoz");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesUsuario_IdUltimoIdioma",
                table: "ConfiguracionesUsuario",
                column: "IdUltimoIdioma");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionesUsuario_IdUsuario",
                table: "ConfiguracionesUsuario",
                column: "IdUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasExternas_IdUsuario",
                table: "CuentasExternas",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasExternas_Proveedor_IdUsuarioProveedor",
                table: "CuentasExternas",
                columns: new[] { "Proveedor", "IdUsuarioProveedor" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosIdioma_IdIdioma",
                table: "FavoritosIdioma",
                column: "IdIdioma");

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosVoz_IdVoz",
                table: "FavoritosVoz",
                column: "IdVoz");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Correo",
                table: "Usuarios",
                column: "Correo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracionesUsuario");

            migrationBuilder.DropTable(
                name: "CuentasExternas");

            migrationBuilder.DropTable(
                name: "FavoritosIdioma");

            migrationBuilder.DropTable(
                name: "FavoritosVoz");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Voces");

            migrationBuilder.DropIndex(
                name: "IX_Idiomas_Codigo",
                table: "Idiomas");

            migrationBuilder.RenameColumn(
                name: "IdIdioma",
                table: "Idiomas",
                newName: "Id");

            migrationBuilder.AlterColumn<string>(
                name: "Nombre",
                table: "Idiomas",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Codigo",
                table: "Idiomas",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);
        }
    }
}
