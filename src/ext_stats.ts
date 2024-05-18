// 整体导出对象形式的插件
import { Context, h } from "koishi";
import type {} from "./index";
import { generateChartOptions } from "koishi-plugin-stats";
import DatesRangeParser from "dates-range-parser";
import {
  formatDataForEChartsHeatmap,
  generateHeatmapOption,
} from "./charts/monthly_heatmap";

export interface Config {}

export const name = "echarts-stats";

export default function apply(ctx: Context, config: Config) {
  ctx
    .command("stats.chat [rangeInput:string]", "生成聊天频率图表。")
    .option("step", "-s [step]")
    .option("guildId", "-g [guildId]")
    .option("width", "-w [width:number]")
    .option("height", "-he [height:number]")
    .action(async ({ session, options }, rangeInput) => {
      const rangeString = rangeInput ?? "now -> 1d";
      const guildId = options.guildId ?? session.guildId;
      const range = DatesRangeParser.parse(rangeString).value as {
        from: number;
        to: number;
      };
      const step = (options.step ?? 30) * 60; // step 单位为分钟，转化为秒
      const result = await ctx.stats.queryClient.rangeQuery(
        `count(message_length{guildId="${guildId}"})`,
        range.from,
        range.to,
        step,
      );
      const option = generateChartOptions(
        result,
        `本群聊天频次 (${new Date(range.from).toLocaleString()} - ${new Date(range.to).toLocaleString()}`,
        range.from,
        range.to,
        step,
      );
      const chart = await ctx.echarts.createChartPNG(
        options.height || 1200,
        options.width || 800,
        option as any,
      );
      return h.image(chart, "image/png");
    });

  ctx
    .command("stats.monthly [monthNumber:posint]", "获取一个月的聊天热力图。")
    .option("year", "-y [year:number]")
    .option("guildId", "-g [guildId]")
    .option("width", "-w [width:number]")
    .option("height", "-he [height:number]")
    .action(async ({ session, options }, monthNumber) => {
      if (monthNumber && monthNumber > 12) {
        return "没有大于 12 的月份噢。";
      }
      const range = getMonthRange(options.year, monthNumber);
      const guildId = options.guildId ?? session.guildId;
      const step = 86400;
      const result = await ctx.stats.queryClient.rangeQuery(
        `count(message_length{guildId="${guildId}"})`,
        range.start,
        range.end,
        step,
      );
      const heatmapData = formatDataForEChartsHeatmap(result);
      const option = generateHeatmapOption(heatmapData, range.range);

      const chart = await ctx.echarts.createChartPNG(
        options.height || 500,
        options.width || 400,
        option as any,
      );
      return h.image(chart, "image/png");
    });
}

function getMonthRange(
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
) {
  // JavaScript中的月份是从0开始计数的，0代表一月，11代表十二月
  // 这里month默认值是当前月份，因为Date.getMonth() 返回0-11，所以需要加1
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // 月的最后一天

  const startTimestamp = startDate.getTime();
  const endTimestamp =
    endDate.getTime() + (23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000); // 最后一天的23:59:59

  return {
    start: startTimestamp,
    end: endTimestamp,
    range: year + "-" + month,
  };
}
