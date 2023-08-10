import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'sort',
  pure: true,
})
export class SortPipe implements PipeTransform {
  transform(list: any[], column: string, direction: string): any[] {
    if (!list) {
      return [];
    }
    if (direction === 'ascending') {
      return list.sort((a, b) => (a[column] > b[column] ? -1 : 1));
    } else {
      return list.sort((a, b) => (a[column] < b[column] ? -1 : 1));
    }
  }
}
