import { Pipe, PipeTransform } from '@angular/core';
import { SummaryItem } from '@features/noah-playground/services/earthquake-data.service';

@Pipe({
  name: 'searchEqLocation',
})
export class SearchEqLocationPipe implements PipeTransform {
  transform(summaryData: SummaryItem[], searchValue: string): SummaryItem[] {
    if (!summaryData || !searchValue) {
      return summaryData;
    }
    return summaryData.filter(
      (data) =>
        data.bldg_name
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.rshake_station
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.remarks
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase())
    );
  }
}
