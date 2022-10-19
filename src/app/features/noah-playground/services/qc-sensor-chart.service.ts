import { Injectable, Input } from '@angular/core';
import { QuezonCitySensorType } from '../store/noah-playground.store';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
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
      case 'distance_m':
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

    // Y axis data for flood height
    const processedData = calendarDate.map((el) => {
      return [new Date(el.received_at).getTime(), el.distance_m];
    });

    // Y axis data for rainfall
    const RainProcessedData = calendarDate.map((el) => {
      return [new Date(el.received_at).getTime(), el.rain_accu];
    });

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.dateTimeRead).getTime() - new Date(b.dateTimeRead).getTime()
      );
    });

    chart.xAxis[0].update({
      categories: processedData,
      type: 'datetime',
      labels: {
        format: '{value:%b:%e:%H:%M}',
      },
    });
    // set Y axis
    switch (qcSensorType) {
      case 'distance_m':
        chart.series[0].setData(processedData), true;
        break;
      case 'rain_accu':
        chart.series[0].setData(RainProcessedData), true;
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
      subtitle: {
        text: 'Rainfall',
      },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        opposite: false,
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
          name: 'Rainfall',
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
          align: 'left',
        },
      },
      yAxis: {
        title: {
          text: 'Meters (m)',
        },
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        opposite: false,
        plotBands: [
          {
            from: 0,
            to: 0.5,
            color: '#F2C94C',
            label: {
              text: 'Low',
            },
          },
          {
            from: 0.51,
            to: 1.5,
            color: '#F2994A',
            label: {
              text: 'Moderate',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 1.51,
            to: 15,
            color: '#EB5757',
            label: {
              text: 'High',
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
