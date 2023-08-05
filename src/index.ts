import { Context, h, Schema, Service } from "koishi";
import {} from "koishi-plugin-skia-canvas";
import { init, setCanvasCreator } from "echarts";
import * as echarts from "echarts";

export const name = "echarts";

declare module "koishi" {
  interface Context {
    echarts: ECharts;
  }
}

export class ECharts extends Service {
  async createChart(
    width: number = this.config.width,
    height: number = this.config.height,
    options: echarts.EChartsOption,
  ) {
    let _canvas = this.ctx.canvas.createCanvas(width, height);
    const defaultTextStyle = {
      fontFamily: this.ctx.canvas.getPresetFont(), // 字体系列
      fontSize: 18, // 字体大小
    };
    if (!options.textStyle) {
      options.textStyle = defaultTextStyle;
    }
    setCanvasCreator(() => _canvas as any);
    let chart = init(_canvas as any);
    chart.setOption(options);
    return _canvas.toBuffer("image/png");
  }

  constructor(
    ctx: Context,
    public config: ECharts.Config,
  ) {
    super(ctx, "echarts");

    ctx
      .command("echarts")
      .option("width", "-w <wid:posint>")
      .option("height", "-t <hei:posint>")
      .action(async ({ options }, set) => {
        const buffer = await this.createChart(options.width, options.height, {
          title: {
            text: "ECharts 演示",
          },
          tooltip: {},
          legend: {
            data: ["销量"],
          },
          xAxis: {
            data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
          },
          yAxis: {},
          series: [
            {
              name: "销量",
              type: "bar",
              data: [5, 20, 36, 10, 10, 20],
            },
          ],
        });
        return h.image(buffer, "image/png");
      });
  }
}

Context.service("echarts", ECharts);
export default ECharts;

export namespace ECharts {
  export interface Config {
    width: number;
    height: number;
  }

  export const Config: Schema<Config> = Schema.object({
    width: Schema.natural().description("Table default width").default(700),
    height: Schema.natural().description("Table default height").default(700),
  }).i18n({
    zh: {
      width: "表格默认宽度",
      height: "表格默认高度",
    },
  });
}
