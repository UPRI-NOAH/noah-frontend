import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, first } from 'rxjs/operators';
import { environment } from '@env/environment';

export type AffectedData = {
  prov: string;
  muni: string;
  brgy: string;
  total_pop: number;
  total_aff_pop: number;
  exposed_medhigh: number;
  perc_aff_medhigh: number;
};

export interface ProvinceGroup {
  prov: string;
  region: string;
  total_municipalities_affected: number;
  total_barangays_affected: number;
  expanded: boolean;
  barangays: AffectedData[];
}

@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService {
  constructor(private http: HttpClient) {}
  private API_BASE_URL = 'https://panahon.up.edu.ph';
  private nextPageUrl: string | null = null;
  private previousPageUrl: string | null = null;
  private defaultUrl: string = `${this.API_BASE_URL}/affected_brgy/?affected=yes`;
  private S3_BASE_URL = 'https://webgis-static.up.edu.ph/api';

  // Track the search term
  private currentSearchTerm: string | null = null;

  getAffectedPopulations(
    page?: number,
    searchTerm?: string,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    if (searchTerm !== undefined) {
      this.currentSearchTerm = searchTerm;
    }

    let url = this.defaultUrl;

    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      url += `&search=${this.currentSearchTerm}`;
    }

    if (page) {
      url += `&page=${page}`;
    }

    if (sortField) {
      const ordering =
        sortDirection === 'ascending' ? sortField : `-${sortField}`;
      url += `&ordering=${ordering}`;
    }

    return this.http.get(url).pipe(
      tap((response: any) => {
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
      })
    );
  }

  async getAffectedProvinces(): Promise<ProvinceGroup[]> {
    let rawDataset: AffectedData[] = [];

    const chunkSize = 10000;
    let currentOffset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const chunkUrl = `${this.defaultUrl}?limit=${chunkSize}&offset=${currentOffset}`;
      const response: any = await this.http
        .get(chunkUrl)
        .pipe(first())
        .toPromise();

      const fetchedRecords = response.results ? response.results : response;

      if (fetchedRecords && fetchedRecords.length > 0) {
        rawDataset = [...rawDataset, ...fetchedRecords];
      }

      if (response.next && fetchedRecords.length === chunkSize) {
        currentOffset += chunkSize;
      } else {
        hasMoreData = false;
      }
    }

    return this.processProvinceGrouping(rawDataset);
  }

  getDateText(): Observable<string> {
    return this.http.get(`${this.S3_BASE_URL}/rainfall/datetime.txt`, {
      responseType: 'text',
    });
  }

  archiveData(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/api/latest-results/`);
  }

  private processProvinceGrouping(rawData: AffectedData[]): ProvinceGroup[] {
    const provinceMap = new Map<string, AffectedData[]>();

    rawData.forEach((item) => {
      const prov = item.prov || 'Unknown Province';
      if (!provinceMap.has(prov)) {
        provinceMap.set(prov, []);
      }
      provinceMap.get(prov)!.push(item);
    });

    const groupedData: ProvinceGroup[] = [];

    provinceMap.forEach((brgys, provName) => {
      const uniqueMunis = new Set(brgys.map((b) => b.muni));
      const uniqueBrgys = new Set(brgys.map((b) => b.brgy));

      let maxExposure = -1;
      brgys.forEach((b) => {
        if (b.perc_aff_medhigh > maxExposure) {
          maxExposure = b.perc_aff_medhigh;
        }
      });

      const topBarangays = brgys.filter(
        (b) => b.perc_aff_medhigh === maxExposure
      );

      groupedData.push({
        prov: provName,
        region: 'Region Data Unavailable',
        total_municipalities_affected: uniqueMunis.size,
        total_barangays_affected: uniqueBrgys.size,
        expanded: false,
        barangays: topBarangays,
      });
    });

    groupedData.sort((a, b) => {
      if (b.total_barangays_affected !== a.total_barangays_affected) {
        return b.total_barangays_affected - a.total_barangays_affected;
      }
      return a.prov.localeCompare(b.prov);
    });

    return groupedData;
  }
}
