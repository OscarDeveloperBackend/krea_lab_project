import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CotizadorConfigService } from './cotizador-config.service';

describe('CotizadorConfigService', () => {
  let service: CotizadorConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CotizadorConfigService],
    });

    service = TestBed.inject(CotizadorConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load configuracion inicial from API', () => {
    const mockResponse = {
      general: {
        precioKwh: 0.75,
        tarifaManoObraPorHora: 6.25,
        setupPorDefecto: 10,
        minutosManoObraPorDefecto: 75,
        multiplicadorPrecioBase: 1.8,
        porcentajeRangoInferior: 0,
        porcentajeRangoSuperior: 20,
        diasVencimiento: 7,
      },
      maquinas: {
        FILAMENTO: {
          nombreMaquina: 'Bambu Lab A1',
          consumoWatts: 100,
          vidaUtilHoras: 8000,
          costoMaquina: 2400,
          camaXMm: 256,
          camaYMm: 256,
          camaZMm: 256,
          porcentajeMerma: null,
          porcentajeFallos: null,
          costoPostProceso: null,
        },
      },
      materiales: [
        {
          id: 7,
          tecnologia: 'FILAMENTO',
          nombre: 'PLA',
          marca: null,
          precioPorKg: 65,
          densidadGramosCm3: 1.24,
        },
      ],
      modos: [
        {
          valor: 'NOCTURNO',
          nombre: 'Nocturno',
          multiplicador: 1,
          plazoEntrega: '3 a 5 días',
        },
      ],
    };

    service.loadConfiguracionInicial().subscribe((response) => {
      expect(response.general.precioKwh).toBe(0.75);
      expect(response.materiales[0].nombre).toBe('PLA');
    });

    const req = httpMock.expectOne('http://localhost:3100/api/configuracion-inicial');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should apply the selected delivery mode multiplier to the price range', () => {
    const pieza = {
      tecnologia: 'FILAMENTO' as const,
      materialId: 7,
      nombreMaterial: 'PLA',
      precioPorKg: 65,
      gramos: 50,
      horas: 1,
      minutos: 30,
      cantidad: 2,
      setup: 10,
      insumosExtra: 5,
      relleno: 20,
      configuracion: {
        precioKwh: 0.75,
        tarifaManoObraPorHora: 6.25,
        setupPorDefecto: 10,
        multiplicadorPrecioBase: 1.8,
        porcentajeRangoInferior: 10,
        porcentajeRangoSuperior: 20,
        modoMultiplicador: 1.3,
      },
      maquina: {
        consumoWatts: 100,
        vidaUtilHoras: 8000,
        costoMaquina: 2400,
        porcentajeMerma: null,
        porcentajeFallos: null,
        costoPostProceso: null,
      },
    };

    const result = service.calcularCostoPieza(pieza);

    expect(result.precioInicial).toBe(51);
    expect(result.precioMinimo).toBeGreaterThan(result.precioInicial);
    expect(result.precioMaximo).toBeGreaterThan(result.precioMinimo);
    expect(result.precioFinal).toBeGreaterThanOrEqual(result.precioMinimo);
    expect(result.precioMinimo).toBe(73);
    expect(result.precioMaximo).toBe(80);
    expect(result.precioFinal).toBe(76);
    expect(result.precioTotal).toBe(152);
    expect(Number.isInteger(result.precioInicial)).toBeTrue();
    expect(Number.isInteger(result.precioMinimo)).toBeTrue();
    expect(Number.isInteger(result.precioMaximo)).toBeTrue();
    expect(Number.isInteger(result.precioFinal)).toBeTrue();
  });

  it('should estimate grams using STL volume in cm3 and material density in g/cm3', () => {
    const grams = service.estimarGramosDesdeStl(7.16, 1.24);

    expect(grams).toBeCloseTo(8.8784, 4);
  });
});
