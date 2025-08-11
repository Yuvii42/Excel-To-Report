import React, { useRef } from "react";
import Plot from "react-plotly.js";
import { Database, Table, BarChart2, Activity } from "lucide-react";
import ChartRenderer from "../components/ChartRenderer";
import Plotly from 'plotly.js-dist-min';
import { Download } from "lucide-react";



export default function DashboardPage({ result }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-10 text-gray-500 text-lg select-none">
        <Database className="w-10 h-10 mb-4 text-indigo-400 animate-pulse" />
        No data available yet — upload a file to get started.
      </div>
    );
  }

  const { summary, charts, corr_matrix, data_preview } = result;

  const healthColor =
    summary.health_score > 80
      ? "bg-green-500"
      : summary.health_score > 50
      ? "bg-yellow-400"
      : "bg-red-500";

  const renderChart = (c) => {
  const plotRef = useRef(null);

  const exportPNG = () => {
    if (plotRef.current) {
      const gd = plotRef.current.el; // The actual plot DOM node
      Plotly.downloadImage(gd, {
        format: "png",
        filename: c.title || "chart",
        height: 600,
        width: 800,
        scale: 2, // better resolution
      });
    }
  };

  let plotData = [];
  let layout = {
    title: {
      text: c.title,
      font: { size: 18, family: "Inter, sans-serif" },
    },
    autosize: true,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 50, l: 50, r: 30, b: 50 },
    font: { family: "Inter, sans-serif", size: 12 },
    legend: { orientation: "h", y: -0.2 },
  };


  switch (c.type) {
  case "bar":
    plotData = [
      {
        x: c.data.map((d) => d.category),
        y: c.data.map((d) => d.value),
        type: "bar",
        marker: { color: "#6366f1" },
        hoverinfo: "x+y",
      },
    ];
    break;

  case "pie":
    plotData = [
      {
        labels: c.data.map((d) => d.key),
        values: c.data.map((d) => d.value),
        type: "pie",
        hole: 0, // pie chart
        marker: {
          colors: [
            "#6366f1",
            "#f59e0b",
            "#10b981",
            "#ef4444",
            "#3b82f6",
            "#8b5cf6",
          ],
        },
        textinfo: "percent+label",
        hoverinfo: "label+value+percent",
      },
    ];
    break;

  case "donut":
    plotData = [
      {
        labels: c.data.map((d) => d.key),
        values: c.data.map((d) => d.value),
        type: "pie",
        hole: 0.4, // donut chart with hole
        marker: {
          colors: [
            "#6366f1",
            "#f59e0b",
            "#10b981",
            "#ef4444",
            "#3b82f6",
            "#8b5cf6",
          ],
        },
        textinfo: "percent+label",
        hoverinfo: "label+value+percent",
      },
    ];
    break;

  case "line":
    plotData = [
      {
        x: c.data.map((d) => d.x),
        y: c.data.map((d) => d.y),
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "#3b82f6" },
        line: { shape: "spline" },
        hoverinfo: "x+y",
      },
    ];
    break;

  case "scatter":
    plotData = [
      {
        x: c.data.map((d) => d.x),
        y: c.data.map((d) => d.y),
        mode: "markers",
        type: "scatter",
        marker: { size: 10, color: "#10b981", opacity: 0.8 },
        hoverinfo: "x+y",
      },
    ];
    break;

  case "bubble":
    plotData = [
      {
        x: c.data.map((d) => d.x),
        y: c.data.map((d) => d.y),
        mode: "markers",
        type: "scatter",
        marker: {
          size: c.data.map(() => c.size * 30 || 20), // or some scale
          color: "#f59e0b",
          sizemode: "area",
          opacity: 0.6,
        },
        hoverinfo: "x+y",
      },
    ];
    break;

  case "histogram":
    plotData = [
      {
        x: c.data,
        type: "histogram",
        marker: { color: "#f97316" },
        opacity: 0.8,
      },
    ];
    break;

  default:
    return (
      <div className="text-red-600 font-semibold">
        Unsupported chart type: {c.type}
      </div>
    );
}


   
    return (
      <div className="flex flex-col h-full">
        {/* Chart */}
        <Plot
          ref={plotRef}
          data={plotData}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{ width: "100%", height: "320px" }}
        />

        {/* Download Button */}
        <button
          onClick={exportPNG}
          className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans select-none max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          Data Insights Dashboard
        </h1>
        <p className="text-gray-600 max-w-xl">
          Summary statistics and visual insights from your dataset.
        </p>
      </header>

     {/* Summary + Health Score and Data Preview side-by-side */}
