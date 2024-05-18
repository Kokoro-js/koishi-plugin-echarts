// 整体导出对象形式的插件
import { Context, h } from "koishi";
import type {} from "./index";
import { generateChartOptions } from "koishi-plugin-stats";
import DatesRangeParser from "dates-range-parser";

export interface Config {}

export const name = "echarts-stats";

export default function apply(ctx: Context, config: Config) {
  ctx
    .command("stats.chat [rangeInput:text]", "生成聊天频率图表。")
    .option("step", "-s <step>")
    .action(async ({ session, options }, rangeInput) => {
      const range = DatesRangeParser.parse("rangeInput") as {
        start: Date;
        end: Date;
      };
      const step = (options.step ?? 30) * 60; // step 单位为分钟，转化为秒
      const result = await ctx.stats.queryClient.rangeQuery(
        `count(message_length{guildId="${session.guildId}"})`,
        range.start,
        range.end,
        step,
      );
      const option = generateChartOptions(
        result,
        `本群聊天频次 (${range.start.toISOString()} - ${range.end.toISOString()}`,
        range.start.getTime(),
        range.end.getTime(),
        step,
      );
      const chart = await ctx.echarts.createChartPNG(1200, 800, option as any);
      return h.image(chart, "image/png");
    });
}
