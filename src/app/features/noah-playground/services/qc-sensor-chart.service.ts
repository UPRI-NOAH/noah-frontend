import { Injectable } from '@angular/core';
import { QuezonCitySensorType } from '../store/noah-playground.store';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
import * as Highcharts from 'highcharts';
export type QCSensorChartOpts = {
  data: any;
  pk: number;
  qcSensorType: QuezonCitySensorType;
};

@Injectable({
  providedIn: 'root',
})
export class QcSensorChartService {
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
    const { pk, qcSensorType } = payload;

    this.qcSensorService.getQcSensorData(pk, Infinity).subscribe((data) => {
      if (!data || !data.length) {
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

      //reserved for rain accu data
      // const valueRainAxis = data.map((el) => {
      //   return [new Date(el.received_at).getTime(), el.rain_accu];
      // });

      const valueRainAxisAcc = data.map((el) => {
        return [new Date(el.received_at).getTime(), el.rain_accu_1hour];
      });

      // set X axis
      chart.xAxis[0].update({
        type: 'datetime',
        labels: {
          format: '{value:%b %e %H:%M}',
        },
      });

      // set Y axis
      switch (qcSensorType) {
        case 'flood':
          chart.series[0].setData(valueFloodaxis, true);
          break;
        case 'rain':
          chart.series[0].setData(valueRainAxisAcc, true);
          break;
      }
    });
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
      // xAxis: {
      //   type: 'datetime',
      //   labels: {
      //     format: '{value:%b:%e:%H:%M}',
      //     align: 'left',
      //   },
      // },
      yAxis: {
        title: {
          text: '1 Hour Rain Accumulated Data (mm)',
        },
        alignTicks: false,
        tickInterval: 0.1,
        color: '#298bdb',
        opposite: false,
        // plotBands: [
        //   {
        //     from: 0,
        //     to: 2.5,
        //     color: '#4ac6ff',
        //     label: {
        //       text: 'Light',
        //       style: {
        //         color: '#0C2D48',
        //       },
        //     },
        //   },
        //   {
        //     from: 2.5,
        //     to: 7.5,
        //     color: '#0073ff',
        //     label: {
        //       text: 'Moderate',
        //       style: {
        //         color: '#0C2D48',
        //       },
        //     },
        //   },
        //   {
        //     from: 7.5,
        //     to: 15,
        //     color: '#0011ad',
        //     label: {
        //       text: 'Heavy',
        //       style: {
        //         color: '#0C2D48',
        //       },
        //     },
        //   },
        //   {
        //     from: 15,
        //     to: 30,
        //     color: '#fcba03',
        //     label: {
        //       text: 'Intense',
        //       style: {
        //         color: '#0C2D48',
        //       },
        //     },
        //   },

        //   {
        //     from: 30,
        //     to: 500,
        //     color: '#fc3d03',
        //     label: {
        //       text: 'Torrential',
        //       style: {
        //         color: '#0C2D48',
        //       },
        //     },
        //   },
        // ],
      },
      series: [
        {
          name: 'Rainfall (mm)',
          color: '#298bdb',
          data: [],
          lineWidth: 1.5,
          // dataGrouping: {
          //   enabled: true,
          //   units: [['day', [1]]],
          // },
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
              '<span style="font-size: 14px">Rainfall: {point.y:.2f}mm</span>',
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
          text: 'Flood Height in Meters (m)',
        },
        alignTicks: false,
        color: '#298bdb',
        opposite: false,
        plotBands: [
          {
            from: 0,
            to: 0.5,
            color: '#F2C94C',
            label: {
              text: 'Low',
              style: {
                color: '#0C2D48',
              },
            },
          },
          {
            from: 0.5,
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
            from: 1.5,
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
          name: 'Flood Height (m)',
          color: '#298bdb',
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
              '<span style="font-size: 14px">Flood Height: {point.y:.2f}m</span>',
          },
        },
      ],
    };
  }
  //FLOOD SENSORS END
}