<section className="bg-white rounded-xl shadow-md p-6 mb-10 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[400px]">
  {/* Summary & Health Score - takes 1/3 width on large screens */}
  <div className="space-y-4 text-gray-700 text-sm md:text-base flex flex-col justify-between">
    {/* Summary Details */}
    <div className="space-y-2">
      <p><span className="font-semibold">Rows:</span> {summary.rows}</p>
      <p><span className="font-semibold">Columns:</span> {summary.columns}</p>
      <p><span className="font-semibold">Missing Values:</span> {summary.missing_total}</p>
      <p><span className="font-semibold">Duplicate Rows:</span> {summary.duplicates}</p>
      <p><span className="font-semibold">Memory Usage:</span> {summary.memory_mb} MB</p>
      <p><span className="font-semibold">Numeric Columns:</span> {summary.numeric_count}</p>
      <p><span className="font-semibold">Categorical Columns:</span> {summary.categorical_count}</p>
      <p><span className="font-semibold">Most Frequent Column:</span> {summary.most_frequent_column}</p>
      {summary.last_updated && (
        <p><span className="font-semibold">Last Updated:</span> {summary.last_updated}</p>
      )}
    </div>

    {/* Dataset Health Score */}
    <div className="mt-6">
      <p className="text-lg font-semibold text-gray-800 mb-2">Dataset Health Score</p>
      <p
        className={`text-5xl font-extrabold ${
          summary.health_score > 80
            ? "text-green-600"
            : summary.health_score > 50
            ? "text-yellow-600"
            : "text-red-600"
        }`}
      >
        {summary.health_score}%
      </p>
      <div className="w-full max-w-xs bg-gray-300 rounded-full h-6 overflow-hidden mt-4">
        <div
          className={`${healthColor} h-6 rounded-full transition-all duration-500`}
          style={{ width: `${summary.health_score}%` }}
        />
      </div>
      <p className="mt-3 text-gray-600 font-medium max-w-xs">
        {summary.health_score > 80
          ? "Excellent dataset quality"
          : summary.health_score > 50
          ? "Moderate dataset quality"
          : "Needs attention: Clean your data"}
      </p>
    </div>
  </div>

  {/* Data Preview - takes 2/3 width on large screens */}
<div className="col-span-1 lg:col-span-2 rounded-lg border border-gray-200 p-4">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
    <Table className="w-5 h-5 text-indigo-500" />
    Data Preview
  </h2>
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm border-collapse">
      <thead className="bg-indigo-50 sticky top-0 z-10">
        <tr>
          {Object.keys(data_preview[0] || {}).map((k) => (
            <th
              key={k}
              className="text-left px-4 py-3 font-semibold text-indigo-700 border-b"
            >
              {k}
            </th>
          ))}
        </tr>
      </thead>
    </table>
    {/* Scrollable tbody container with fixed height */}
    <div className="max-h-[400px] ">
      <table className="min-w-full text-sm border-collapse">
        <tbody className="divide-y divide-gray-100">
          {data_preview.slice(0, 20).map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-indigo-50 transition-colors duration-150"
            >
              {Object.values(row).map((v, i) => (
                <td
                  key={i}
                  className="px-4 py-2 text-gray-700 whitespace-nowrap"
                >
                  {String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>

</section>


      {/* Charts: 2 per row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {charts.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl shadow-md p-6 flex flex-col"
          >
            {renderChart(c)}
          </div>
        ))}
      </section>

      {/* Correlation Heatmap */}
      {corr_matrix && (
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Feature Correlation Heatmap
          </h2>
          <Plot
            data={[
              {
                z: corr_matrix.matrix,
                x: corr_matrix.columns,
                y: corr_matrix.columns,
                type: "heatmap",
                colorscale: "RdBu",
                reversescale: true,
                zmin: -1,
                zmax: 1,
                colorbar: { title: "Correlation" },
              },
            ]}
            layout={{
              autosize: true,
              margin: { t: 40, l: 60, r: 20, b: 40 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { family: "Inter, sans-serif" },
              title: "Feature Correlation Heatmap",
            }}
            style={{ width: "100%", height: "450px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </section>
      )}
    </div>
  );
}
