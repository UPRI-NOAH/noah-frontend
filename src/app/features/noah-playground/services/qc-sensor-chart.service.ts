import { Injectable, Input } from '@angular/core';
import { QuezonCitySensorType } from '../store/noah-playground.store';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
import { first } from 'rxjs/operators';
export type QCSensorChartOpts = {
  data: any;
  qcSensorType: QuezonCitySensorType;
};

@Injectable({
  providedIn: 'root',
})
export class QcSensorChartService {
  pk: number;
  constructor(private qcSensorService: QcSensorService) {}
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
    }

    const calendarDate = JSON.parse(localStorage.getItem('calendarDateTime'));
    const sortedCalendar = calendarDate.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });
    const processedData = calendarDate.map((el) => {
      return [new Date(el.received_at).getTime(), el.distance_m];
    });
    const processedRainData = calendarDate.map((el) => {
      return [new Date(el.received_at).getTime(), el.rain_accu];
    });

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });

    // chart.xAxis[0].update(
    //   {
    //     categories: sortedData.map((d) => d.dateTimeRead),
    //     tickInterval: 5,
    //   },
    //   true
    // );

    // chart.xAxis[0].update({
    //   categories: processedData,
    //   type: 'datetime',
    //   labels: {
    //     format: '{value:%b:%e:%H:%M}',
    //   },
    // });
    // set X axis
    switch (qcSensorType) {
      case 'flood':
        chart.xAxis[0].update({
          categories: processedData,
          type: 'datetime',
          labels: {
            format: '{value:%b:%e:%H:%M}',
          },
        });
        break;
      default:
        chart.xAxis[0].update({
          categories: calendarDate.map((d) => d.dateTimeRead),
          type: 'datetime',
          labels: {
            format: '{value:%b:%e:%H:%M}',
          },
        });
        break;
    }
    // set Y axis
    switch (qcSensorType) {
      case 'flood':
        chart.series[0].setData(processedData), true;
        break;
      default:
        chart.series[0].setData(
          sortedData.map((d) => Number(d.rain_accu)),
          true
        );
        break;
    }
  }

  private _getRaintps(): any {
    return {
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        plotBands: [
          {
            from: 0,
            to: 2.5,
            color: '#4ac6ff',
            label: {
              text: 'Light',
              // style: {
              //   color: 'black'
              // }
            },
          },
          {
            from: 2.5,
            to: 7.5,
            // color: 'blue',
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
            // color: 'dark blue',
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
            // color: 'orange',
            color: '#fcba03',
            label: {
              text: 'Intense',
              style: {
                color: 'black',
              },
            },
          },

          {
            from: 30,
            to: 500,
            // color: 'red',
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
          name: 'Rainfall',
          // type: "xrange",
          data: [],
        },
      ],
    };
  }
  //FLOOD SENSORS
  private _getFloodHeightOtps(): any {
    const calendarDate = JSON.parse(localStorage.getItem('calendarDateTime'));
    const sortedCalendar = calendarDate.sort((a: any, b: any) => {
      return (
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
    });
    const processedData = calendarDate.map((el) => {
      return [new Date(el.received_at).getTime(), el.distance_m];
    });

    return {
      chart: {
        type: 'spline',
      },
      subtitle: {
        text: 'Flood Height',
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%b:%e:%H:%M}',
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
          data: [],
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
