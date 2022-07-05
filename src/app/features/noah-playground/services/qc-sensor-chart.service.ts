import { Injectable, Input } from '@angular/core';
import { QcSensorType } from './qc-sensor.service';
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
      case 'humidity':
        return this._getHumChartOtps();
      case 'pressure':
        return this._getPressOtps();
      case 'temperature':
        return this._getTempOtps();
      default:
        return this._getFloodHeightOtps();
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

    const calendarDate = JSON.parse(localStorage.getItem('calendarDateTime'));
    const sortedCalendar = calendarDate.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });
    localStorage.setItem(
      'xValue',
      JSON.stringify(
        sortedCalendar.map((el) => new Date(el.received_at).getTime())
      )
    );

    const pointStart = sortedCalendar.map((el) =>
      new Date(el.received_at).getTime()
    );
    localStorage.setItem('pointStart', JSON.stringify(pointStart));
    //console.log('hahahah',data)
    // const processedData = calendarDate.map((el) => ({
    //   x: new Date(el.received_at).getTime(),
    //   y: el.distance_m,
    // }));

    //  X AXIS
    chart.xAxis[0].update({
      categories: sortedCalendar.map((el) =>
        new Date(el.received_at).getTime()
      ),
      labels: {
        format: '{value:%b:%e}',
      },
    });
    chart.xAxis[0].setExtremes(
      pointStart[pointStart.length - 30],
      pointStart[pointStart.length - 1],
      false
    );
    chart.redraw();

    // // Y AXIS
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
          sortedCalendar.map((el) => Number(el.distance_m)),
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
    const firstPoint = JSON.parse(localStorage.getItem('xValue'));
    const calendarDate = JSON.parse(localStorage.getItem('calendarDateTime'));
    // const sortedCalendar = calendarDate.sort((a: any, b: any) => {
    //   return (
    //     new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
    //   )
    // })
    // const processedData = calendarDate.map((el) => {
    //   return [
    //     sortedCalendar
    //     ,el.distance_m]
    // })
    // console.log(processedData)

    return {
      chart: {
        type: 'spline',
      },
      subtitle: {
        text: 'Flood Height',
      },
      rangeSelector: {
        selected: 0,
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
          //data: processedData,
          data: [],
          pointStart: new Date(firstPoint[0]).getTime(),
          pointInterval: 0.09 * 3600 * 1000, // 5mins day
          // lineWidth: 1.5,
          // marker: {
          //   enabled: false,
          // },
          // hover: {
          //   lineWidth: 5,
          // },
        },
      ],
    };
  }
  //FLOOD SENSORS END
}
