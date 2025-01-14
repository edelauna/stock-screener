import { ApexOptions } from 'apexcharts';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { generateRSIannotations, generateTimeDailySeries, limitXAxis } from '../utils/chart';
import { format, addMinutes } from 'date-fns';
import {store as symbolStore} from '../context/symbol-search/symbol-search.provider'
import { formattedDate } from '../utils/date';
import { useTimeSeriesDaily } from '../hooks/use-time-series-daily/use-time-series-daily';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

type AxisRange = {
  min: number;
  max: number
}

type ApexContextDataPartial = {
  twoDSeries: number[]
  twoDSeriesX: number[]
}

type ApexContextPartial = {
  data: ApexContextDataPartial
}

export const Chart: React.FC = () => {
  const {state: symbolState} = useContext(symbolStore)

  const input = symbolState.activeSymbol['2. name']
  const inputSymbol = symbolState.activeSymbol['1. symbol']
  const {data, metadata, loading} = useTimeSeriesDaily()
  const ticker = metadata['2. Symbol']
  const [series, setSeriees] = useState<ApexAxisChartSeries>([{name: input, data:[[]]}])
  const [yAxisRange, setYAxisRange] = useState<AxisRange>({
    min: 200,
    max: 300,
  });
  // 90 day look back
  const [today] = useState(new Date())
  const [lookBackWindowDays] = useState(90)
  const [xAxisRange, setXAxisRange] = useState<AxisRange>({
    min: new Date().setDate(today.getDate() - lookBackWindowDays),
    max: today.getTime(),
  });
  const [xAxisRangeBrush, setXAxisRangeBrush] = useState<AxisRange>(xAxisRange);
  const [rsiPeriod] = useState(7) // maybe make this interactive in future
  const [xAnnotation, setXAnnotations] = useState<ApexAnnotations | null>(null)
  const [indicator, setIndicator] = useState({price: 0.00, rsi: 50, date: today})
  const [indicatorLoading, setIndicatorLoading] = useState(true)

  const updateYAxisRange = useCallback((ctx: ApexContextPartial, {xaxis}: ApexOptions, setter: (value: React.SetStateAction<AxisRange>) => void) => {
    const [minDate, maxDate] = limitXAxis(xaxis?.min!!, xaxis?.max!!)
    setter({ min: minDate, max: maxDate })

    const { twoDSeriesX, twoDSeries } = ctx.data
    if(twoDSeriesX.length !== twoDSeries.length) return
    const twoDArray = twoDSeriesX.map((xValue, index) => [xValue, twoDSeries[index]]);
    twoDArray.sort((a, b) => b[0] - a[0]);
    const indicesForRSIRetrieval = []

    for(let i = 0; i < twoDArray.length && indicesForRSIRetrieval.length < rsiPeriod; i++){
      const x = twoDArray[i][0]
      if(x <= minDate) indicesForRSIRetrieval.push(i)
    }
    const filteredData: number[][] = []
    twoDArray.forEach(([x,_y], i) => {
      if(x >= minDate && x <= maxDate)
        filteredData.push(twoDArray[i])
    });
    // add additional records for rsi calculations
    for(let i = 0 ; i < Math.min(rsiPeriod, indicesForRSIRetrieval.length); i++){
      const indexToRetrieve = indicesForRSIRetrieval[i]
      filteredData.push(twoDArray[indexToRetrieve])
    }

    // todo: optimize to just process the view window - then continue remainder
    const [annotations, lastRSI] = generateRSIannotations(filteredData, rsiPeriod)
    if(annotations) setXAnnotations(annotations)
    if(lastRSI) {
      setIndicator({price: filteredData[0][1], rsi: lastRSI, date: new Date(filteredData[0][0])})
      setIndicatorLoading(false)
    }

    // Calculate the new min and max for the Y-axis - ignoring the additional records
    const yValues = filteredData.slice(0, -rsiPeriod).map(item => item[1]);
    const newMin = Math.floor(Math.min(...yValues));
    const newMax = Math.ceil(Math.max(...yValues));
    setYAxisRange({ min: newMin, max: newMax });
  }, [rsiPeriod]);

  useEffect(() => {
    if(!loading && ticker === inputSymbol){
      if(data.length > 0){
        const generatedData = generateTimeDailySeries(data).reverse()
        setSeriees([{
          name: input,
          data: generatedData
        }])
      } else {
        setSeriees([{name: input, data:[[]]}])
      }
    } else {
      setIndicatorLoading(true)
    }
  }, [loading, data, input, ticker, inputSymbol])


  const [options, setOptions] = useState<ApexOptions>({
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
      zoom: {
        enabled: true
      },
      events: {
        //selection: (ctx,opts) => updateYAxisRange(ctx, opts),
        zoomed: (ctx,opts) => updateYAxisRange(ctx, opts, setXAxisRangeBrush),
        scrolled: (ctx,opts) => updateYAxisRange(ctx, opts, setXAxisRangeBrush)
      },
    },
    colors: ['#008FFB', '#008FFB'],
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
    yaxis: {
      seriesName: input,
      axisTicks: {
        show: true,
      },
      labels: {
        style: {
          colors: ['#6B7280']
        }
      },
      axisBorder: {
        show: true,
      },
      title: {
        text: input,
        style: {
          color: '#008FFB',
        },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: true,
        style: {
          colors: '#6B7280'
        }
      },
      tooltip: {
        formatter: (value, opts) => {
          const date = new Date(value)
          // format localizes the date when the time doesn't actually matter
          return format(addMinutes(date, date.getTimezoneOffset()), "eee dd MMM ''yy")}
      },
    },
  });
  useEffect(() => {
    setOptions(o => {
      let newOptions: ApexOptions = {
      ...o,
      yaxis: {
        ...o.yaxis,
        seriesName: input,
        title: {
          text: input,
          style: {
            color: '#008FFB',
          },
        },
        min: yAxisRange.min,
        max: yAxisRange.max,
      },
    }
    if(xAnnotation){
      newOptions = {
        ...newOptions,
        annotations: xAnnotation
      }
    } else {
      if('annotations' in newOptions){
        delete newOptions.annotations
      }
    }
    return newOptions
  })
  }, [yAxisRange, input, xAnnotation])
  const [optionsLine, setOptionsLine] = useState<ApexOptions>({
    chart: {
      id: 'chart1',
      height: 130,
      type: 'area',
      brush: {
        //target: 'chart2',
        enabled: true,
      },
      selection: {
        enabled: true,
      },
      events: {
        selection: (ctx,opts) => {
          const originalMax = opts.xaxis?.max
          const [min, max] = limitXAxis(opts.xaxis?.min ?? 0, opts.xaxis?.max ?? 0)
          if(originalMax > max){
            setXAxisRangeBrush({min, max})
            return
          }
          updateYAxisRange(ctx, opts, setXAxisRange)
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
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    }
  });

  useEffect(() => {
    setOptions(o => ({
      ...o,
      xaxis: {
        ...o.xaxis,
        min: xAxisRange.min,
        max: xAxisRange.max
      }
    }))
  }, [xAxisRange])
  useEffect(() =>
    setOptionsLine(o => ({
      ...o,
      chart: {
        ...o.chart,
        selection: {
          ...o.chart?.selection,
          xaxis: {
            min: xAxisRangeBrush.min,
            max: xAxisRangeBrush.max
          }
        }
      }
    })), [xAxisRangeBrush])


  const Indicator = () => {
    if(indicator.rsi > 70){
      return           <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-3 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300 mb-2">
      <span className="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
        Sell
      </span>
    } else if(indicator.rsi < 30) {
      return <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-3 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 mb-2">
        <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
          Buy
        </span>
    } else {
      return <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-3 py-0.5 rounded-full dark:bg-gray-900 dark:text-gray-300 mb-2">
        <span className="w-2 h-2 me-1 bg-gray-500 rounded-full"></span>
          Hold
        </span>
    }
  }

  const formattedDateString = formattedDate(indicator.date, 'UTC');
  // Split the string by '-' to get year, month, and day
  const [year, month, day] = formattedDateString.split('-');

  // Compare with today's date
  const isNotToday = 
    !(parseInt(day, 10) === today.getDate() && 
      parseInt(month, 10) - 1 === today.getMonth() && // Month in JavaScript is 0-indexed
      parseInt(year, 10) === today.getFullYear());

  return (
    <div className="w-full h-100">
      {indicatorLoading ? <div data-testid="loading-indicator" className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>:
        <div className="flex items-baseline">
          <Indicator />
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Price: {indicator.price} {symbolState.activeSymbol['8. currency']}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            as of: {formattedDateString}
          </span>
          {isNotToday && <div className="group relative flex">
            <ExclamationCircleIcon className='block size-5 text-yellow-500 hover:text-yellow-600'/>
            <span className="absolute bottom-10 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">End of Day Quote</span>
          </div>
          }
      </div>
      }
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
