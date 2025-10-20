
const Layout = () => import("/@/views/layout/index.vue");

const remainingRouter = [
  {
    path: "/login",
    name: "login",
    component: () => import("/@/views/login/index.vue"),
    meta: {
      title: '登录',
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      icon: "home-filled",
      title: '重定向',
      showLink: false,
      rank: 104
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "redirect",
        component: Layout
      }
    ]
  }
];
// const Layout = () => import("/@/views/layout/index.vue");
export default remainingRouter;
