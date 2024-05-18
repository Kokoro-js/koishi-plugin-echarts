import { Context, h, Logger, Schema, Service } from "koishi";
import {} from "koishi-plugin-skia-canvas";
import * as echarts from "echarts";
import path from "path";
import fs from "fs";
import EXT_stats from "./ext_stats";

export { echarts };

export const name = "echarts";

declare module "koishi" {
  interface Context {
    echarts: ECharts;
  }
}

export class ECharts extends Service {
  static inject = {
    required: ["canvas"],
    optional: ["stats"],
  };
  async createChart(
    width: number = this.config.width,
    height: number = this.config.height,
    options: echarts.EChartsOption,
    theme?: string,
  ) {
    let _canvas = this.ctx.canvas.createCanvas(width, height);

    const defaultTextStyle = {
      fontFamily: this.ctx.canvas.getPresetFont(), // 字体系列
      fontSize: 18, // 字体大小
    };
    if (!options.textStyle) {
      options.textStyle = defaultTextStyle;
    }
    if (!options.animation) {
      options.animation = false;
    }

    let chart = echarts.init(_canvas as any, theme || this.config.defaultTheme);
    chart.setOption(options);

    const disposeChart = () => {
      chart.dispose();
      chart = null;
      _canvas = null;
    };

    return {
      canvas: _canvas,
      chart: chart,
      dispose: disposeChart,
    };
  }

  async createChartPNG(
    width: number = this.config.width,
    height: number = this.config.height,
    options: echarts.EChartsOption,
    theme?: string,
  ) {
    const chart = await this.createChart(width, height, options, theme);
    const buffer = chart.canvas.toBuffer("image/png");
    chart.dispose();
    return buffer;
  }

  // @ts-ignore
  get logger(): Logger {
    return this.ctx.logger(name);
  }

  constructor(
    ctx: Context,
    public config: ECharts.Config,
  ) {
    super(ctx, "echarts");
    if (ctx["stats"] !== undefined) {
      ctx.plugin(EXT_stats);
    }
    echarts.setPlatformAPI({
      createCanvas() {
        return ctx.canvas.createCanvas(32, 32) as any;
      },
      // https://github.com/apache/echarts/issues/19054
      // https://github.com/Brooooooklyn/canvas/issues/719
      loadImage(src, onload, onerror) {
        const img = new ctx.canvas.Image() as any;
        let source: any = src;
        if (typeof source == "string") {
          const commaIdx = source.indexOf(",");
          const encoding =
            source.lastIndexOf("base64", commaIdx) < 0 ? "utf-8" : "base64";
          source = Buffer.from(source.slice(commaIdx + 1), encoding);
        }
        img.src = source;
        return img;
      },
    });

    const themesDir = path.resolve(ctx.baseDir, config.themesDir);
    fs.mkdirSync(themesDir, { recursive: true });
    const files = fs.readdirSync(themesDir);

    files.forEach((file) => {
      const filePath = path.join(themesDir, file);
      const fileStat = fs.statSync(filePath);

      // 检查文件是否为 JSON 文件
      if (fileStat.isFile() && path.extname(filePath) === ".json") {
        const themeName = path.basename(filePath, ".json"); // 获取文件名作为主题名称
        const themeContent = fs.readFileSync(filePath, "utf8");
        const themeObj = JSON.parse(themeContent);

        // 注册为 ECharts 主题
        echarts.registerTheme(themeName, themeObj);
        this.logger.success(`Theme "${themeName}" registered successfully!`);
      }
    });
    ctx
      .command("echarts")
      .option("width", "-w <wid:posint>")
      .option("height", "-t <hei:posint>")
      .action(async ({ options }, set) => {
        const chart = await this.createChartPNG(options.width, options.height, {
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
        return h.image(chart, "image/png");
      });

    ctx.command("echarts.testImage").action(async () => {
      const pic =
        "data:image/png;base64,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";
      const chart = await this.createChartPNG(undefined, undefined, {
        backgroundColor: {
          repeat: "no-repeat",
          opacity: 0.2,
        },
        xAxis: {
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {},
        series: [
          {
            data: [820, 932, 901, 934, 1290, 1330, 1320],
            type: "scatter",
            symbol: "image://" + pic,
            symbolSize: 50,
          },
        ],
      } as any);
      return h.image(chart, "image/png");
    });
    this.logger.success("Echarts 启动成功。");
  }
}

export default ECharts;

export namespace ECharts {
  export interface Config {
    width: number;
    height: number;
    themesDir: string;
    defaultTheme: string;
  }

  export const Config: Schema<Config> = Schema.object({
    width: Schema.natural().description("Table default width").default(1000),
    height: Schema.natural().description("Table default height").default(700),
    themesDir: Schema.path({
      filters: ["directory"],
      allowCreate: true,
    })
      .description("Theme storage path")
      .default("node-rs/canvas/echarts"),
    defaultTheme: Schema.string()
      .default("light")
      .description(
        "light/dark default, You need to install more [themes](https://echarts.apache.org/zh/theme-builder.html)(builder) for further customization.",
      ),
  }).i18n({
    zh: {
      width: "表格默认宽度",
      height: "表格默认高度",
      themesDir: "主题存放目录",
      defaultTheme:
        "未指定主题时的默认主题，内置只有 light/dark 两种，可以往主题文件夹放更多来使用。[主题工具](https://echarts.apache.org/zh/theme-builder.html) <- 可点",
    },
  });
}
