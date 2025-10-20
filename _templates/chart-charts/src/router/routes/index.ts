import { RouteRecordRaw } from "vue-router";

interface RouterModule {
  default: RouteRecordRaw[];
}
const routesModels = import.meta.globEager<RouterModule>("./**.ts");
let routes: RouteRecordRaw[] = [];

Object.entries(routesModels).forEach(([path, module]) => {
  if (Array.isArray(!module?.default)) return;
  const { default: moduleDefault } = module;
  routes = [...routes, ...moduleDefault];
});
// console.log(routesModels, routes, "-routesModel");
export default routes;
