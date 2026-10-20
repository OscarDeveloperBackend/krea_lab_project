import express, { type Router, type Request, type Response, type NextFunction } from "express";
import cors from "cors";

interface Options {
  port?: number;
  routes: Router;
}

export class Server {
  public readonly app = express();
  private readonly port: number;
  private readonly routes: Router;

  constructor(options: Options) {
    const { port = 3001, routes } = options;
    this.port = port;
    this.routes = routes;
  }

  async start() {
    this.app.use(cors());
    this.app.use(express.json());

    this.app.use("/api", this.routes);

    this.app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Excepción global no capturada:", err);
      const errorObj = err as Record<string, unknown> | undefined;
      const statusCode =
        typeof errorObj?.statusCode === "number"
          ? errorObj.statusCode
          : typeof errorObj?.status === "number"
            ? errorObj.status
            : 500;

      const message =
        typeof errorObj?.message === "string"
          ? errorObj.message
          : "Error interno del servidor.";

      return res.status(statusCode).json({ mensaje: message });
    });

    this.app.listen(this.port, () => {
      console.log(`Servidor disponible en http://localhost:${this.port}.`);
    });
  }
}
