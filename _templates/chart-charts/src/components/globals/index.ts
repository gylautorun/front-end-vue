import { CreateAppFunction } from "vue";

const componentsModules = import.meta.glob<{ default: any }>("./**/index.(ts|tsx)", { eager: true });
export default (app: ReturnType<CreateAppFunction<Element>>) => {
  Object.entries(componentsModules).forEach(([key, componentModule]) => {
    // console.log(componentModule,'----componentModule')
    const { default: defaultModule } = componentModule;
    console.log(defaultModule?.name, defaultModule);
    if (defaultModule) {
      app.component(defaultModule.name, defaultModule);
    }
  });
};
