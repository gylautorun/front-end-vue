import { statisDeviceByUserObject } from "/@/apis/statisCharts";
// import { useHashMapDics } from "@/hooks/useHashMapDic";
import {
  chartsOptions,
  BarECOption,
  PieECOption,
  GaugeECOption,
  EChartsOption,
  ChartsEvents
} from "/components/globals/v-charts";

/**
 * 设备使用分类统计
 */
export const useStatisDeviceByUserObject = () => {
  const options = chartsOptions<BarECOption>({
    yAxis: {},
    xAxis: {
      data: []
    },
    series: [
      {
        data: []
      }
    ]
  });

  const init = async () => {
    const xData = [];
    const sData = [];
    const dicts = [
      {
        label: "人员",
        value: "1"
      },
      {
        label: "车辆",
        value: "2"
      },
      {
        label: "船舶",
        value: "3"
      },
      {
        label: "飞机",
        value: "4"
      },
      {
        label: "货物",
        value: "5"
      },
      {
        label: "其他",
        value: "6"
      }
    ];
    const data = await statisDeviceByUserObject();
    dicts.forEach(({ label, value }) => {
      if (value === "6") return; // 排除其他
      xData.push(label);
      const temp = data.find(({ name }) => name === value);
      sData.push(temp?.qty || 0);
    });
    // setTimeout(() => {
    options.xAxis = { data: xData };
    options.series = [{ data: sData }];
    console.log(options.series, "--------sData");
    // }, 2000);
  };

  const selectchanged = (params: ChartsEvents.Events["selectchanged"]) => {
    console.log(params, "选中图例了");
  };

  const handleChartClick = (params: string) => {
    console.log(params, "点击了图表");
  };

  onMounted(() => {
    init();
  });
  return {
    options,
    selectchanged,
    handleChartClick
  };
};
