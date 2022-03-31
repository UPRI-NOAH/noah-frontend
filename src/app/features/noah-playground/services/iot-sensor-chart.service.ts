import { Injectable } from '@angular/core';
import { Options } from 'highcharts';
import { QcSensorType } from './iot.service';

export type QCSensorChartOpts = {
  data: any;
  qcSensorType: QcSensorType;
};
@Injectable({
  providedIn: 'root',
})
export class IotSensorChartService {
  constructor() {}

  getQcChartOpts(qcSensorType: QcSensorType) {
    switch (qcSensorType) {
      case 'humidity':
        return this._getHumChartOtps();
      case 'temperature':
        return this._getTempChartOtps();
      default:
        return this._getAirChartOtps();
    }
  }

  qcShowChart(chart: Highcharts.Chart, payload: QCSensorChartOpts) {
    const { data, qcSensorType } = payload;

    if (!data || data?.length) {
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
        tickInterval: 1, //x axis display
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
      case 'temperature':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.temp_c)),
          true
        );
        break;
      default:
        chart.series[0].setData(
          sortedData.map((d) => Number(d.pres_hpa)),
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
      },
      series: [
        {
          name: 'Humidity',
          data: [],
        },
      ],
    };
  }

  private _getTempChartOtps(): any {
    return {
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
      },
      series: [
        {
          name: 'Temperature',
          data: [],
        },
      ],
    };
  }

  private _getAirChartOtps(): any {
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
          name: 'Air Pressure',
          data: [],
        },
      ],
    };
  }
}
