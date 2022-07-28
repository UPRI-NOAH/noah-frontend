import { Injectable } from '@angular/core';
import { QcSensorType } from './qc-sensor.service';
import Highcharts from 'highcharts/highstock';
import HC_exporting from 'highcharts/modules/exporting';
HC_exporting(Highcharts);

export type QCSensorChartOpts = {
  data: any;
  qcSensorType: QcSensorType;
};
@Injectable({
  providedIn: 'root',
})
export class QcSensorChartService {
  Highcharts: typeof Highcharts = Highcharts;

  constructor() {}
  getQcChartOpts(qcSensorType: QcSensorType) {
    switch (qcSensorType) {
      case 'temperature':
        return this._getTempOtps();
      case 'humidity':
        return this._getHumChartOtps();
      case 'pressure':
        return this._getPressOtps();
      default:
        return this._getFloodHeightOtps();
    }
  }

  qcShowChart(chart: Highcharts.StockChart, payload: QCSensorChartOpts) {
    const { data, qcSensorType } = payload;

    if (!data || !data?.length) {
      chart.showLoading('No Data Available');
    }

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });

    // X AXIS
    chart.xAxis[0].update(
      {
        categories: sortedData.map((d) => d.received_at),
        tickInterval: 6, //x axis display
        type: 'datetime',
        labels: {
          format: '{value:%a %d %b}',
        },
      },
      true
    );
    // Y AXIS
    switch (qcSensorType) {
      case 'humidity':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.hum_rh)),
          true
        );
        break;
      case 'pressure':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.pres_hpa)),
          true
        );
        break;
      case 'temperature':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.temp_c)),
          true
        );
        break;
      default:
        chart.series[0].setData(
          sortedData.map((d) => Number(d.distance_m)),
          true
        );
        break;
    }
  }
  private _getHumChartOtps(): any {
    return {
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        plotBands: [
          {
            from: 0,
            to: 2.5,
            color: '#DB1F48',
            label: {},
          },
          {
            from: 2.5,
            to: 7.5,
            color: '#0073ff',
            label: {
              text: 'Moderate',
              style: {
                color: 'white',
              },
            },
          },
          {
            from: 7.5,
            to: 15,
            color: '#0011ad',
            label: {
              text: 'Heavy',
              style: {
                color: 'white',
              },
            },
          },
          {
            from: 15,
            to: 30,
            color: '#ffa500',
            label: {
              style: {
                color: 'black',
              },
            },
          },

          {
            from: 30,
            to: 500,
            color: '#fc3d03',
            label: {
              text: 'Torrential',
              style: {
                color: 'black',
              },
            },
          },
        ],
      },
      series: [
        {
          color: '#FF8300',
          name: 'Humidity',
          data: [],
        },
      ],
    };
  }
  private _getPressOtps(): any {
    return {
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        plotBands: [
          {
            from: 0,
            to: 2.5,
            color: '#4ac6ff',
            label: {
              text: 'Light',
            },
          },
          {
            from: 2.5,
            to: 7.5,
            color: '#FF8300',
            label: {
              text: 'Moderate',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 7.5,
            to: 15,
            color: '#FF8300',
            label: {
              text: 'Heavy',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 15,
            to: 30,
            color: '#FF8300',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },

          {
            from: 30,
            to: 500,
            color: '#FF8300',
            label: {
              text: 'Torrential',
              style: {
                color: '#0C2D48',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Air Pressure',
          color: '#0C2D48',
          data: [],
        },
      ],
    };
  }

  private _getTempOtps(): any {
    return {
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        plotBands: [
          {
            from: 0,
            to: 2.5,
            color: '#4ac6ff',
            label: {
              text: 'Light',
            },
          },
          {
            from: 2.5,
            to: 7.5,
            color: '#FF8300',
            label: {
              text: 'Moderate',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 7.5,
            to: 15,
            color: '#FF8300',
            label: {
              text: 'Heavy',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 15,
            to: 30,
            color: '#FF8300',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },

          {
            from: 30,
            to: 500,
            color: '#FF8300',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Temperature',
          color: '#0C2D48',
          data: [],
        },
      ],
    };
  }
  //FLOOD SENSORS
  private _getFloodHeightOtps(): any {
    return {
      chart: { type: 'spline' },
      rangeSelector: {
        enabled: true,
        allButtonsEnabled: true,
        buttons: [
          {
            type: 'day',
            count: 1,
            text: '1d',
          },
          {
            type: 'month',
            count: 1,
            text: '1m',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
        buttonTheme: {
          width: 60,
        },
      },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        plotBands: [
          {
            from: 0,
            to: 0.5,
            color: '',
            label: {
              text: 'Low',
            },
          },
          {
            from: 0.6,
            to: 1.5,
            color: '#6AF2F0',
            label: {
              text: 'Moderate',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 1.6,
            to: 15,
            color: '#004369',
            label: {
              text: 'High',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 15,
            to: 30,
            color: '#0067B3',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },

          {
            from: 30,
            to: 500,
            color: '#0067B3',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Flood Height',
          color: '#0C2D48',
          data: [].map(function (point) {
            return [new Date(point[0].getTime(), point[1])];
          }),
          pointStart: Date.UTC(2022, 4, 10),
          pointInterval: 24 * 3600 * 1000,
          lineWidth: 1.5,
          marker: {
            enabled: false,
          },
          hover: {
            lineWidth: 5,
          },
        },
      ],
    };
  }
  //FLOOD SENSORS END
}
