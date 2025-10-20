import { RouteRecordRaw } from "vue-router";

const Layout = () => import("/@/views/layout/index.vue");

const router: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: Layout,
    redirect: "/welcome",
    children: [
      {
        path: "welcome",
        name: "welcome",
        component: () => import("/@/views/home/index.vue"),
        meta: {
          title: "首页"
        }
      },
      {
        path: "demo",
        name: "demo",
        component: () => import("/@/views/xss/xss.vue"),
        meta: {
          title: "demo"
        }
      }
    ]
  }
];

export default router;
