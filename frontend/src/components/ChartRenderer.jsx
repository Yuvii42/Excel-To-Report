import React, { useRef } from 'react';
import ReactECharts from 'echarts-for-react';

function lineOption(chart) {
  return {
    title: { text: chart.title },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: chart.data.map(d => d.x) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: chart.data.map(d => d.y), smooth: true }]
  };
}

function barOption(chart) {
  return {
    title: { text: chart.title },
    tooltip: {},
    xAxis: { type: 'category', data: chart.data.map(d => d.category) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: chart.data.map(d => d.value) }]
  };
}

function pieOption(chart) {
  return {
    title: { text: chart.title },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: chart.data.map(d => ({ name: d.key || d.category, value: d.value }))
    }]
  };
}

function donutOption(chart) {
  return {
    title: { text: chart.title },
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'], // Inner + outer radius
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'inside', formatter: '{d}%' },
      labelLine: { show: false },
      data: chart.data.map(d => ({ name: d.key || d.category, value: d.value }))
    }]
  };
}

function scatterOption(chart) {
  return {
    title: { text: chart.title },
    tooltip: {},
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [{
      type: 'scatter',
      data: chart.data.map(d => [d.x, d.y])
    }]
  };
}

export default function ChartRenderer({ chart }) {
  const ref = useRef();

  const exportPNG = () => {
    const echartsInstance = ref.current.getEchartsInstance();
    const url = echartsInstance.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chart.id}.png`;
    link.click();
  };

  let option;
  if (chart.type === 'line') option = lineOption(chart);
  else if (chart.type === 'bar') option = barOption(chart);
  else if (chart.type === 'pie') option = pieOption(chart);
  else if (chart.type === 'donut') option = donutOption(chart);
  else if (chart.type === 'scatter') option = scatterOption(chart);
  else option = { title: { text: chart.title }, series: [] };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{chart.title}</h3>
        <div className="flex gap-2">
          <button onClick={exportPNG} className="px-2 py-1 border rounded text-sm">Export PNG</button>
        </div>
      </div>
      <ReactECharts
        ref={ref}
        option={option}
        style={{ height: 320, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
