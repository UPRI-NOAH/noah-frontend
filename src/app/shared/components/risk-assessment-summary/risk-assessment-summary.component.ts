import { Component, OnInit } from '@angular/core';
import { RiskAssessmentService } from '@features/noah-playground/services/risk-assessment.service';
import * as Highcharts from 'highcharts';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-summary',
  templateUrl: './risk-assessment-summary.component.html',
  styleUrls: ['./risk-assessment-summary.component.scss'],
})
export class RiskAssessmentSummaryComponent implements OnInit {
  constructor(private expService: RiskAssessmentService) {}

  generalTotalPopulation: string;

  ngOnInit(): void {
    this.fetchDataChart();
    this.renderGenderChart();
  }

  fetchDataChart(): void {
    this.expService.getBrgy100yr().subscribe(
      (apiData: any) => {
        const dataArray = this.parsePieGraph(apiData);
        this.renderPieChart(dataArray);

        const genderArray = this.parseGenderJSON(apiData);
        this.renderAgeChart(genderArray);

        const totalPopulation = apiData.features;
        let totalPopu = 0;

        if (totalPopulation && totalPopulation.length > 0) {
          for (const feature of totalPopulation) {
            const properties = feature?.properties;
            const generaltotalPopu = properties.general_po_total;

            if (generaltotalPopu) {
              totalPopu += generaltotalPopu;
            }
          }
          const roundedTotalPopu = totalPopu.toFixed(0);
          const formattedTotalPopu =
            parseFloat(roundedTotalPopu).toLocaleString();
          this.generalTotalPopulation = formattedTotalPopu;
          console.log('hello', this.generalTotalPopulation);
        }
      },
      (error) => {
        console.error('Error Fetching Data:', error);
      }
    );
  }

  parsePieGraph(geojsonData: any): any[] {
    const features = geojsonData.features;
    const dataMap = {};

    features.forEach((feature) => {
      const varValue = feature.properties.Var;
      const popAfTotal = feature.properties.tot_pop_af_total;

      if (dataMap[varValue]) {
        dataMap[varValue] += popAfTotal;
      } else {
        dataMap[varValue] = popAfTotal;
      }
    });

    const dataArray = Object.keys(dataMap).map((varValue) => ({
      x: varValue,
      y: dataMap[varValue],
    }));
    return dataArray;
  }

  parseGenderJSON(geojsonData: any): any[] {
    const features = geojsonData.features;
    const dataMap = {};

    // Check if features is defined
    if (features) {
      // Iterate over the features
      features.forEach((feature) => {
        const varValue = feature.properties.Var;
        const elderTotal = feature.properties.elderlysum_total;
        const youthTotal = feature.properties.youthsum_total;
        const childrenTotal = feature.properties.childrensum_total;
        const womenReprTotal = feature.properties.women_repr_total;

        // Check if the varValue already exists in the dataMap
        if (dataMap[varValue]) {
          // If it exists, add the values to the existing object
          dataMap[varValue].elderTotal += elderTotal;
          dataMap[varValue].youthTotal += youthTotal;
          dataMap[varValue].childrenTotal += childrenTotal;
          dataMap[varValue].womenReprTotal += womenReprTotal;
        } else {
          // If it doesn't exist, create a new object with the values
          dataMap[varValue] = {
            var: varValue,
            elderTotal,
            youthTotal,
            childrenTotal,
            womenReprTotal,
          };
        }
      });
    }

    // Convert the values of the dataMap into an array
    const dataArray = Object.values(dataMap);
    return dataArray;
  }

