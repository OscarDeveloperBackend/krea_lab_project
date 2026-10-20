export class StlCalculateEntity {
  constructor(
    public readonly hash: string,
    public readonly nombreArchivo: string,
    public sizeFile: number,
    public readonly formato: "ASCII" | "BINARIO",

    public readonly claveAlmacenamiento: string | null,

    public readonly cantidadTriangulos: number,
    public readonly volumen: number,
    public readonly area: number,

    public readonly dimensionX: number,
    public readonly dimensionY: number,
    public readonly dimensionZ: number,

    public readonly esMallaCerrada: boolean,
  ) {}
}
