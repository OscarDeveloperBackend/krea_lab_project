import PdfPrinter from "pdfmake";

// --- INTERFACES DE TU DATA (Agregadas aquí para evitar fallas de rutas) ---
export interface CotizacionModoEntregaEntity {
  modo: string;
  multiplicador: number;
  plazoEntrega: string;
}

export interface CotizacionConfiguracionEntity {
  precioKwh: number;
  tarifaManoObraPorHora: number;
  multiplicadorPrecioBase: number;
  porcentajeRangoInferior: number;
  porcentajeRangoSuperior: number;
  maquinas: Record<string, unknown>;
}

export interface CotizacionModeloStlDetail {
  id: number;
  hash: string;
  nombreArchivo: string;
  tamanoBytes: number;
  formato: string;
  cantidadTriangulos: number;
  volumenCm3: number;
  areaMm2: number;
  dimensionXMm: number;
  dimensionYMm: number;
  dimensionZMm: number;
  esMallaCerrada: boolean;
}

export interface CotizacionMaterialDetail {
  id: number;
  nombre: string;
  marca: string | null;
  precioPorKg: number;
}

export interface CotizacionDesgloseCostosDetail {
  gramosConMermaPorUnidad: number | null;
  costoMaterial: number;
  costoElectricidad: number;
  costoDesgasteMaquina: number;
  costoManoObra: number;
  costoSetup: number;
  costoInsumosExtra: number;
  costoPostProceso: number | null;
  costoFallos: number | null;
  costoDirectoPorUnidad: number;
}

export interface CotizacionPreciosDetail {
  precioInicialPorUnidad: number;
  precioMinimoPorUnidad: number;
  precioMaximoPorUnidad: number;
  precioFinalPorUnidad: number;
  precioFinalTotal: number;
}

export interface CotizacionPiezaDetailEntity {
  id: number;
  modeloStl: CotizacionModeloStlDetail;
  tecnologia: string;
  material: CotizacionMaterialDetail;
  rellenoPorcentaje: number | null;
  gramosPorUnidad: number;
  horasPorUnidad: number;
  minutosManoObraPorUnidad: number;
  setupPorUnidad: number;
  insumosExtraPorUnidad: number;
  cantidad: number;
  desgloseCostos: CotizacionDesgloseCostosDetail;
  precios: CotizacionPreciosDetail;
}

export interface CotizacionDetailEntity {
  id: number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string | null;
  nombrePedido: string | null;
  comentarioPedido: string | null;
  estado: string;
  venceEl: Date;
  modoEntrega: CotizacionModoEntregaEntity;
  configuracion: CotizacionConfiguracionEntity;
  precioTotal: number;
  piezas: CotizacionPiezaDetailEntity[];
  createdAt: Date;
  updatedAt: Date;
}

// --- CLASE DEL SERVICIO GENERADOR ---
export class PdfGeneratorService {
  private printer: PdfPrinter;