  renderPieChart(data: any[]): void {
    const categoryMapping = {
      0: 'Little to None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
    };

    const colors = {
      'Little to None': '#C0C0C0',
      Low: '#F2C94C',
      Medium: '#F2994A',
      High: '#EB5757',
    };

    const seriesOptions: Highcharts.SeriesOptionsType[] = [
      {
        type: 'pie',
        name: 'Percentage',
        innerSize: '75%',
        data: data.map((item) => ({
          name: categoryMapping[item.x],
          y: Math.round(item.y),
          customData: item.y,
          color: colors[categoryMapping[item.x]], // Assign color based on category
        })),
      },
    ];

    const options: Highcharts.Options = {
      chart: {
        type: 'pie',
        height: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      title: {
        text: 'Population Affected by flood 100 year',
        style: {
          fontSize: '25px',
        },
      },

      //
      tooltip: {
        headerFormat: '',
        pointFormat:
          '<span style="font-size: 20px; color:{point.color}">\u25CF</span> <span style = "font-size: 20px;"> {point.name}: <b>{point.customData:,.0f}</b></span>',
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.y:,.0f}',
            style: {
              fontSize: '19px',
              textOutline: 'none',
            },
          },
          showInLegend: true,
        },
      },
      legend: {
        itemStyle: {
          fontSize: '20px', // Increase font size for legend items
        },
      },
      series: seriesOptions,
    };

    Highcharts.chart('population-dom', options);
  }

  renderAgeChart(data: any[]): void {
    const categoryMapping = {
      0: 'Little to None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
    };

    const xAxisCategories = data.map((item) => categoryMapping[item.var]);

    const seriesOptions: Highcharts.SeriesOptionsType[] = [
      {
        type: 'column',
        stacking: 'normal',
        name: 'Elderly (ages 60+)',
        color: '#146c94',
        data: data.map((item) => ({
          name: categoryMapping[item.var],
          y: Math.round(item.elderTotal),
          customData: item.elderTotal,
        })),
      },
      {
        type: 'column',
        stacking: 'normal',
        name: 'Youth (ages 15-24)',
        color: '#faa74b',
        data: data.map((item) => ({
          name: categoryMapping[item.var],
          y: Math.round(item.youthTotal),
          customData: item.youthTotal,
        })),
      },
      {
        type: 'column',
        stacking: 'normal',
        name: 'Children (ages 0-5)',
        color: '#c95c92',
        data: data.map((item) => ({
          name: categoryMapping[item.var],
          y: Math.round(item.childrenTotal),
          customData: item.childrenTotal,
        })),
      },
      {
        type: 'column',
        stacking: 'normal',
        name: 'Women of reproductive (ages 15-49)',
        color: '#63269f',
        data: data.map((item) => ({
          name: categoryMapping[item.var],
          y: Math.round(item.womenReprTotal),
          customData: item.womenReprTotal,
        })),
      },
    ];

    const ageOptions: Highcharts.Options = {
      chart: {
        type: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: xAxisCategories,
        labels: {
          style: {
            fontSize: '17px',
          },
        },
      },
      yAxis: {
        allowDecimals: false,
        min: 0,
        title: {
          text: '',
        },
        labels: {
          style: {
            fontSize: '17px',
          },
        },
      },
      tooltip: {
        headerFormat: '',
        pointFormat:
          '<span style="font-size: 20px; color:{series.color}">  {series.name}</span>:  <span style="font-size: 20px;"> <b>{point.y}</b><br/> </span>',
        shared: true,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            style: {
              fontSize: '15px',
            },
          },
        },
      },
      legend: {
        itemStyle: {
          fontSize: '18px', // Increase font size for legend items
        },
      },
      series: seriesOptions,
    };

    // Render the chart
    Highcharts.chart('age-dom', ageOptions);
  }

  async renderGenderChart(): Promise<void> {
    const genderResponse: any = await this.expService
      .getBrgy100yr()
      .pipe(first())
      .toPromise();

    const totalGenderAff = genderResponse.features;

    let menAffSum = 0;
    let womenAffSum = 0;

    if (totalGenderAff && totalGenderAff.length > 0) {
      for (const feature of totalGenderAff) {
        const properties = feature?.properties;
        const menAff = properties?.men_aff_total;
        const womenAff = properties?.women_aff_total;

        if (menAff) {
          menAffSum += menAff;
        }

        if (womenAff) {
          womenAffSum += womenAff;
        }
      }
      const roundedMen = menAffSum.toFixed(0);
      const roundedWomen = womenAffSum.toFixed(0);
    }

    const totalGender = genderResponse.features;

    let menTotal = 0;
    let womenTotal = 0;

    if (totalGender && totalGender.length > 0) {
      for (const feature of totalGender) {
        const properties = feature?.properties;
        const mensTotal = properties?.mensum_total;
        const womensTotal = properties?.womensum_total;

        if (mensTotal) {
          menTotal += mensTotal;
        }
        if (womensTotal) {
          womenTotal += womensTotal;
        }
      }
    }

    const seriesOptions: Highcharts.SeriesOptionsType[] = [
      {
        type: 'pie', // Add the type property with value 'pie'
        data: [
          {
            name: 'Female',
            y: Math.round(womenAffSum),
            x: Math.round(womenTotal),
          },
          {
            name: 'Male',
            y: Math.round(menAffSum),
            x: Math.round(menTotal),
          },
        ],
      },
    ];
    const options: Highcharts.Options = {
      colors: ['#fa2bb2', '#1ad3ff'],
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      accessibility: {
        point: {
          valueSuffix: '',
        },
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          showInLegend: true,
          dataLabels: {
            style: {
              fontSize: '15px',
            },
          },
        },
      },
      tooltip: {
        headerFormat: '',
        pointFormat:
          '<span style="font-size: 19px;"><b>Affected {point.name}: {point.y:,.0f} <br/><br/>Total {point.name}: {point.x:,.0f}</b></span>',
      },
      legend: {
        // align: 'right',
        // verticalAlign: 'top',
        // layout: 'vertical',
        itemStyle: {
          fontSize: '20px', // Increase font size for legend items
        },
        reversed: true,
      },
      series: seriesOptions,
    };

    Highcharts.chart('gender-dom', options);
  }
}
