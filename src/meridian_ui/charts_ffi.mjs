import * as charts from "./internal/vendor/charts.mjs";
import {
  Values,
  Points,
  Cells,
  Nodes,
  Area,
  Doughnut,
  Gauge,
  Radar,
  Pie,
  Funnel,
  Line,
  Bar,
  Scatter,
  Heatmap,
  Treemap,
  Sunburst,
  BoxPlot,
  Candlestick,
} from "./charts.mjs";
import { mountEngine } from "./engine_mount_ffi.mjs";

const nodes = (values) =>
  [...values].map((value) => ({
    name: value.name,
    value: value.value,
    children: nodes(value.children),
  }));
const data = (value) =>
  value instanceof Nodes ? nodes(value[0]) : [...value[0]];
export const describe = (value) => JSON.stringify(data(value));
export function encode(config) {
  const kinds = [
    [Line, "line"],
    [Area, "line"],
    [Bar, "bar"],
    [Scatter, "scatter"],
    [Pie, "pie"],
    [Doughnut, "pie"],
    [Radar, "radar"],
    [Gauge, "gauge"],
    [Heatmap, "heatmap"],
    [Treemap, "treemap"],
    [Sunburst, "sunburst"],
    [Funnel, "funnel"],
    [BoxPlot, "boxplot"],
    [Candlestick, "candlestick"],
  ];
  const categories = [...config.categories];
  const series = [...config.series].map((series) => {
    const type = kinds.find(([Kind]) => series.kind instanceof Kind)?.[1];
    let values = data(series.data);
    if (
      ["pie", "funnel", "gauge"].includes(type) &&
      series.data instanceof Values
    )
      values = values.map((value, index) => ({
        name: categories[index] ?? String(index + 1),
        value,
      }));
    const result = { name: series.name, type, data: values };
    if (series.kind instanceof Area) result.areaStyle = {};
    if (series.kind instanceof Doughnut) result.radius = ["45%", "70%"];
    if (series.kind instanceof Radar && series.data instanceof Values)
      result.data = [{ name: series.name, value: values }];
    return result;
  });
  const cartesian = series.some((series) =>
    ["line", "bar", "scatter", "heatmap", "boxplot", "candlestick"].includes(
      series.type,
    ),
  );
  const heatmap = series.some((series) => series.type === "heatmap");
  const numeric =
    !categories.length &&
    [...config.series].some((series) => series.data instanceof Points);
  const heatValues = [...config.series]
    .filter((series) => series.data instanceof Cells)
    .flatMap((series) => [...series.data[0]].map((cell) => cell[2]));
  return JSON.stringify({
    title: { text: config.title },
    tooltip: { trigger: "item", renderMode: "richText" },
    legend: { top: 32 },
    aria: { enabled: true, decal: { show: true } },
    grid: { left: 48, right: 24, top: 80, bottom: 48, containLabel: true },
    ...(cartesian
      ? {
          xAxis: {
            type: numeric ? "value" : "category",
            ...(numeric ? {} : { data: categories }),
          },
          yAxis: heatmap
            ? { type: "category", data: categories }
            : { type: "value" },
        }
      : {}),
    ...(series.some((series) => series.type === "radar")
      ? { radar: { indicator: categories.map((name) => ({ name })) } }
      : {}),
    ...(heatmap
      ? {
          visualMap: {
            min: Math.min(0, ...heatValues),
            max: Math.max(1, ...heatValues),
            calculable: true,
            orient: "horizontal",
            bottom: 0,
          },
        }
      : {}),
    series,
  });
}

export function mount(id) {
  return mountEngine(id, "data-chart", (element, view) => {
    const chart = charts.init(element, null, { renderer: "svg" });
    chart.on("click", (event) =>
      element.dispatchEvent(
        new view.CustomEvent("meridian-chart-select", {
          bubbles: true,
          detail: {
            series: event.seriesName ?? "",
            index: event.dataIndex ?? -1,
            name: event.name ?? "",
          },
        }),
      ),
    );
    const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
    const forced = view.matchMedia("(forced-colors: active)");
    let current;
    const render = () => {
      if (!current) return;
      const style = view.getComputedStyle(element);
      const colour = forced.matches
        ? style.color
        : style.getPropertyValue("--ink").trim() || style.color;
      const palette = [
        "--accent",
        "--green",
        "--amber",
        "--red",
        "--muted",
      ].map((name) => style.getPropertyValue(name).trim() || colour);
      chart.setOption(
        {
          ...current,
          animation: !motion.matches,
          textStyle: { color: colour, fontFamily: style.fontFamily },
          title: { ...current.title, textStyle: { color: colour } },
          legend: { ...current.legend, textStyle: { color: colour } },
          ...(current.xAxis
            ? {
                xAxis: { ...current.xAxis, axisLabel: { color: colour } },
                yAxis: { ...current.yAxis, axisLabel: { color: colour } },
              }
            : {}),
          ...(forced.matches ? { color: [colour] } : { color: palette }),
        },
        { notMerge: true },
      );
    };
    motion.addEventListener("change", render);
    forced.addEventListener("change", render);
    return {
      update(config) {
        current = config;
        render();
      },
      resize() {
        chart.resize();
      },
      destroy() {
        motion.removeEventListener("change", render);
        forced.removeEventListener("change", render);
        chart.dispose();
      },
    };
  });
}
