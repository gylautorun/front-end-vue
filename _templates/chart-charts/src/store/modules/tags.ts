import { defineStore } from "pinia";

export const useTagStoreHook = defineStore({
  id: "TagStore",
  state: () => ({
    visitedViews: [],
    cachedViews: []
  }),
  actions: {
    addView(view) {
      this.addVisitedView(view);
      this.addCachedView(view);
    },
    addVisitedView(view) {
      console.log(this, "----state---");
      if (this.visitedViews.some(v => v.path === view.path)) return;
      this.visitedViews.push(
        Object.assign({}, view, {
          title: view.meta.title || "no-name"
        })
      );
    },
    addCachedView(view) {
      if (this.cachedViews.includes(view.name)) return;
      if (view.meta && !view.meta.noCache) {
        this.cachedViews.push(view.name);
      }
    },
    delView(view) {
      // return new Promise(resolve => {
      this.delVisitedView(view);
      this.delCachedView(view);
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      };
      // });
    },
    delVisitedView(view) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.path === view.path) {
          this.visitedViews.splice(i, 1);
          break;
        }
      }
      return this.visitedViews;
    },
    delCachedView(view) {
      const index = this.cachedViews.indexOf(view.name);
      index > -1 && this.cachedViews.splice(index, 1);
      return [...this.cachedViews];
    },
    delOthersViews(view) {
      this.delOthersVisitedViews(view);
      this.delOthersCachedViews(view);
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      };
    },
    delOthersVisitedViews(view) {
      this.visitedViews = this.visitedViews.filter(v => {
        return v.meta.affix || v.path === view.path;
      });
      return [...this.visitedViews];
    },
    delOthersCachedViews(view) {
      const index = this.cachedViews.indexOf(view.name);
      if (index > -1) {
        this.cachedViews = this.cachedViews.slice(index, index + 1);
      } else {
        this.cachedViews = [];
      }
      return [...this.cachedViews];
    },
    delAllViews() {
      this.delAllVisitedViews();
      this.delAllCachedViews();
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      };
    },
    delAllVisitedViews() {
      // keep affix tags
      const affixTags = this.visitedViews.filter(tag => tag.meta.affix);
      this.visitedViews = affixTags;
      return [...this.visitedViews];
    },
    delAllCachedViews() {
      this.cachedViews = [];
      return [...this.cachedViews];
    },

    updateVisitedView(view) {
      for (let v of this.visitedViews) {
        if (v.path === view.path) {
          v = Object.assign(v, view);
          break;
        }
      }
      return [...this.visitedViews];
    },

    delRightTags(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path);
      if (index === -1) {
        return;
      }
      this.visitedViews = this.visitedViews.filter((item, idx) => {
        if (idx <= index || (item.meta && item.meta.affix)) {
          return true;
        }
        const i = this.cachedViews.indexOf(item.name);
        if (i > -1) {
          this.cachedViews.splice(i, 1);
        }
        return false;
      });
      return [...this.visitedViews];
    },

    delLeftTags(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path);
      if (index === -1) {
        return;
      }
      this.visitedViews = this.visitedViews.filter((item, idx) => {
        if (idx >= index || (item.meta && item.meta.affix)) {
          return true;
        }
        const i = this.cachedViews.indexOf(item.name);
        if (i > -1) {
          this.cachedViews.splice(i, 1);
        }
        return false;
      });
      return [...this.visitedViews];
    }
  }
});
