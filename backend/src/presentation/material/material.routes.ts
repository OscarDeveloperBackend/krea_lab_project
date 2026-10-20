import { Router } from "express";
import { MaterialController } from "./material.controller.js";
import { MaterialService } from "../../services/index.js";

export class MaterialRoutes {
  static get routes() {
    const router = Router();
    const materialService = new MaterialService();
    const controller = new MaterialController(materialService);

    router.get("/", controller.getAll);

    return router;
  }
}
