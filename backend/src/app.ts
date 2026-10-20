import { connectDatabase, envs } from "./config/index.js";
import { AppRoutes } from "./presentation/routes.js";
import { Server } from "./presentation/server.js";

(() => {
  main();
})();

async function main() {
  await connectDatabase();

  new Server({
    port: envs.PORT,
    routes: AppRoutes.routes,
  }).start();
}
