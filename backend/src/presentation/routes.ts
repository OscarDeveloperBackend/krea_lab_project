import { Router } from "express";
import {
  CotizacionRoutes,
  StlRoutes,
  ConfiguracionGeneralRoutes,
  ConfiguracionInicialRoutes,
  MaterialRoutes,
} from "./index.js";

export class AppRoutes {
  static get routes() {
    const router = Router();

    // Health check endpoint
    router.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    });

    router.use("/cotizaciones", CotizacionRoutes.routes);
    router.use("/stl-calculate", StlRoutes.routes);
    router.use("/configuracion-inicial", ConfiguracionInicialRoutes.routes);
    router.use("/configuracion-general", ConfiguracionGeneralRoutes.routes);
    router.use("/material", MaterialRoutes.routes);

    return router;
  }
}
