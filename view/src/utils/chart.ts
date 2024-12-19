import { TimeSeriesDailyRow } from "../context/db/db"

export type Series = number[][]

export const generateTimeDailySeries = (input: TimeSeriesDailyRow[]): Series => {
  return input.map((row, i) => [
    new Date(row.date).getTime(),
    Math.round(parseFloat(row["5. adjusted close"]) * 100) / 100
  ])
}
type Slider = {
  initial: null | number;
  prev: null | number;
}

type AnnotationType = 'buy' | 'sell'

const generateAnnotation = (slider: Slider, data: number[][], annotationType: AnnotationType): XAxisAnnotations => {
  const text = annotationType === 'sell' ? 'Sell' : 'Buy'
  const borderColor = annotationType === 'sell' ? '#FF3D3D' : '#B3F7CA'
  const backgroundColor = annotationType === 'sell' ? '#D50000' : '#00E396'
  let annotation: XAxisAnnotations = {
    x: data[slider.initial!!][0],
    fillColor: borderColor,
    opacity: 0.4,
    label: {
      borderColor: borderColor,
      style: {
        //fontSize: '10px',
        color: '#fff',
        background: backgroundColor,
      },
      offsetY: -10,
      text: text,
    }
  }
  if (slider.prev !== slider.initial) {
    annotation = {
      ...annotation,
      x2: data[slider.prev!!][0],
    }
  }
  slider.initial = null
  slider.prev = null
  return annotation
}

export const limitXAxis = (min: number, max: number): number[] => {
  const fiveYearsInMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
  return [min, Math.min(max, min + fiveYearsInMs)]
}

export const generateRSIannotations = (data: number[][], period: number): [ApexAnnotations, number] | null[] => {
  const rsiValues = []
  let gains: number[] = []
  let losses: number[] = []

  for (let i = 1; i < data.length; i++) {
    const change = data[i - 1][1] - data[i][1]
    if (change > 0) {
      gains = [...gains, change]
      losses = [...losses, Number.EPSILON]
    } else {
      gains = [...gains, Number.EPSILON]
      // invert loss since it'll be used as a denominator
      losses = [...losses, change]
    }
    if (i >= period) {
      const rsiIdx = i - period
      const avgGain = gains.slice(rsiIdx, i).reduce((sum, gain) => sum + gain, 0) / period
      const avgLoss = losses.slice(rsiIdx, i).reduce((sum, loss) => sum - loss, 0) / period
      const rs = avgGain / avgLoss
      rsiValues[rsiIdx] = 100 - (100 / (1 + rs))
    }

  }

  const annotations: XAxisAnnotations[] = []
  const buySlider: Slider = { initial: null, prev: null }
  const sellSlider: Slider = { initial: null, prev: null }

  for (let i = 0; i <= data.length - period; i++) {
    const value = rsiValues[i]
    if (value < 30) {
      if (sellSlider.initial !== null) {
        // record annotation
        annotations.push(generateAnnotation(sellSlider, data, 'sell'))
      }
      if (buySlider.prev === (i - 1)) buySlider.prev = i // slide
      if (buySlider.initial === null) {
        buySlider.initial = i
        buySlider.prev = i
      }
    } else if (value > 70) {
      if (buySlider.initial !== null) {
        // record annotation
        annotations.push(generateAnnotation(buySlider, data, 'buy'))
      }
      if (sellSlider.prev === (i - 1)) sellSlider.prev = i // slide
      if (sellSlider.initial === null) {
        sellSlider.initial = i
        sellSlider.prev = i
      }
    } else {
      if (buySlider.initial !== null) annotations.push(generateAnnotation(buySlider, data, 'buy'))
      if (sellSlider.initial !== null) annotations.push(generateAnnotation(sellSlider, data, 'sell'))
    }
  }

  if (buySlider.initial !== null) annotations.push(generateAnnotation(buySlider, data, 'buy'))
  if (sellSlider.initial !== null) annotations.push(generateAnnotation(sellSlider, data, 'sell'))
  if (annotations.length > 0) {
    return [{
      xaxis: annotations
    }, rsiValues[0]]
  } else {
    return [null, null]
  }
}
