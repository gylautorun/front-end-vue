import { Plugin } from "vite";
import { resolve } from "path";
export function testDemoPlugin(): Plugin {
  return {
    name: "test-demo",
    buildStart() {
      console.log("服务启动了----------");
    },
    transform(code, id) {
      if (/.+\?worker$/.test(id)) {
        console.log(id, code, "匹配到了");
      }
    }
  };
}
