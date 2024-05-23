function generateRandomData() {
  return [
    { name: "Nawyjx", value: 46 },
    { name: "望月", value: 34 },
    { name: "Akisa喵~", value: 19 },
    { name: "小林不许动", value: 16 },
    { name: "Evelyn", value: 12 },
    { name: "绪山真寻", value: 11 },
    { name: "白梨梨", value: 11 },
    { name: "咨询勇者爱丽丝！", value: 10 },
    { name: "天凌钰", value: 9 },
    { name: "猫猫", value: 7 },
    { name: "小林全自动", value: 5 },
    { name: "老苍学", value: 2 },
    { name: "晏炜唯", value: 1 },
    { name: "ATM", value: 1 },
    { name: "麻雀门钉", value: 0 },
    { name: "九之川", value: 0 },
    { name: "麦mai麦", value: 0 },
    { name: "小林君", value: 0 },
    { name: "天凌", value: 0 },
  ];
}

const colors = [
  "#5470C6",
  "#91CC75",
  "#FAC858",
  "#EE6666",
  "#73C0DE",
  "#3BA272",
  "#FC8452",
  "#9A60B4",
  "#EA7CCC",
  "#FFB761",
  "#5AB1EF",
  "#B6A2DE",
  "#8D98B3",
  "#C05050",
  "#5AB1EF",
  "#DD6B66",
  "#749F83",
  "#CBB0E3",
  "#C49B73",
  "#D3F2E6",
];

export function generateRankOption(
  name: string,
  data: {
    name: string;
    value: number;
    avatar?: string; // Optional avatar URL
  }[],
) {
  const yAxisData = data.map((item) => {
    if (item.avatar) {
      return `{img|} ${item.name}`;
    }
    return item.name;
  });
  const seriesData = data.map((item) => item.value);

  return {
    backgroundColor: "#2c3e50", // 设置背景色为深色
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    title: {
      text: name,
      textStyle: {
        color: "#ecf0f1", // 标题字体颜色设置为浅色
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      boundaryGap: [0, 0.01],
      axisLabel: {
        color: "#ecf0f1", // x轴字体颜色设置为浅色
      },
      axisLine: {
        lineStyle: {
          color: "#ecf0f1", // x轴轴线颜色设置为浅色
        },
      },
    },
    yAxis: {
      type: "category",
      data: yAxisData,
      axisLabel: {
        color: "#ecf0f1", // y轴字体颜色设置为浅色
        formatter: function (value, index) {
          const item = data[index];
          if (item.avatar) {
            return `{img|} ${item.name}`;
          }
          return item.name;
        },
        rich: {
          img: {
            height: 20,
            align: "center",
            backgroundColor: {
              image: function (params) {
                const item = data[params.dataIndex];
                return item.avatar || "";
              },
            },
          },
        },
      },
      axisLine: {
        lineStyle: {
          color: "#ecf0f1", // y轴轴线颜色设置为浅色
        },
      },
    },
    series: [
      {
        name: "Count",
        type: "bar",
        data: seriesData,
        label: {
          show: true,
          position: "right",
          color: "#ecf0f1", // 数据标签字体颜色设置为浅色
        },
        itemStyle: {
          color: function (params) {
            return colors[params.dataIndex % colors.length];
          },
        },
      },
    ],
  };
}
