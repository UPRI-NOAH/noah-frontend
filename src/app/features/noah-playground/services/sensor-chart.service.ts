import { Injectable } from '@angular/core';
import { Options } from 'highcharts';
import { SensorType } from './sensor.service';

export type SensorChartOpts = {
  data: any;
  sensorType: SensorType;
};

@Injectable({
  providedIn: 'root',
})
export class SensorChartService {
  constructor() {}

  getChartOpts(sensorType: SensorType) {
    switch (sensorType) {
      case 'arg':
        return this._getRainfallChartOpts();
      case 'wlmsarg':
        return this._getRainfallChartOpts();
      default:
        return this._getWaterlevelChartOtps();
    }
  }

  showChart(chart: Highcharts.Chart, payload: SensorChartOpts) {
    const { data, sensorType } = payload;

    if (!data || !data?.length) {
      chart.showLoading('No Data Available');
    }

    const sortedData = data.sort((a: any, b: any) => {
      return (
        new Date(a.dateTimeRead).getTime() - new Date(b.dateTimeRead).getTime()
      );
    });

    // set X axis
    chart.xAxis[0].update(
      {
        categories: sortedData.map((d) => d.dateTimeRead),
        tickInterval: 5,
      },
      true
    );

    // set Y axis
    switch (sensorType) {
      case 'arg':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.rain_value)),
          true
        );
        break;
      default:
        chart.series[0].setData(
          sortedData.map((d) => Number(d.waterlevel)),
          true
        );
        break;
    }
  }

  private _getWaterlevelChartOtps(): any {
    return {
      chart: { type: 'area' },
      yAxis: {
        alignTicks: false,
      },
      series: [
        {
          name: 'Waterlevel',
          data: [],
          // type: "xrange"
        },
      ],
    };
  }

  private _getRainfallChartOpts(): any {
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
}
