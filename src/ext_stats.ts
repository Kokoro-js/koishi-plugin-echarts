// 整体导出对象形式的插件
import { Context, h } from "koishi";
import type {} from "./index";
import { generateChartOptions, TimeRangeParser } from "koishi-plugin-stats";

import {
  formatDataForEChartsHeatmap,
  generateHeatmapOption,
} from "./charts/monthly_heatmap";
import { generateRankOption } from "./charts/message_rank";

export interface Config {}

export const name = "echarts-stats";

export default async function apply(ctx: Context, config: Config) {
  ctx
    .command("stats.chat [rangeInput:string]", "生成聊天频率图表。")
    .option("step", "-s [step]")
    .option("guildId", "-g [guildId]")
    .option("width", "-w [width:number]")
    .option("height", "-he [height:number]")
    .action(async ({ session, options }, rangeInput) => {
      const rangeString = rangeInput ?? "today";
      const guildId = options.guildId ?? session.guildId;
      const range = TimeRangeParser.parseDateInput(rangeString);
      if ("error" in range) {
        return range.error;
      }

      const step = (options.step ?? 30) * 60; // step 单位为分钟，转化为秒
      const result = await ctx.stats.queryClient.rangeQuery(
        `count_over_time(message_length{guildId="${guildId}"}[1m])`,
        range.start,
        range.end,
        step,
      );

      const option = generateChartOptions(
        result,
        `本群聊天频次 (${new Date(range.start).toLocaleString()} - ${new Date(range.end).toLocaleString()}`,
        range.start as number,
        range.end as number,
        step,
      );
      const chart = await ctx.echarts.createChartPNG(
        options.height || 1200,
        options.width || 900,
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
      const now = new Date().getTime();
      if (range.start > now) return "怎么能查询未来的数据呢？";
      const guildId = options.guildId ?? session.guildId;
      const step = 86400;
      const result = await ctx.stats.queryClient.rangeQuery(
        `sum without (userId,type) (count_over_time({__name__="message_length", guildId="${guildId}"}[1d]))`,
        range.start,
        range.end,
        step,
      );
      ctx.logger.info(result);
      const heatmapData = formatDataForEChartsHeatmap(result);
      const option = generateHeatmapOption(heatmapData, range.range);

      const chart = await ctx.echarts.createChartPNG(
        options.height || 500,
        options.width || 400,
        option as any,
      );
      return h.image(chart, "image/png");
    });

  ctx
    .command("stats.rank [rangeInput:string]", "生成群聊天的活跃度排行榜。")
    .option("length", "-l [length]")
    .option("guildId", "-g [guildId]")
    .option("type", "-t [type]")
    .option("width", "-w [width:number]")
    .option("height", "-he [height:number]")
    .action(async ({ session, options }, rangeInput) => {
      const rangeString = rangeInput ?? "today";
      const guildId = options.guildId ?? session.guildId;
      const length = options.length ?? 10;
      const contentType = options.type ?? "text";
      const range = TimeRangeParser.parseDateInput(rangeString);
      if ("error" in range) {
        return range.error;
      }

      const endTimestamp = new Date(range.end).getTime() / 1000; // ms to s
      const durationHours =
        (endTimestamp - new Date(range.start).getTime() / 1000) / 3600;
      const queryRange = `[${durationHours}h]`;
      const result = await ctx.stats.queryClient
        .instantQuery(
          `
      topk(${length}, sum by (userId) (count_over_time(message_length{guildId="${guildId}",type="${contentType}"}${queryRange})) @ ${endTimestamp})
    `,
        )
        .catch((e) => ctx.logger.error(e));
      if (!result) return "遇到错误，控制台查看详情。";
      const dataPromises = result.result
        .reverse()
        .map(async ({ metric: { userId }, value: { 1: times } }) => {
          const user = await session?.bot?.getGuildMember(
            session.guildId,
            userId,
          );
          return {
            avatar: user.avatar, // can be undefined
            name: user.nick || user.name || (userId as string),
            value: Number(times),
          };
        });

      const data = await Promise.all(dataPromises);
      const chart = await ctx.echarts.createChartPNG(
        options.height || 800,
        options.width || 450,
        generateRankOption(
          `本群聊天排行 [类型 ${contentType}] (${new Date(range.start).toLocaleString()} - ${new Date(range.end).toLocaleString()}`,
          data,
        ) as any,
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
