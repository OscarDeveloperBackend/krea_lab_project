import { Router } from "express";
import { StlController } from "./stl.controller.js";
import { FileUploadMiddleware } from "../middlewares/file-upload.middleware.js";
import { StlService } from "../../services/stl.service.js";
import { StlDeduplicationMiddleware } from "../middlewares/stl-deduplication.middleware.js";

export class StlRoutes {
  static get routes() {
    const router = Router();
    const stlService = new StlService();
    const controller = new StlController(stlService);

    router.post(
      "/",
      FileUploadMiddleware.processStl,
      StlDeduplicationMiddleware.check(stlService),
      controller.calculate,
    );
    return router;
  }
}