  constructor() {
    // Fuentes estándar nativas del motor PDF (no requieren cargar archivos externos en Node)
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italic: "Helvetica-Oblique",
        bolditalic: "Helvetica-BoldOblique",
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  /**
   * Genera el PDF en memoria y retorna el Buffer binario listo para Supabase
   */
  async generarCotizacionBuffer(
    cotizacion: CotizacionDetailEntity,
  ): Promise<Buffer> {
    const docDefinition = this.construirDefinicion(cotizacion);

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      pdfDoc.on("error", (err) => {
        reject(err);
      });

      pdfDoc.end();
    });
  }

  /**
   * Definición estructural del documento. Cambiamos el tipo de retorno a 'any'
   * para evitar los problemas de incompatibilidad de tipos entre versiones de pdfmake.
   */
  private construirDefinicion(data: CotizacionDetailEntity): any {
    const cantidadTotal = data.piezas.reduce(
      (total, pieza) => total + pieza.cantidad,
      0,
    );
    const modoEntrega = data.modoEntrega.modo
      .replace(/[_-]+/g, " ")
      .toLocaleLowerCase("es-PE")
      .replace(/^\p{L}/u, (letra) => letra.toLocaleUpperCase("es-PE"));
    const filasPiezas = data.piezas.map((pieza) => [
      {
        text: (pieza.modeloStl.nombreArchivo || "").replace(/[-_]/g, "$& "),
        style: "tablaArchivo",
      },
      {
        stack: [
          {
            text: `${Number(pieza.modeloStl.dimensionXMm.toFixed(1))} × ${Number(pieza.modeloStl.dimensionYMm.toFixed(1))} × ${Number(pieza.modeloStl.dimensionZMm.toFixed(1))}`,
            style: "dimensionValores",
          },
          { text: "mm", style: "dimensionUnidad" },
        ],
        alignment: "center",
      },
      {
        text: `${pieza.gramosPorUnidad.toFixed(1)} g`,
        alignment: "right",
        style: "tablaTexto",
      },
      { text: pieza.tecnologia, alignment: "center", style: "tablaTexto" },
      { text: pieza.material.nombre, style: "tablaTexto" },
      {
        text: pieza.cantidad.toString(),
        alignment: "center",
        style: "tablaTexto",
      },
      {
        text: `S/ ${pieza.precios.precioFinalPorUnidad.toFixed(2)}`,
        alignment: "right",
        style: "tablaTexto",
      },
      {
        text: `S/ ${pieza.precios.precioFinalTotal.toFixed(2)}`,
        alignment: "right",
        style: "tablaImporte",
      },
    ]);

    const fechaEmision = new Date(data.createdAt).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return {
      pageSize: "A4",
      pageMargins: [44, 42, 44, 48],
      content: [
        {
          columns: [
            {
              width: "*",
              columns: [
                {
                  width: 38,
                  canvas: [
                    {
                      type: "rect",
                      x: 0,
                      y: 0,
                      w: 34,
                      h: 34,
                      r: 7,
                      color: "#111111",
                    },
                    {
                      type: "line",
                      x1: 9,
                      y1: 25,
                      x2: 17,
                      y2: 9,
                      lineWidth: 3,
                      lineColor: "#E85D3C",
                    },
                    {
                      type: "line",
                      x1: 17,
                      y1: 9,
                      x2: 26,
                      y2: 25,
                      lineWidth: 3,
                      lineColor: "#E85D3C",
                    },
                    {
                      type: "line",
                      x1: 12,
                      y1: 20,
                      x2: 22,
                      y2: 20,
                      lineWidth: 2,
                      lineColor: "#FFFFFF",
                    },
                  ],
                },
                {
                  width: "*",
                  stack: [
                    { text: "KREA LAB", style: "logoText" },
                    { text: "FABRICACIÓN DIGITAL", style: "logoCaption" },
                  ],
                  margin: [8, 2, 0, 0],
                },
              ],
            },
            {
              width: 205,
              stack: [
                {
                  text: "COTIZACIÓN",
                  style: "documentTitle",
                  alignment: "right",
                },
                {
                  text: `N.º ${String(data.id).padStart(5, "0")}`,
                  style: "quoteNumber",
                  alignment: "right",
                },
                {
                  text: [
                    { text: `Emitida: ${fechaEmision}`, color: "#777777" },
                  ],
                  fontSize: 8,
                  alignment: "right",
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 507,
              y2: 0,
              lineWidth: 1.5,
              lineColor: "#E85D3C",
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "50%",
              stack: [
                { text: "CLIENTE", style: "sectionLabel" },
                {
                  text: data.nombreCliente,
                  style: "primaryInfo",
                  margin: [0, 5, 0, 4],
                },
                {
                  text: `Teléfono  ${data.telefonoCliente}`,
                  style: "secondaryInfo",
                },
                {
                  text: `Correo  ${data.correoCliente || "No especificado"}`,
                  style: "secondaryInfo",
                },
              ],
            },
            {
              width: "50%",
              stack: [
                { text: "PEDIDO", style: "sectionLabel", alignment: "right" },
                {
                  text: data.nombrePedido || "Sin nombre",
                  style: "primaryInfo",
                  alignment: "right",
                  margin: [0, 5, 0, 4],
                },
                {
                  text: `Modo de entrega  ${modoEntrega}`,
                  style: "secondaryInfo",
                  alignment: "right",
                },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 24],
        },
        {
          columns: [
            { text: "DETALLE DE PRODUCCIÓN", style: "sectionHeading" },
            {
              text: `TOTAL A ENTREGAR  ${cantidadTotal} ${cantidadTotal === 1 ? "UNIDAD" : "UNIDADES"}`,
              style: "quantityBadge",
              alignment: "right",
            },
          ],
          margin: [0, 0, 0, 9],
        },
        {
          table: {
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            headerRows: 1,
            dontBreakRows: true,
            body: [
              [
                { text: "ARCHIVO STL", style: "tablaCabecera" },
                {
                  text: "MEDIDAS\nX × Y × Z",
                  alignment: "center",
                  style: "tablaCabecera",
                },
                {
                  text: "PESO\n(g/u)",
                  alignment: "right",
                  style: "tablaCabecera",
                },
                {
                  text: "TECNOLOGÍA",
                  alignment: "center",
                  style: "tablaCabecera",
                },
                { text: "MATERIAL", style: "tablaCabecera" },
                { text: "CANT.", alignment: "center", style: "tablaCabecera" },
                {
                  text: "P. UNITARIO",
                  alignment: "right",
                  style: "tablaCabecera",
                },
                { text: "IMPORTE", alignment: "right", style: "tablaCabecera" },
              ],
              ...filasPiezas,
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === node.table.body.length ? 0 : 0.7,
            vLineWidth: () => 0,
            hLineColor: () => "#E5E5E5",
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: (i: number) => (i === 0 ? 8 : 6),
            paddingBottom: (i: number) => (i === 0 ? 8 : 6),
          },
          margin: [0, 0, 0, 18],
        },
        {
          columns: [
            {
              text: "Importes expresados en soles (S/).",
              style: "footnote",
              alignment: "left",
              width: "*",
            },
            {
              width: "auto",
              table: {
                widths: [95, 95],
                body: [
                  [
                    { text: "TOTAL", style: "totalLabel" },
                    {
                      text: `S/ ${data.precioTotal.toFixed(2)}`,
                      style: "totalAmount",
                      alignment: "right",
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                fillColor: () => "#111111",
                paddingLeft: () => 12,
                paddingRight: () => 12,
                paddingTop: () => 10,
                paddingBottom: () => 10,
              },
            },
          ],
          margin: [0, 3, 0, 0],
        },
      ],
      footer: (_currentPage: number, pageCount: number) => ({
        columns: [
          { text: "KREA LAB", style: "footerBrand", alignment: "left" },
          {
            text: `Cotización ${String(data.id).padStart(5, "0")}  ·  ${_currentPage} / ${pageCount}`,
            style: "footnote",
            alignment: "right",
          },
        ],
        margin: [44, 0, 44, 0],
      }),
      styles: {
        logoText: { fontSize: 17, bold: true, color: "#111111" },
        logoCaption: { fontSize: 7, bold: true, color: "#777777" },
        documentTitle: { fontSize: 9, bold: true, color: "#777777" },
        quoteNumber: {
          fontSize: 18,
          bold: true,
          color: "#111111",
          margin: [0, 2, 0, 0],
        },
        sectionLabel: { fontSize: 8, bold: true, color: "#E85D3C" },
        primaryInfo: { fontSize: 11, bold: true, color: "#111111" },
        secondaryInfo: {
          fontSize: 8.5,
          color: "#555555",
          margin: [0, 2, 0, 0],
        },
        sectionHeading: { fontSize: 11, bold: true, color: "#111111" },
        quantityBadge: { fontSize: 8, bold: true, color: "#E85D3C" },
        tablaCabecera: {
          fillColor: "#111111",
          color: "#FFFFFF",
          bold: true,
          fontSize: 7.5,
          lineHeight: 1.15,
        },
        tablaArchivo: { fontSize: 8, color: "#222222", bold: true },
        dimensionValores: { fontSize: 7.5, color: "#333333" },
        dimensionUnidad: { fontSize: 6.5, color: "#777777" },
        tablaTexto: { fontSize: 8, color: "#333333" },
        tablaImporte: { fontSize: 8, bold: true, color: "#111111" },
        totalLabel: { fontSize: 9, bold: true, color: "#E85D3C" },
        totalAmount: { fontSize: 13, bold: true, color: "#FFFFFF" },
        footnote: { fontSize: 7.5, color: "#777777" },
        footerBrand: { fontSize: 7.5, bold: true, color: "#E85D3C" },
      },
      defaultStyle: { font: "Roboto" },
    };
  }
}
