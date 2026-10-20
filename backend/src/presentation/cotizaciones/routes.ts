import { Router } from "express";
import { CotizacionesControllers } from "./controller.js";
import { CotizacionesService } from "../../services/cotizaciones.service.js";

export class CotizacionRoutes {
  static get routes() {
    const router = Router();
    const cotizacionesService = new CotizacionesService();
    const controller = new CotizacionesControllers(cotizacionesService);

    router.get("/", controller.getAll);
    router.get("/:id", controller.get);
    router.post("/", controller.save);
    router.patch("/:id", controller.update);

    return router;
  }
}

// Compatibilidad por si se importa con el nombre anterior
export { CotizacionRoutes as CotizaionRoutes };
