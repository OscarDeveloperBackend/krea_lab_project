import "dotenv/config";
import { PrismaClient, Tecnologia } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando el sembrado de datos (Seeding)...");

  const materiales = [
    {
      id: 7,
      tecnologia: Tecnologia.FILAMENTO,
      nombre: "PLA",
      marca: "",
      precioPorKg: 65.0,
      densidadGramosCm3: 1.24,
      activo: true,
    },
    {
      id: 8,
      tecnologia: Tecnologia.FILAMENTO,
      nombre: "ABS",
      marca: "",
      precioPorKg: 65.0,
      densidadGramosCm3: 1.04,
      activo: true,
    },
    {
      id: 9,
      tecnologia: Tecnologia.FILAMENTO,
      nombre: "PETG",
      marca: "",
      precioPorKg: 65.0,
      densidadGramosCm3: 1.27,
      activo: true,
    },
    {
      id: 10,
      tecnologia: Tecnologia.FILAMENTO,
      nombre: "FLEX",
      marca: "",
      precioPorKg: 65.0,
      densidadGramosCm3: 1.21,
      activo: true,
    },
    {
      id: 11,
      tecnologia: Tecnologia.FILAMENTO,
      nombre: "ASA",
      marca: "",
      precioPorKg: 65.0,
      densidadGramosCm3: 1.07,
      activo: true,
    },
    {
      id: 12,
      tecnologia: Tecnologia.RESINA,
      nombre: "Resina ABS",
      marca: "",
      precioPorKg: 60.0,
      densidadGramosCm3: 1.1,
      activo: true,
    },
    {
      id: 13,
      tecnologia: Tecnologia.RESINA,
      nombre: "Resina ABS Transparente",
      marca: "",
      precioPorKg: 75.0,
      densidadGramosCm3: 1.1,
      activo: true,
    },
  ];

  for (const mat of materiales) {
    await prisma.material.upsert({
      where: { id: mat.id },
      update: {
        tecnologia: mat.tecnologia,
        nombre: mat.nombre,
        marca: mat.marca,
        precioPorKg: mat.precioPorKg,
        densidadGramosCm3: mat.densidadGramosCm3,
        activo: mat.activo,
      },
      create: mat,
    });
  }
  console.log('Tabla "Material" procesada.');

  // 2. Insertar datos en la tabla "ConfiguracionGeneral"
  const configGeneral = {
    id: 1,
    precioKwh: 0.75,
    tarifaManoObraPorHora: 6.25,
    setupPorDefecto: 10.0,
    minutosManoObraPorDefecto: 75,
    multiplicadorPrecioBase: 1.8,
    porcentajeRangoInferior: 0.0,
    porcentajeRangoSuperior: 20.0,
    diasVencimiento: 7,
  };

  await prisma.configuracionGeneral.upsert({
    where: { id: configGeneral.id },
    update: configGeneral,
    create: configGeneral,
  });
  console.log('Tabla "ConfiguracionGeneral" procesada.');

  // 3. Insertar datos en la tabla "ConfiguracionMaquina" (Controlado por campo @unique tecnologia)
  const configMaquinas = [
    {
      tecnologia: Tecnologia.FILAMENTO,
      nombreMaquina: "Bambu Lab A1",
      consumoWatts: 100,
      vidaUtilHoras: 8000,
      costoMaquina: 2400.0,
      camaXMm: 256,
      camaYMm: 256,
      camaZMm: 256,
      porcentajeMerma: null,
      porcentajeFallos: null,
      costoPostProceso: null,
    },
    {
      tecnologia: Tecnologia.RESINA,
      nombreMaquina: "",
      consumoWatts: 80,
      vidaUtilHoras: 4000,
      costoMaquina: 1800.0,
      camaXMm: 256,
      camaYMm: 256,
      camaZMm: 256,
      porcentajeMerma: 20.0,
      porcentajeFallos: 15.0,
      costoPostProceso: 5.0,
    },
  ];

  for (const maq of configMaquinas) {
    await prisma.configuracionMaquina.upsert({
      where: { tecnologia: maq.tecnologia },
      update: maq,
      create: maq,
    });
  }
  console.log('Tabla "ConfiguracionMaquina" procesada.');

  console.log("¡Sembrado completado con éxito!");
}

main()
  .catch((e) => {
    console.error("Error ejecutando el seed:", e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
