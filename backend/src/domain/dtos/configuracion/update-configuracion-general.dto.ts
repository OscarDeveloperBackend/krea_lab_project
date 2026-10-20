export type UpdateConfiguracionGeneralErrors = Record<string, string>;

export class UpdateConfiguracionGeneralDto {
  private constructor(
    public readonly precioKwh?: number,
    public readonly tarifaManoObraPorHora?: number,
    public readonly setupPorDefecto?: number,
    public readonly minutosManoObraPorDefecto?: number,
    public readonly multiplicadorPrecioBase?: number,
    public readonly porcentajeRangoInferior?: number,
    public readonly porcentajeRangoSuperior?: number,
    public readonly diasVencimiento?: number,
  ) {}

  static create(
    object: Record<string, unknown>,
  ): [UpdateConfiguracionGeneralErrors | undefined, UpdateConfiguracionGeneralDto?] {
    const errors: UpdateConfiguracionGeneralErrors = {};

    if (typeof object !== "object" || object === null) {
      return [{ body: "El cuerpo de la petición debe ser un objeto JSON válido." }];
    }

    let fieldsCount = 0;

    const parsePositiveNumber = (
      val: unknown,
      fieldName: string,
      allowZero = true,
    ): number | undefined => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (!Number.isFinite(num) || (allowZero ? num < 0 : num <= 0)) {
        errors[fieldName] = `El valor de ${fieldName} debe ser un número ${allowZero ? "mayor o igual a 0" : "mayor a 0"}.`;
        return undefined;
      }
      fieldsCount++;
      return num;
    };

    const parsePositiveInteger = (
      val: unknown,
      fieldName: string,
      min = 0,
    ): number | undefined => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (!Number.isInteger(num) || num < min) {
        errors[fieldName] = `El valor de ${fieldName} debe ser un número entero mayor o igual a ${min}.`;
        return undefined;
      }
      fieldsCount++;
      return num;
    };

    const precioKwh = parsePositiveNumber(object.precioKwh, "precioKwh", true);
    const tarifaManoObraPorHora = parsePositiveNumber(
      object.tarifaManoObraPorHora,
      "tarifaManoObraPorHora",
      true,
    );
    const setupPorDefecto = parsePositiveNumber(
      object.setupPorDefecto,
      "setupPorDefecto",
      true,
    );
    const minutosManoObraPorDefecto = parsePositiveInteger(
      object.minutosManoObraPorDefecto,
      "minutosManoObraPorDefecto",
      0,
    );
    const multiplicadorPrecioBase = parsePositiveNumber(
      object.multiplicadorPrecioBase,
      "multiplicadorPrecioBase",
      false,
    );
    const porcentajeRangoInferior = parsePositiveNumber(
      object.porcentajeRangoInferior,
      "porcentajeRangoInferior",
      true,
    );
    const porcentajeRangoSuperior = parsePositiveNumber(
      object.porcentajeRangoSuperior,
      "porcentajeRangoSuperior",
      true,
    );
    const diasVencimiento = parsePositiveInteger(
      object.diasVencimiento,
      "diasVencimiento",
      1,
    );

    if (fieldsCount === 0 && Object.keys(errors).length === 0) {
      return [{ body: "Debe enviar al menos un campo para actualizar la configuración general." }];
    }

    if (Object.keys(errors).length > 0) {
      return [errors];
    }

    return [
      undefined,
      new UpdateConfiguracionGeneralDto(
        precioKwh,
        tarifaManoObraPorHora,
        setupPorDefecto,
        minutosManoObraPorDefecto,
        multiplicadorPrecioBase,
        porcentajeRangoInferior,
        porcentajeRangoSuperior,
        diasVencimiento,
      ),
    ];
  }
}
