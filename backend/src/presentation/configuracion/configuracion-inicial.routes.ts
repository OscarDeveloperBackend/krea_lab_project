import { Router } from "express";
import { ConfiguracionGeneralService } from "../../services/configuracion.service.js";
import { ConfiguracionInicialController } from "./configuracion.inicial.controller.js";

export class ConfiguracionInicialRoutes {
  static get routes() {
    const router = Router();
    const service = new ConfiguracionGeneralService();
    const controller = new ConfiguracionInicialController(service);

    router.get("/", controller.Get);

    return router;
  }
}
