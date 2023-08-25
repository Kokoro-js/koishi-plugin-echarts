import { Context, h, Logger, Schema, Service } from "koishi";
import {} from "koishi-plugin-skia-canvas";
import * as echarts from "echarts";
import path from "path";
import * as fs from "fs";

export { echarts };

export const name = "echarts";
const logger = new Logger(name);
export const using = ["canvas"];

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

  constructor(
    ctx: Context,
    public config: ECharts.Config,
  ) {
    super(ctx, "echarts");
    echarts.setPlatformAPI({
      createCanvas() {
        return ctx.canvas.createCanvas(32, 32) as any;
      },
      loadImage(src, onload, onerror) {
        const img = new ctx.canvas.Image() as any;
        // 必须要绑定 this context.
        img.onload = onload.bind(img);
        img.onerror = onerror.bind(img);
        img.src = Buffer.from(src, "base64");
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
        logger.success(`Theme "${themeName}" registered successfully!`);
      }
    });
    ctx
      .command("echarts")
      .option("width", "-w <wid:posint>")
      .option("height", "-t <hei:posint>")
      .action(async ({ options }, set) => {
        const chart = await this.createChart(options.width, options.height, {
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
        const buffer = chart.canvas.toBuffer("image/png");
        chart.dispose();
        return h.image(buffer, "image/png");
      });

    logger.success("Echarts 启动成功。");
  }
}

Context.service("echarts", ECharts);
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
