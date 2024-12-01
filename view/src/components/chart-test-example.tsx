import { ApexOptions } from 'apexcharts';
import React, { useEffect, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

// Function to generate random time series data
const generateDayWiseTimeSeries = (baseval: number, count:number, yrange:{max: number, min: number}) => {
  let series = [];
  for (let i = 0; i < count; i++) {
    let x = baseval;
    let y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
    series.push([x, y]);
    baseval += 86400000; // Incrementing by one day
  }
  return series;
};
export const ChartTEST: React.FC = () => {
    const [chart2Loaded, setChart2Loaded] = useState(false)
    console.log(`chart2Loaded:${chart2Loaded}`)
    const data1 = generateDayWiseTimeSeries(new Date("11 Feb 2017").getTime(), 185, {
      min: 30,
      max: 90
  })
    const data2 = generateDayWiseTimeSeries(new Date("11 Feb 2017").getTime(), 185, {
      min: 30,
      max: 90
  })
    const [series] = useState([
      {
        name: 'Flies',
        data: data1,
      },
      // {
      //   name: 'Spiders',
      //   data: data2,
      // },
    ]);
  
    const [options] = useState<ApexOptions>({
      chart: {
        id: 'chart2',
        type: 'line',
        height: 230,
        dropShadow: {
          enabled: true,
          enabledOnSeries: [1],
        },
        toolbar: {
          autoSelected: 'pan',
          show: false,
        },
        events: {
          mounted: () => setChart2Loaded(true)
        }
      },
      colors: ['#008FFB', '#00E396'],
      // stroke: {
      //   width: 3,
      // },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: [2, 6],
        curve: ['straight', 'monotoneCubic'],
      },
      fill: {
        opacity: [1, 0.75],
      },
      markers: {
        size: 0,
      },
      // yaxis: [
      //   {
      //     seriesName: 'Flies',
      //     axisTicks: {
      //       show: true,
      //       color: '#008FFB',
      //     },
      //     axisBorder: {
      //       show: true,
      //       color: '#008FFB',
      //     },
      //     labels: {
      //       style: {
      //         colors: '#008FFB',
      //       },
      //     },
      //     title: {
      //       text: 'Flies',
      //       style: {
      //         color: '#008FFB',
      //       },
      //     },
      //   },
      //   {
      //     seriesName: 'Spiders',
      //     opposite: true,
      //     axisTicks: {
      //       show: true,
      //       color: '#00E396',
      //     },
      //     axisBorder: {
      //       show: true,
      //       color: '#00E396',
      //     },
      //     labels: {
      //       style: {
      //         colors: '#00E396',
      //       },
      //     },
      //     title: {
      //       text: 'Spiders',
      //       style: {
      //         color: '#00E396',
      //       },
      //     },
      //   },
      // ],
      xaxis: {
        type: 'datetime',
      },
    });
  
    const [seriesLine] = useState([
      {
        name: 'Flies',
        data: data1,
      },
      {
        name: 'Spiders',
        data: data2,
      },
    ]);
  
    const [optionsLine] = useState<ApexOptions>({
      chart: {
        id: 'chart1',
        height: 130,
        type: 'area',
        brush: {
          target: 'chart2',
          enabled: true,
        },
        selection: {
          enabled: true,
          xaxis: {
            min: new Date('24 April 2017').getTime(),
            max: new Date('29 May 2017').getTime(),
          },
        },
      },
      colors: ['#008FFB', '#00E396'],
      stroke: {
        width: [1, 3],
        curve: ['straight', 'monotoneCubic'],
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.91,
          opacityTo: 0.1,
        },
      },
      xaxis: {
        type: 'datetime',
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        max: 100,
        tickAmount: 2,
      },
    });

  return (
    <div className="w-full h-80">
      <div id="wrapper">
        <div id="chart2">
          <ReactApexChart options={options} series={series} type="line" height={230} />
        </div>
        <div id="chart1">
          <ReactApexChart options={optionsLine} series={series} type="area" height={130} />
        </div>
      </div>
      <div id="html-dist"></div>
    </div>
  );

};