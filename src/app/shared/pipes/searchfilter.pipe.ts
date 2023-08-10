import { Pipe, PipeTransform } from '@angular/core';
import { SummaryItem } from '@features/noah-playground/services/qc-sensor.service';

@Pipe({
  name: 'searchfilter',
})
export class SearchfilterPipe implements PipeTransform {
  transform(summaryData: SummaryItem[], searchValue: string): SummaryItem[] {
    if (!summaryData || !searchValue) {
      return summaryData;
    }
    return summaryData.filter(
      (data) =>
        data.name
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.iot_type
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase())
    );
  }
}
