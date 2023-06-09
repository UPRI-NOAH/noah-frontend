import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'noah-risk-assessment-summary',
  templateUrl: './risk-assessment-summary.component.html',
  styleUrls: ['./risk-assessment-summary.component.scss'],
})
export class RiskAssessmentSummaryComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.renderPieChart();
    this.renderChart();
  }

  renderPieChart(): void {
    const seriesOptions: Highcharts.SeriesOptionsType[] = [
      {
        type: 'pie', // Add the type property with value 'pie'
        name: 'Percentage',
        colorByPoint: true,
        innerSize: '75%',
        data: [
          {
            name: 'Little to None',
            y: 9.7,
          },
          {
            name: 'Low',
            y: 11.2,
          },
          {
            name: 'Medium',
            y: 11,
          },
          {
            name: 'High',
            y: 68.1,
          },
        ],
      },
    ];
    const options: Highcharts.Options = {
      colors: ['#C0C0C0', '#F2C94C', '#F2994A', '#EB5757'],
      chart: {
        type: 'pie',
        height: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      title: {
        text: 'Population Affected',
      },
      tooltip: {
        valueSuffix: '%',
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
            format: '{point.name}: {y} %',
          },
          showInLegend: true,
        },
      },
      series: seriesOptions,
    };

    Highcharts.chart('population-dom', options);
  }

  renderChart(): void {
    const seriesOptions: Highcharts.SeriesOptionsType[] = [
      {
        type: 'column', // Add the type property with value 'pie'
        name: 'Percentage',
        colorByPoint: true,

        data: [
          {
            name: 'Elderly',
            y: 9.7,
          },
          {
            name: 'Adult',
            y: 11.2,
          },
          {
            name: 'Youth',
            y: 11,
          },
          {
            name: 'Children',
            y: 68.1,
          },
          {
            name: 'Women Reproductive',
            y: 68.1,
          },
        ],
      },
    ];
    const options: Highcharts.Options = {
      colors: ['#C0C0C0', '#F2C94C', '#F2994A', '#EB5757'],
      chart: {
        type: 'column',
        height: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      title: {
        text: 'Population Affected',
      },
      tooltip: {
        valueSuffix: '%',
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
            format: '{point.name}: {y} %',
          },
          showInLegend: true,
        },
      },
      series: seriesOptions,
    };

    Highcharts.chart('age-dom', options);
  }
}
