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
      case 'pressure':
        return this._getPressOtps();
      case 'temperature':
        return this._getTempOtps();
      // case 'distance':
      //   return this._getDistanceOtps();
      case 'distance_m':
        return this._getDistanceMOtps();
      default:
        return this._getSensor1Otps();
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

    // X AXIS
    chart.xAxis[0].update(
      {
        categories: sortedData.map((d) => d.received_at),
        tickInterval: 6, //x axis display
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
        // case 'distance':
        //   chart.series[0].setData(
        //     sortedData.map((d) => Number (d.distance)),
        //     true
        //   )
        break;
      case 'distance_m':
        chart.series[0].setData(
          sortedData.map((d) => Number(d.distance_m)),
          true
        );
        break;
      default:
        chart.series[0].setData(
          sortedData.map((d) => Number(d.sensor_1)),
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
            label: {
              //text: 'Light',
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
              // style: {
              //   color: 'black'
              // }
            },
          },
          {
            from: 2.5,
            to: 7.5,
            // color: 'blue',
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
            // color: 'dark blue',
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
            // color: 'orange',
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
            // color: 'red',
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
              // style: {
              //   color: 'black'
              // }
            },
          },
          {
            from: 2.5,
            to: 7.5,
            // color: 'blue',
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
            // color: 'dark blue',
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
            // color: 'orange',
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
            // color: 'red',
            color: '#FF8300',
            label: {
              // text: 'Torrential',
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
  private _getDistanceOtps(): any {
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
            color: '#40B0DF',
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
            color: '#40B0DF',
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
            // color: 'dark blue',
            color: '#40B0DF',
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
            // color: 'orange',
            color: '#40B0DF',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },

          {
            from: 30,
            to: 500,
            // color: 'red',
            color: '#40B0DF',
            label: {
              // text: 'Torrential',
              style: {
                color: '#0C2D48',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Distance',
          color: '#0C2D48',
          data: [],
        },
      ],
    };
  }
  private _getDistanceMOtps(): any {
    return {
      // 0 - 0.5m low
      // 0.5-1.5m Moderate
      // 1.5 above High
      chart: { type: 'spline' },
      yAxis: {
        alignTicks: false,
        tickInterval: 0.5,
        color: '#0C2D48',
        plotBands: [
          {
            from: 0,
            to: 0.5,
            color: '#0067B3',
            label: {
              text: 'Low',
              // style: {
              //   color: 'black'
              // }
            },
          },
          {
            from: 0.6,
            to: 1.5,
            // color: 'blue',
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
            // color: 'dark blue',
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
            // color: 'orange',
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
            // color: 'red',
            color: '#0067B3',
            label: {
              // text: 'Torrential',
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
          // lineWidth: 4,
          // marker:{
          //   enabled: false
          // },
          // hover:{
          //   lineWidth: 5
          // }
        },
      ],
    };
  }
  private _getSensor1Otps(): any {
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
            color: '#5885AF',
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
            color: '#5885AF',
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
            // color: 'dark blue',
            color: '#5885AF',
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
            // color: 'orange',
            color: '#5885AF',
            label: {
              style: {
                color: '#0C2D48',
              },
            },
          },

          {
            from: 30,
            to: 500,
            // color: 'red',
            color: '#5885AF',
            label: {
              // text: 'Torrential',
              style: {
                color: '#0C2D48',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Sensor 1',
          color: '#0C2D48',
          data: [],
        },
      ],
    };
  }
  //FLOOD SENSORS END
}
