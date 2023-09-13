import { Pipe, PipeTransform } from '@angular/core';
import { AffectedData } from '@features/noah-playground/services/risk-assessment.service';

@Pipe({
  name: 'searchRiskAffected',
})
export class SearchRiskAffectedPipe implements PipeTransform {
  transform(summaryData: AffectedData[], searchValue: string): AffectedData[] {
    if (!summaryData || !searchValue) {
      return summaryData;
    }
    return summaryData.filter(
      (data) =>
        data.province
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase())
      // data.province
      //   .toLocaleLowerCase()
      //   .includes(searchValue.toLocaleLowerCase()) ||
      // data.municipality
      //   .toLocaleLowerCase()
      //   .includes(searchValue.toLocaleLowerCase()) ||
      // data.barangay
      //   .toLocaleLowerCase()
      //   .includes(searchValue.toLocaleLowerCase())
    );
  }
}
