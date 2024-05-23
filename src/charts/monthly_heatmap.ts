import type { QueryResult } from "koishi-plugin-stats";

export function formatDataForEChartsHeatmap(data: QueryResult) {
  // 假设response是从Prometheus API获取的完整响应体
  const results = data.result; // 获取结果数组
  return results.flatMap((entry) =>
    entry.values.map(([timestamp, value]) => {
      const date = new Date(timestamp * 1000); // 将Unix时间戳转换为JavaScript日期对象
      const formattedDate = date.toISOString().substring(0, 10); // 格式化日期为 yyyy-MM-dd
      return [formattedDate, value];
    }),
  );
}

/**
 * 生成 ECharts 配置项
 * @param {Array} data - 处理后的数据
 * @param {String} range - 处理后的数据
 * @returns {Object} - ECharts 配置项
 */
export function generateHeatmapOption(data, range) {
  // 动态计算最大值
  const maxDataValue = Math.max(...data.map((item) => item[1]));

  return {
    backgroundColor: "white", // 设置背景色
    tooltip: {
      position: "top",
      formatter: function (params) {
        return `${params.data[0]}: ${params.data[1]} messages`;
      },
    },
    visualMap: {
      min: 0,
      max: maxDataValue,
      calculable: true,
      orient: "horizontal",
      left: "center",
      top: "5%", // 使颜色计度表更靠近图表
      inRange: {
        color: ["#e0ffff", "#006edd"],
      },
    },
    calendar: {
      top: "35%", // 调整顶部间距，使图表在页面中央
      left: "center",
      cellSize: [60, 50],
      yearLabel: { show: false },
      orient: "vertical",
      dayLabel: {
        firstDay: 1,
        nameMap: ["日", "一", "二", "三", "四", "五", "六"], // 设置为中文
      },
      monthLabel: {
        show: true, // 如果需要显示月份标签
        nameMap: [
          "一月",
          "二月",
          "三月",
          "四月",
          "五月",
          "六月",
          "七月",
          "八月",
          "九月",
          "十月",
          "十一月",
          "十二月",
        ], // 设置为中文
      },
      range: range,
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: data,
      },
      {
        type: "scatter",
        coordinateSystem: "calendar",
        symbolSize: 1,
        label: {
          show: true,
          formatter: function (params) {
            const date = new Date(params.value[0]);
            const day = date.getDate();
            const value = params.value[1];
            return `${day}\n${value}`;
          },
          color: "#000",
        },
        data: data,
      },
    ],
  };
}
