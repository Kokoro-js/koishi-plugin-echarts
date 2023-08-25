# koishi-plugin-echarts

[![npm](https://img.shields.io/npm/v/koishi-plugin-echarts?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-echarts)

为 Koishi 提供 Echart，

[学习 Options](https://echarts.apache.org/handbook/zh/concepts/dataset)
| [Echarts 官网实例](https://echarts.apache.org/examples/zh/index.html)
| [主题相关](https://echarts.apache.org/handbook/zh/concepts/style)
# 使用指南
```
package.json
....
  "peerDependencies": {
    "koishi": "^4.14.0",
    "koishi-plugin-echarts": "^最新版"
  }
....
```
```
import {} from "koishi-plugin-echarts"

eg.
  const option = {
  legend: {},
  tooltip: {},
  dataset: {
    // 提供一份数据。
    source: [
      ['product', '2015', '2016', '2017'],
      ['Matcha Latte', 43.3, 85.8, 93.7],
      ['Milk Tea', 83.1, 73.4, 55.1],
      ['Cheese Cocoa', 86.4, 65.2, 82.5],
      ['Walnut Brownie', 72.4, 53.9, 39.1]
    ]
  },
  // 声明一个 X 轴，类目轴（category）。默认情况下，类目轴对应到 dataset 第一列。
  xAxis: { type: 'category' },
  // 声明一个 Y 轴，数值轴。
  yAxis: {},
  // 声明多个 bar 系列，默认情况下，每个系列会自动对应到 dataset 的每一列。
  series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }]
};

const chart = ctx.echarts.createChart(1000, 700, option)
const buffer = chart.canvas.toBuffer("image/png")
chart.dispose() // 除非你还想用否则务必销毁实例
return h.image(buffer, "image/png");
```

