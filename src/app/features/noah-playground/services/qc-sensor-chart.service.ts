import { Injectable, Input } from '@angular/core';
import { QcSensorType } from './qc-sensor.service';
import Highcharts from 'highcharts/highstock';

export type QCSensorChartOpts = {
  data: any;
  qcSensorType: QcSensorType;
};

@Injectable({
  providedIn: 'root',
})
export class QcSensorChartService {
  constructor() {}

  getQcChartOpts(qcSensorType: QcSensorType) {
    switch (qcSensorType) {
      case 'distance_m':
        return this._getFloodHeightOtps();
      case 'humidity':
        return this._getHumChartOtps();
      case 'pressure':
        return this._getPressOtps();
      default:
        return this._getTempOtps();
    }
  }

  qcShowChart(chart: Highcharts.Chart, payload: QCSensorChartOpts) {
    const { data, qcSensorType } = payload;

    if (!data || !data?.length) {
      chart.showLoading('No Data Available');
    }

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });

    const getDateTime: any = data.map(
      (d) => (d.received_at = new Date().getTime())
    );
    console.log('Whole number date', payload);
    localStorage.setItem('dateDateTime', JSON.stringify(data));

    // X AXIS
    chart.xAxis[0].update(
      {
        categories: getDateTime,
        tickInterval: 7, //x axis display
        labels: {
          format: '{value:%b-%e-%Y-%H:%M}',
        },
      },
      true
    );
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
    const calendarDate = JSON.parse(localStorage.getItem('calendarDateTime'));
    const processedData = calendarDate.map((el) => ({
      x: new Date(el.received_at).getTime(),
      y: el.distance_m,
    }));
    return {
      chart: { type: 'spline' },
      xAxis: {
        labels: {
          format: '%b %e, %Y %H:%M',
        },
      },
      subtitle: {
        text: 'Flood Height',
      },
      rangeSelector: {
        inputDateFormat: '%b %e, %Y %H:%M',
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
        opposite: false,
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
          data: processedData,
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
