import { Injectable } from '@angular/core';
import { QuezonCitySensorType } from '../store/noah-playground.store';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
import * as Highcharts from 'highcharts';

export type QCSensorChartOpts = {
  data: any;
  qcSensorType: QuezonCitySensorType;
};
@Injectable({
  providedIn: 'root',
})
export class QcSensorChartService {
  constructor() {}
  getQcChartOpts(qcSensorType: QuezonCitySensorType) {
    switch (qcSensorType) {
      case 'flood':
        return this._getFloodHeightOtps();
      default:
        return this._getRaintps();
    }
  }

  qcShowChart(chart: Highcharts.Chart, payload: QCSensorChartOpts) {
    const { data, qcSensorType } = payload;

    if (!data || !data?.length) {
      chart.showLoading('No Data Available');
      return;
    }

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });

    const valueFloodaxis = data.map((el) => {
      return [new Date(el.received_at).getTime(), el.distance_m];
    });

    const timestamps = sortedData.map((d) => new Date(d.received_at).getTime());

    const valueRainAxisAcc = data.map((el) => {
      return [new Date(el.received_at).getTime(), el.rain_accu_1hour];
    });

    // Set X axis
    chart.xAxis[0].update({
      type: 'datetime',
      categories: timestamps,
      labels: {
        format: '{value:%b %e %H:%M}',
      },
    });

    // Set Y axis
    switch (qcSensorType) {
      case 'flood':
        chart.series[0].setData(valueFloodaxis, true);
        break;
      case 'rain':
        chart.series[0].setData(valueRainAxisAcc, true);
        break;
    }

    //HIGHCHARTS CONFIGURATIONS
    // Calculate the minimum and maximum timestamps
    const minTimestamp = timestamps[0];
    const maxTimestamp = timestamps[timestamps.length - 1];

    // Calculate the range in milliseconds
    const range = maxTimestamp - minTimestamp;

    // Calculate the range in seconds
    const rangeInSeconds = Math.floor(range / 1000);

    // Update the rangeSelector options
    chart.update({
      rangeSelector: {
        buttons: [
          {
            type: 'day',
            count: 1,
            text: '1 Day',
          },
          {
            type: 'month',
            count: 1,
            text: '1 Month',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
        buttonTheme: {
          width: 60,
        },
        selected: 0, // default selected range (1 day)
      },
    });

    // Update the visible range on the x-axis based on the rangeInSeconds
    if (rangeInSeconds <= 86400) {
      chart.xAxis[0].setExtremes(maxTimestamp - 86400000, maxTimestamp);
    }
  }

  private _getRaintps(): any {
    return {
      chart: {
        type: 'spline',
      },
      subtitle: {
        text: 'Rain Gauge',
      },
      legend: {
        enabled: true,
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%b %e %H:%M}',
        },
      },
      yAxis: {
        title: {
          text: '1 Hour Rain Accumulated Data (mm)',
        },
        alignTicks: false,
        tickInterval: 0.1,
        color: '#298bdb',
        opposite: false,
      },
      rangeSelector: {
        enabled: true,
        inputDateFormat: '%b %e, %Y',
        buttons: [
          {
            type: 'day',
            count: 1,
            text: '1 Day',
          },
          {
            type: 'month',
            count: 1,
            text: '1 Month',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
        buttonTheme: {
          width: 60,
        },
        inputEnabled: true,
        selected: 2, // Set initial range to the last 24 hours
      },
      series: [
        {
          name: 'Rainfall (mm/hr)',
          color: '#298bdb',
          data: [],
          lineWidth: 1.5,
          boost: {
            useGPUTranslations: true,
          },
          marker: {
            enabled: false,
          },
          hover: {
            lineWidth: 5,
          },
          tooltip: {
            headerFormat:
              '<span style="font-size: 14px">{point.key}</span><br/>',
            valueSuffix: 'mm',
            shared: false,
            xDateFormat: '',
            valueDecimal: 2,
            pointFormat:
              '<span style="font-size: 14px">Rainfall: {point.y:.2f}mm/hr</span>',
          },
        },
      ],
    };
  }

  //FLOOD SENSORS
  private _getFloodHeightOtps(): any {
    return {
      chart: {
        type: 'spline',
      },
      subtitle: {
        text: 'Flood Sensor',
      },
      legend: {
        enabled: true,
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%b:%e:%H:%M}',
          align: 'left',
        },
      },
      yAxis: {
        title: {
          text: 'Flood Depth in Meters (m)',
        },
        alignTicks: false,
        color: '#0a59f7',
        opposite: false,
        plotBands: [
          // {
          //   from: 0,
          //   to: 0.5,
          //   color: '#F2C94C',
          //   label: {
          //     text: 'Low (0 - 0.5m)',
          //     style: {
          //       color: '#0C2D48',
          //     },
          //   },
          // },
          // {
          //   from: 0.5,
          //   to: 1.5,
          //   color: '#F2994A',
          //   label: {
          //     text: 'Moderate (0.5m - 1.5m)',
          //     style: {
          //       color: '#0C2D48',
          //     },
          //   },
          // },
          // {
          //   from: 1.5,
          //   to: 15,
          //   color: '#EB5757',
          //   label: {
          //     text: 'High (> 1.5m)',
          //     style: {
          //       color: '#0C2D48',
          //     },
          //   },
          // },
          {
            from: 0,
            to: 0.1,
            color: '#A9A9A9',
            label: {
              text: 'Ankle Level (0 - 0.1m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.1,
            to: 0.201,
            color: '#9f9a34',
            label: {
              text: 'Gutter Level (0.1m - 0.201m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.201,
            to: 0.255,
            color: '#9f9a34',
            label: {
              text: 'Half Knee Level (0.201m - 0.255m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.255,
            to: 0.331,
            color: '#020296',
            label: {
              text: 'Half Tire Level (0.255m - 0.331m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.331,
            to: 0.484,
            color: '#020296',
            label: {
              text: 'Knee Level (0.331m - 0.484m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.484,
            to: 0.661,
            color: '#b20000',
            label: {
              text: 'Tire Level (0.484m - 0.661m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.661,
            to: 0.941,
            color: '#b20000',
            label: {
              text: 'Waist Level (0.661m - 0.941m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
          {
            from: 0.941,
            to: 1.144,
            color: '#b20000',
            label: {
              text: 'Chest Level (0.9411m - 1.144m)',
              style: {
                color: '#FFFFFF',
              },
            },
          },
        ],
      },
      rangeSelector: {
        enabled: true,
        inputDateFormat: '%b %e, %Y',
        buttons: [
          {
            type: 'day',
            count: 1,
            text: '1 Day',
          },
          {
            type: 'month',
            count: 1,
            text: '1 Month',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
        buttonTheme: {
          width: 60,
        },
        inputEnabled: true,
        selected: 2, // Set initial range to the last 24 hours
      },
      series: [
        {
          name: 'Flood Depth (m)',
          color: '#0a59f7',
          data: [],
          lineWidth: 1.5,
          marker: {
            enabled: false,
          },
          hover: {
            lineWidth: 5,
          },
          tooltip: {
            headerFormat:
              '<span style="font-size: 14px">{point.key}</span><br/>',
            shared: false,
            valueSuffix: 'm',
            xDateFormat: '',
            valueDecimal: 2,
            pointFormat:
              '<span style="font-size: 14px">Flood Depth: {point.y:.2f}m</span>',
          },
        },
      ],
    };
  }
  //FLOOD SENSORS END
}
