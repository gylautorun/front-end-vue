<template>
  <div class="time-slicing-optimization">
    <Button type="primary" @click="loadElements">加载30(万个)元素</Button>
    <div class="elements" ref="elementsRef"></div>
  </div>
</template>

<script setup lang="ts" name="timeSlicingOptimization">
  import { ref } from 'vue';
  import { Button } from 'ant-design-vue';
  import {idlePerformanceTask, requestAnimationFramePerformanceTask} from './performance-task';
  const elementsRef = ref<HTMLDivElement | null>(null);
  type ITask = () => HTMLDivElement;
  const tasks: ITask[] = Array.from({length: 30 * 10000}, (_, index) => () => {
    const div = document.createElement('div');
    div.innerText = `元素${index}`;
    div.classList.add('element-item');
    // elementsRef.value?.appendChild(div);
    return div;
  });

  // 分步执行任务
  function performanceTask(tasks: ITask[]) {
    let index = 0; // 当前要执行的任务下标
    /**
     * 1. 什么时候进行下一步执行
     *  - requestIdleCallback
     *  - requestAnimationFrame
     * 2. 单次执行数量
     *  - 当前还有任务要执行, 并且时间片足够使用, 那么就执行一个任务
     *  - 上面不满足时候, 启动下一步执行
     * 
     */
    // requestIdleCallback
    function run() {
      requestIdleCallback((idl) => {
        // 当前还有任务要执行, 并且时间片足够使用, 那么就执行一个任务
        while (index < tasks.length && idl.timeRemaining() > 0) {
          tasks[index++]();
        }
        // 注册下一步的执行 & 当前还有任务没有执行
        if (index < tasks.length) {
          run();
        }
      });
    }
    run();
  }
  function loadElements() {
    // performanceTask(tasks);
    // const result = idlePerformanceTask(tasks);
    // const result = requestAnimationFramePerformanceTask(tasks);
    // setTimeout(() => {
    //   result.stop();
    // }, 100);
  }
  
</script>

<style scoped lang="scss">
  @import url('./index.scss');
</style>
