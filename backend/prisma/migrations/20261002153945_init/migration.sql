-- CreateEnum
CREATE TYPE "Tecnologia" AS ENUM ('FILAMENTO', 'RESINA');

-- CreateEnum
CREATE TYPE "ModoEntrega" AS ENUM ('NOCTURNO', 'DIURNO', 'EXPRESS');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'ACEPTADA', 'EN_PROCESO', 'RECHAZADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "FormatoStl" AS ENUM ('BINARIO', 'ASCII');

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "tecnologia" "Tecnologia" NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "precioPorKg" DECIMAL(10,2) NOT NULL,
    "densidadGramosCm3" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionGeneral" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "precioKwh" DECIMAL(10,4) NOT NULL,
    "tarifaManoObraPorHora" DECIMAL(10,2) NOT NULL,
    "setupPorDefecto" DECIMAL(10,2) NOT NULL,
    "minutosManoObraPorDefecto" INTEGER NOT NULL DEFAULT 75,
    "multiplicadorPrecioBase" DECIMAL(5,2) NOT NULL,
    "porcentajeRangoInferior" DECIMAL(5,2) NOT NULL,
    "porcentajeRangoSuperior" DECIMAL(5,2) NOT NULL,
    "diasVencimiento" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGeneral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionMaquina" (
    "id" SERIAL NOT NULL,
    "tecnologia" "Tecnologia" NOT NULL,
    "nombreMaquina" TEXT,
    "consumoWatts" INTEGER NOT NULL,
    "vidaUtilHoras" INTEGER NOT NULL,
    "costoMaquina" DECIMAL(10,2) NOT NULL,
    "camaXMm" INTEGER NOT NULL,
    "camaYMm" INTEGER NOT NULL,
    "camaZMm" INTEGER NOT NULL,
    "porcentajeMerma" DECIMAL(5,2),
    "porcentajeFallos" DECIMAL(5,2),
    "costoPostProceso" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionMaquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloStl" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "formato" "FormatoStl" NOT NULL,
    "claveAlmacenamiento" TEXT NOT NULL,
    "cantidadTriangulos" INTEGER NOT NULL,
    "volumenCm3" DOUBLE PRECISION NOT NULL,
    "areaMm2" DOUBLE PRECISION NOT NULL,
    "dimensionXMm" DOUBLE PRECISION NOT NULL,
    "dimensionYMm" DOUBLE PRECISION NOT NULL,
    "dimensionZMm" DOUBLE PRECISION NOT NULL,
    "esMallaCerrada" BOOLEAN NOT NULL,

    CONSTRAINT "ModeloStl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "telefonoCliente" TEXT NOT NULL,
    "correoCliente" TEXT,
    "nombrePedido" TEXT,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "venceEl" TIMESTAMP(3) NOT NULL,
    "notaInterna" TEXT,
    "modoEntrega" "ModoEntrega" NOT NULL,
    "modoMultiplicador" DECIMAL(5,2) NOT NULL,
    "modoPlazoEntrega" TEXT NOT NULL,
    "precioKwh" DECIMAL(10,4) NOT NULL,
    "tarifaManoObraPorHora" DECIMAL(10,2) NOT NULL,
    "multiplicadorPrecioBase" DECIMAL(5,2) NOT NULL,
    "porcentajeRangoInferior" DECIMAL(5,2) NOT NULL,
    "porcentajeRangoSuperior" DECIMAL(5,2) NOT NULL,
    "parametrosMaquinas" JSONB NOT NULL,
    "precioTotal" INTEGER NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionStl" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "modeloStlId" INTEGER NOT NULL,
    "tecnologia" "Tecnologia" NOT NULL,
    "rellenoPorcentaje" INTEGER,
    "gramosPorUnidad" DOUBLE PRECISION NOT NULL,
    "horasPorUnidad" DOUBLE PRECISION NOT NULL,
    "minutosManoObraPorUnidad" DOUBLE PRECISION NOT NULL,
    "setupPorUnidad" DECIMAL(10,2) NOT NULL,
    "insumosExtraPorUnidad" DECIMAL(10,2) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "materialId" INTEGER NOT NULL,
    "materialNombre" TEXT NOT NULL,
    "materialMarca" TEXT,
    "materialPrecioPorKg" DECIMAL(10,2) NOT NULL,
    "gramosConMermaPorUnidad" DOUBLE PRECISION,
    "costoMaterial" DECIMAL(10,2) NOT NULL,
    "costoElectricidad" DECIMAL(10,2) NOT NULL,
    "costoDesgasteMaquina" DECIMAL(10,2) NOT NULL,
    "costoManoObra" DECIMAL(10,2) NOT NULL,
    "costoSetup" DECIMAL(10,2) NOT NULL,
    "costoInsumosExtra" DECIMAL(10,2) NOT NULL,
    "costoPostProceso" DECIMAL(10,2),
    "costoFallos" DECIMAL(10,2),
    "costoDirectoPorUnidad" DECIMAL(10,2) NOT NULL,
    "precioInicialPorUnidad" INTEGER NOT NULL,
    "precioMinimoPorUnidad" INTEGER NOT NULL,
    "precioMaximoPorUnidad" INTEGER NOT NULL,
    "precioFinalPorUnidad" INTEGER NOT NULL,
    "precioFinalTotal" INTEGER NOT NULL,

    CONSTRAINT "CotizacionStl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_tecnologia_activo_idx" ON "Material"("tecnologia", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionMaquina_tecnologia_key" ON "ConfiguracionMaquina"("tecnologia");

-- CreateIndex
CREATE UNIQUE INDEX "ModeloStl_hash_key" ON "ModeloStl"("hash");

-- CreateIndex
CREATE INDEX "Cotizacion_nombreCliente_idx" ON "Cotizacion"("nombreCliente");

-- CreateIndex
CREATE INDEX "Cotizacion_telefonoCliente_idx" ON "Cotizacion"("telefonoCliente");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");

-- CreateIndex
CREATE INDEX "Cotizacion_venceEl_idx" ON "Cotizacion"("venceEl");

-- CreateIndex
CREATE INDEX "Cotizacion_createdAt_idx" ON "Cotizacion"("createdAt");

-- CreateIndex
CREATE INDEX "CotizacionStl_cotizacionId_idx" ON "CotizacionStl"("cotizacionId");

-- CreateIndex
CREATE INDEX "CotizacionStl_modeloStlId_idx" ON "CotizacionStl"("modeloStlId");

-- CreateIndex
CREATE INDEX "CotizacionStl_materialId_idx" ON "CotizacionStl"("materialId");

-- AddForeignKey
ALTER TABLE "CotizacionStl" ADD CONSTRAINT "CotizacionStl_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionStl" ADD CONSTRAINT "CotizacionStl_modeloStlId_fkey" FOREIGN KEY ("modeloStlId") REFERENCES "ModeloStl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionStl" ADD CONSTRAINT "CotizacionStl_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
