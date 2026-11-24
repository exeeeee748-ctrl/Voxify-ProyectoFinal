using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class AlinearModeloDeDatos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Audios_SolicitudesGeneracion_SolicitudGeneracionId",
                table: "Audios");

            migrationBuilder.DropForeignKey(
                name: "FK_MuestrasVoz_SolicitudesClonacion_IdSolicitudClonacion",
                table: "MuestrasVoz");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesGeneracion_Idiomas_IdiomaId",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VocesClonadas",
                table: "VocesClonadas");

            migrationBuilder.DropIndex(
                name: "IX_VocesClonadas_IdVoz",
                table: "VocesClonadas");

            migrationBuilder.DropIndex(
                name: "IX_MuestrasVoz_IdSolicitudClonacion",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "Activa",
                table: "VocesClonadas");

            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "VocesClonadas");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "Activa",
                table: "SolicitudesClonacion");

            migrationBuilder.DropColumn(
                name: "Activa",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "Archivo",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "RutaArchivo",
                table: "Audios");

            migrationBuilder.RenameColumn(
                name: "UsuarioId",
                table: "VocesClonadas",
                newName: "IdUsuario");

            migrationBuilder.RenameColumn(
                name: "IdVozClonada",
                table: "VocesClonadas",
                newName: "Estado");

            migrationBuilder.RenameColumn(
                name: "IdiomaId",
                table: "SolicitudesGeneracion",
                newName: "IdVoz");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "SolicitudesGeneracion",
                newName: "IdSolicitudGeneracion");

            migrationBuilder.RenameIndex(
                name: "IX_SolicitudesGeneracion_IdiomaId",
                table: "SolicitudesGeneracion",
                newName: "IX_SolicitudesGeneracion_IdVoz");

            migrationBuilder.RenameColumn(
                name: "UsuarioId",
                table: "SolicitudesClonacion",
                newName: "IdUsuario");

            migrationBuilder.RenameColumn(
                name: "FechaRegistro",
                table: "MuestrasVoz",
                newName: "FechaSubida");

            migrationBuilder.RenameColumn(
                name: "IdMuestraVoz",
                table: "MuestrasVoz",
                newName: "IdMuestra");

            migrationBuilder.RenameColumn(
                name: "SolicitudGeneracionId",
                table: "Audios",
                newName: "IdVoz");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Audios",
                newName: "IdAudio");

            migrationBuilder.RenameIndex(
                name: "IX_Audios_SolicitudGeneracionId",
                table: "Audios",
                newName: "IX_Audios_IdVoz");

            migrationBuilder.AlterColumn<int>(
                name: "IdVoz",
                table: "VocesClonadas",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Archivo",
                table: "VocesClonadas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Estado",
                table: "VocesClonadas",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<int>(
                name: "IdSolicitudClonacion",
                table: "VocesClonadas",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "SolicitudesGeneracion",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFinalizacion",
                table: "SolicitudesGeneracion",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IdAudio",
                table: "SolicitudesGeneracion",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IdIdioma",
                table: "SolicitudesGeneracion",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IdUsuario",
                table: "SolicitudesGeneracion",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MensajeError",
                table: "SolicitudesGeneracion",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "SolicitudesClonacion",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFinalizacion",
                table: "SolicitudesClonacion",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MensajeError",
                table: "SolicitudesClonacion",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreVoz",
                table: "SolicitudesClonacion",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DireccionFisica",
                table: "MuestrasVoz",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "MuestrasVoz",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "MuestrasVoz",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "NombreArchivo",
                table: "Audios",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "DireccionFisica",
                table: "Audios",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "DuracionSegundos",
                table: "Audios",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Audios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Formato",
                table: "Audios",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "IdIdioma",
                table: "Audios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IdUsuario",
                table: "Audios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "TamanoBytes",
                table: "Audios",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_VocesClonadas",
                table: "VocesClonadas",
                column: "IdVoz");

            migrationBuilder.CreateTable(
                name: "VozIdioma",
                columns: table => new
                {
                    IdVoz = table.Column<int>(type: "integer", nullable: false),
                    IdIdioma = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VozIdioma", x => new { x.IdVoz, x.IdIdioma });
                    table.ForeignKey(
                        name: "FK_VozIdioma_Idiomas_IdIdioma",
                        column: x => x.IdIdioma,
                        principalTable: "Idiomas",
                        principalColumn: "IdIdioma",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VozIdioma_Voces_IdVoz",
                        column: x => x.IdVoz,
                        principalTable: "Voces",
                        principalColumn: "IdVoz",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VocesClonadas_IdSolicitudClonacion",
                table: "VocesClonadas",
                column: "IdSolicitudClonacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VocesClonadas_IdUsuario",
                table: "VocesClonadas",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesGeneracion_IdAudio",
                table: "SolicitudesGeneracion",
                column: "IdAudio",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesGeneracion_IdIdioma",
                table: "SolicitudesGeneracion",
                column: "IdIdioma");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesGeneracion_IdUsuario",
                table: "SolicitudesGeneracion",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesClonacion_IdUsuario",
                table: "SolicitudesClonacion",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_MuestrasVoz_IdSolicitudClonacion",
                table: "MuestrasVoz",
                column: "IdSolicitudClonacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Audios_IdIdioma",
                table: "Audios",
                column: "IdIdioma");

            migrationBuilder.CreateIndex(
                name: "IX_Audios_IdUsuario",
                table: "Audios",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_VozIdioma_IdIdioma",
                table: "VozIdioma",
                column: "IdIdioma");

            migrationBuilder.AddForeignKey(
                name: "FK_Audios_Idiomas_IdIdioma",
                table: "Audios",
                column: "IdIdioma",
                principalTable: "Idiomas",
                principalColumn: "IdIdioma",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Audios_Usuarios_IdUsuario",
                table: "Audios",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "IdUsuario",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Audios_Voces_IdVoz",
                table: "Audios",
                column: "IdVoz",
                principalTable: "Voces",
                principalColumn: "IdVoz",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MuestrasVoz_SolicitudesClonacion_IdSolicitudClonacion",
                table: "MuestrasVoz",
                column: "IdSolicitudClonacion",
                principalTable: "SolicitudesClonacion",
                principalColumn: "IdSolicitudClonacion",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesClonacion_Usuarios_IdUsuario",
                table: "SolicitudesClonacion",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "IdUsuario",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesGeneracion_Audios_IdAudio",
                table: "SolicitudesGeneracion",
                column: "IdAudio",
                principalTable: "Audios",
                principalColumn: "IdAudio",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesGeneracion_Idiomas_IdIdioma",
                table: "SolicitudesGeneracion",
                column: "IdIdioma",
                principalTable: "Idiomas",
                principalColumn: "IdIdioma",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesGeneracion_Usuarios_IdUsuario",
                table: "SolicitudesGeneracion",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "IdUsuario",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesGeneracion_Voces_IdVoz",
                table: "SolicitudesGeneracion",
                column: "IdVoz",
                principalTable: "Voces",
                principalColumn: "IdVoz",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_VocesClonadas_SolicitudesClonacion_IdSolicitudClonacion",
                table: "VocesClonadas",
                column: "IdSolicitudClonacion",
                principalTable: "SolicitudesClonacion",
                principalColumn: "IdSolicitudClonacion",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VocesClonadas_Usuarios_IdUsuario",
                table: "VocesClonadas",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "IdUsuario",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Audios_Idiomas_IdIdioma",
                table: "Audios");

            migrationBuilder.DropForeignKey(
                name: "FK_Audios_Usuarios_IdUsuario",
                table: "Audios");

            migrationBuilder.DropForeignKey(
                name: "FK_Audios_Voces_IdVoz",
                table: "Audios");

            migrationBuilder.DropForeignKey(
                name: "FK_MuestrasVoz_SolicitudesClonacion_IdSolicitudClonacion",
                table: "MuestrasVoz");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesClonacion_Usuarios_IdUsuario",
                table: "SolicitudesClonacion");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesGeneracion_Audios_IdAudio",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesGeneracion_Idiomas_IdIdioma",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesGeneracion_Usuarios_IdUsuario",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesGeneracion_Voces_IdVoz",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropForeignKey(
                name: "FK_VocesClonadas_SolicitudesClonacion_IdSolicitudClonacion",
                table: "VocesClonadas");

            migrationBuilder.DropForeignKey(
                name: "FK_VocesClonadas_Usuarios_IdUsuario",
                table: "VocesClonadas");

            migrationBuilder.DropTable(
                name: "VozIdioma");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VocesClonadas",
                table: "VocesClonadas");

            migrationBuilder.DropIndex(
                name: "IX_VocesClonadas_IdSolicitudClonacion",
                table: "VocesClonadas");

            migrationBuilder.DropIndex(
                name: "IX_VocesClonadas_IdUsuario",
                table: "VocesClonadas");

            migrationBuilder.DropIndex(
                name: "IX_SolicitudesGeneracion_IdAudio",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropIndex(
                name: "IX_SolicitudesGeneracion_IdIdioma",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropIndex(
                name: "IX_SolicitudesGeneracion_IdUsuario",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropIndex(
                name: "IX_SolicitudesClonacion_IdUsuario",
                table: "SolicitudesClonacion");

            migrationBuilder.DropIndex(
                name: "IX_MuestrasVoz_IdSolicitudClonacion",
                table: "MuestrasVoz");

            migrationBuilder.DropIndex(
                name: "IX_Audios_IdIdioma",
                table: "Audios");

            migrationBuilder.DropIndex(
                name: "IX_Audios_IdUsuario",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "IdSolicitudClonacion",
                table: "VocesClonadas");

            migrationBuilder.DropColumn(
                name: "FechaFinalizacion",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "IdAudio",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "IdIdioma",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "IdUsuario",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "MensajeError",
                table: "SolicitudesGeneracion");

            migrationBuilder.DropColumn(
                name: "FechaFinalizacion",
                table: "SolicitudesClonacion");

            migrationBuilder.DropColumn(
                name: "MensajeError",
                table: "SolicitudesClonacion");

            migrationBuilder.DropColumn(
                name: "NombreVoz",
                table: "SolicitudesClonacion");

            migrationBuilder.DropColumn(
                name: "DireccionFisica",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "MuestrasVoz");

            migrationBuilder.DropColumn(
                name: "DireccionFisica",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "DuracionSegundos",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "Formato",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "IdIdioma",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "IdUsuario",
                table: "Audios");

            migrationBuilder.DropColumn(
                name: "TamanoBytes",
                table: "Audios");

            migrationBuilder.RenameColumn(
                name: "IdUsuario",
                table: "VocesClonadas",
                newName: "UsuarioId");

            migrationBuilder.RenameColumn(
                name: "Estado",
                table: "VocesClonadas",
                newName: "IdVozClonada");

            migrationBuilder.RenameColumn(
                name: "IdVoz",
                table: "SolicitudesGeneracion",
                newName: "IdiomaId");

            migrationBuilder.RenameColumn(
                name: "IdSolicitudGeneracion",
                table: "SolicitudesGeneracion",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_SolicitudesGeneracion_IdVoz",
                table: "SolicitudesGeneracion",
                newName: "IX_SolicitudesGeneracion_IdiomaId");

            migrationBuilder.RenameColumn(
                name: "IdUsuario",
                table: "SolicitudesClonacion",
                newName: "UsuarioId");

            migrationBuilder.RenameColumn(
                name: "FechaSubida",
                table: "MuestrasVoz",
                newName: "FechaRegistro");

            migrationBuilder.RenameColumn(
                name: "IdMuestra",
                table: "MuestrasVoz",
                newName: "IdMuestraVoz");

            migrationBuilder.RenameColumn(
                name: "IdVoz",
                table: "Audios",
                newName: "SolicitudGeneracionId");

            migrationBuilder.RenameColumn(
                name: "IdAudio",
                table: "Audios",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_Audios_IdVoz",
                table: "Audios",
                newName: "IX_Audios_SolicitudGeneracionId");

            migrationBuilder.AlterColumn<string>(
                name: "Archivo",
                table: "VocesClonadas",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "IdVoz",
                table: "VocesClonadas",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "IdVozClonada",
                table: "VocesClonadas",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<bool>(
                name: "Activa",
                table: "VocesClonadas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "VocesClonadas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "SolicitudesGeneracion",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "SolicitudesGeneracion",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "SolicitudesClonacion",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<bool>(
                name: "Activa",
                table: "SolicitudesClonacion",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Activa",
                table: "MuestrasVoz",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Archivo",
                table: "MuestrasVoz",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "NombreArchivo",
                table: "Audios",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "Audios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RutaArchivo",
                table: "Audios",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VocesClonadas",
                table: "VocesClonadas",
                column: "IdVozClonada");

            migrationBuilder.CreateIndex(
                name: "IX_VocesClonadas_IdVoz",
                table: "VocesClonadas",
                column: "IdVoz");

            migrationBuilder.CreateIndex(
                name: "IX_MuestrasVoz_IdSolicitudClonacion",
                table: "MuestrasVoz",
                column: "IdSolicitudClonacion");

            migrationBuilder.AddForeignKey(
                name: "FK_Audios_SolicitudesGeneracion_SolicitudGeneracionId",
                table: "Audios",
                column: "SolicitudGeneracionId",
                principalTable: "SolicitudesGeneracion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MuestrasVoz_SolicitudesClonacion_IdSolicitudClonacion",
                table: "MuestrasVoz",
                column: "IdSolicitudClonacion",
                principalTable: "SolicitudesClonacion",
                principalColumn: "IdSolicitudClonacion",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesGeneracion_Idiomas_IdiomaId",
                table: "SolicitudesGeneracion",
                column: "IdiomaId",
                principalTable: "Idiomas",
                principalColumn: "IdIdioma",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
