export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CotizacionListEntity {
  constructor(
    public readonly id: number,
    public readonly nombreCliente: string,
    public readonly telefonoCliente: string,
    public readonly correoCliente: string | null,
    public readonly nombrePedido: string | null,
    public readonly estado: string,
    public readonly modoEntrega: string,
    public readonly cantidadPiezas: number,
    public readonly materiales: string[],
    public readonly precioTotal: number,
    public readonly venceEl: Date,
    public readonly createdAt: Date,
  ) {}
}

export class PaginatedCotizacionesEntity {
  constructor(
    public readonly data: CotizacionListEntity[],
    public readonly meta: PaginationMeta,
  ) {}
}
