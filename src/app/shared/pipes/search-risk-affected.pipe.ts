import { Pipe, PipeTransform } from '@angular/core';
import { AffectedData } from '@features/noah-playground/services/risk-assessment.service';

@Pipe({
  name: 'searchRiskAffected',
})
export class SearchRiskAffectedPipe implements PipeTransform {
  transform(allData: AffectedData[], searchValue: string): AffectedData[] {
    if (!allData || !searchValue) {
      return allData;
    }
    return allData.filter(
      (data) =>
        data.brgy
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.muni
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.prov
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase()) ||
        data.total_pop
          .toLocaleString()
          .replace(/,/g, '')
          .includes(searchValue.toLocaleString()) ||
        data.total_aff_pop
          .toLocaleString()
          .replace(/,/g, '')
          .includes(searchValue.toLocaleString()) ||
        data.exposed_medhigh
          .toLocaleString()
          .replace(/,/g, '')
          .includes(searchValue.toLocaleString()) ||
        data.perc_aff_medhigh
          .toLocaleString()
          .replace(/,/g, '')
          .includes(searchValue.toLocaleString())
    );
  }
}
