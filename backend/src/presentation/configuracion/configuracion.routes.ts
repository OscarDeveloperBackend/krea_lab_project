import { Router } from "express";
import { ConfiguracionGeneralService } from "../../services/configuracion.service.js";
import { ConfiguracionGeneralController } from "./configuracion.controller.js";

export class ConfiguracionGeneralRoutes {
  static get routes() {
    const router = Router();
    const service = new ConfiguracionGeneralService();
    const controller = new ConfiguracionGeneralController(service);

    router.get("/", controller.get);
    router.patch("/", controller.updateGeneral);
    router.patch("/maquinas/:tecnologia", controller.updateMaquina);

    return router;
  }
}
