import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import {
  IbffSummaryService,
  ForecastSummaryOutput,
  ForecastSummaryInput,
} from '@features/noah-playground/services/ibff-summary.service';
import {
  PastEventService,
  PastEventListItem,
} from '@features/noah-playground/services/past-event.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first, switchMap, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'noah-risk-assessment-modal',
  templateUrl: './risk-assessment-modal.component.html',
  styleUrls: ['./risk-assessment-modal.component.scss'],
})
export class RiskAssessmentModalComponent implements OnInit, OnDestroy {
  affectedData: AffectedData[] = [];
  riskModal = false;
  searchValue: string;
  sortField = '';
  sortDirection = 'descending';

  currentPage = 1;
  itemsPerPage = 20;
  totalPages: number = 0;
  totalItems = 0;
  totalDataCount = 0;
  errorMsg: boolean = false;
  noResult: boolean = false;
  mobileDisclaimer: boolean = false;
  btnReadMore: boolean = true;
  dateDataText: string;
  showSelect: boolean = false;
  showSort: boolean = false;

  archieveDateTime: string;
  archieveDownload: string;
  dropdown: string[] = [];

  // Forecast summary state
  summaryLoading: boolean = false;
  summaryResult: ForecastSummaryOutput | null = null;
  summaryError: string | null = null;
  summaryPanelOpen: boolean = false;
  typedSummary: string = '';
  areaSummary: string = '';
  keyInsights: string[] = [];
  isTyping: boolean = false;
  private _typingTimer: ReturnType<typeof setInterval> | null = null;

  // Past events state
  summaryMode: 'forecast' | 'past-events' = 'forecast';
  pastEventsLoading: boolean = false;
  pastEventsLoaded: boolean = false;
  pastEvents: PastEventListItem[] = [];
  pastEventsError: string | null = null;
  selectedEvent: PastEventListItem | null = null;
  pastEventSummaryLoading: boolean = false;
  pastEventResult: ForecastSummaryOutput | null = null;
  pastEventError: string | null = null;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private ibffSummary: IbffSummaryService,
    private pastEventService: PastEventService,
    private modalServices: ModalService,
    private pgService: NoahPlaygroundService
  ) {}

  columns = [
    { key: 'brgy', header: 'Barangay' },
    { key: 'muni', header: 'Municipality' },
    { key: 'prov', header: 'Provincial' },
    { key: 'total_pop', header: 'Total Population' },
    { key: 'total_aff_pop', header: 'Total Affected Population' },
    { key: 'exposed_medhigh', header: 'Exposed to Med-High Hazard' },
    { key: 'perc_aff_medhigh', header: 'Percentage of Exposed to Med-High' },
  ];

  ngOnInit(): void {
    this.modalServices.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });
    this.loadData(this.currentPage);
    this.loadDateText();
    this.archiveData();
  }

  showSelectDate() {
    this.showSelect = !this.showSelect;
  }
  showSortDropdown() {
    this.showSort = !this.showSort;
  }

  async downloadData(selectedDate: string) {
    try {
      const response: any = await this.riskAssessment
        .archiveData()
        .pipe(first())
        .toPromise();
      if (response?.results) {
        const selectedResult = response.results.find(
          (result: any) => result.datetime === selectedDate
        );
        if (selectedResult?.s3_link) {
          window.open(selectedResult.s3_link, '_blank');
        }
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
    }
  }

  onDateSelected(selectedDate: string) {
    if (selectedDate !== 'select-date') {
      this.downloadData(selectedDate).then(() => {
        this.showSelect = false;
      });
    }
  }

  async archiveData() {
    try {
      const response: any = await this.riskAssessment
        .archiveData()
        .pipe(first())
        .toPromise();
      if (response?.results) {
        this.dropdown = response.results.map((r: any) => r.datetime);
      }
    } catch {
      // archive endpoint unavailable — dropdown stays empty
    }
  }

  loadDateText(): void {
    this.riskAssessment.getDateText().subscribe((data: string) => {
      this.dateDataText = data;
    });
  }

  async loadData(page: number, searchTerm?: string) {
    try {
      const response: any = await this.riskAssessment
        .getAffectedPopulations(page, searchTerm)
        .pipe(first())
        .toPromise();

      if (searchTerm && response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = false;
        this.noResult = true;
      } else if (response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = true;
        this.noResult = false;
      } else {
        this.currentPage = page;
        this.affectedData = response.results.map((a) => ({
          brgy: a.brgy,
          muni: a.muni,
          prov: a.prov,
          total_pop: a.total_pop,
          total_aff_pop: a.total_aff_pop,
          exposed_medhigh: a.exposed_medhigh,
          perc_aff_medhigh: a.perc_aff_medhigh,
        }));
        this.totalDataCount = response.count;
        this.errorMsg = false;
        this.noResult = false;
      }
    } catch {
      this.affectedData = [];
      this.errorMsg = true;
      this.noResult = false;
    }
  }

  toggleSummaryPanel() {
    this.summaryPanelOpen = !this.summaryPanelOpen;
  }

  // ── Forecast summary ──────────────────────────────────────────────────────

  generateSummary() {
    if (this._typingTimer) {
      clearInterval(this._typingTimer);
      this._typingTimer = null;
    }
    this.summaryMode = 'forecast';
    this.summaryLoading = true;
    this.summaryError = null;
    this.summaryPanelOpen = true;
    this.typedSummary = '';
    this.areaSummary = '';
    this.keyInsights = [];
    this.isTyping = false;

    forkJoin([
      this.riskAssessment.getAllAffectedData().pipe(
        first(),
        catchError(() => of([]))
      ),
      this.riskAssessment.getDateText().pipe(
        first(),
        catchError(() => of(''))
      ),
    ])
      .pipe(
        switchMap(([allRecords, dateText]: [any[], string]) => {
          this.dateDataText = dateText;
          const mapped: AffectedData[] = allRecords.map((a: any) => ({
            brgy: a.brgy,
            muni: a.muni,
            prov: a.prov,
            total_pop: a.total_pop,
            total_aff_pop: a.total_aff_pop,
            exposed_medhigh: a.exposed_medhigh,
            perc_aff_medhigh: a.perc_aff_medhigh,
          }));
          const records = mapped.length ? mapped : this.affectedData;
          const input = this.buildSummaryInput(records, records.length);
          return this.ibffSummary.generateSummary(input);
        })
      )
      .subscribe({
        next: (result) => {
          this.summaryResult = result;
          this.summaryLoading = false;
          this._startTypewriter(result);
        },
        error: () => {
          this.summaryError =
            'Unable to reach the summarization service. Please ensure the backend is running.';
          this.summaryLoading = false;
        },
      });
  }

  // ── Past events ───────────────────────────────────────────────────────────

  openPastEvents() {
    this.summaryPanelOpen = true;
    this.summaryMode = 'past-events';
    this.selectedEvent = null;
    this.pastEventResult = null;
    this.pastEventError = null;
    if (this._typingTimer) {
      clearInterval(this._typingTimer);
      this._typingTimer = null;
    }

    if (this.pastEventsLoaded) return;

    this.pastEventsLoading = true;
    this.pastEventsError = null;
    this.pastEventService.listEvents().subscribe({
      next: (events) => {
        this.pastEvents = events;
        this.pastEventsLoaded = true;
        this.pastEventsLoading = false;
      },
      error: () => {
        this.pastEventsError =
          'Unable to load past events. Check backend connection.';
        this.pastEventsLoading = false;
      },
    });
  }

  onEventDropdownChange(value: string) {
    const event = this.pastEvents.find((e) => e.id === +value);
    if (event) this.selectEvent(event);
  }

  selectEvent(event: PastEventListItem) {
    this.selectedEvent = event;
    this.pastEventResult = null;
    this.pastEventError = null;
    this.pastEventSummaryLoading = true;
    this.typedSummary = '';
    this.areaSummary = '';
    this.keyInsights = [];
    this.isTyping = false;
    if (this._typingTimer) {
      clearInterval(this._typingTimer);
      this._typingTimer = null;
    }

    const request$ = event.has_summary
      ? this.pastEventService.getSummary(event.id)
      : this.pastEventService.generateSummary(event.id);

    request$.subscribe({
      next: (result) => {
        this.pastEventResult = result;
        this.pastEventSummaryLoading = false;
        event.has_summary = true;
        this._startTypewriter(result);
      },
      error: () => {
        this.pastEventError =
          'Unable to generate summary. Ensure the backend is running.';
        this.pastEventSummaryLoading = false;
      },
    });
  }

  closePastEventsMode() {
    this.summaryMode = 'forecast';
    this.selectedEvent = null;
    this.pastEventResult = null;
    this.typedSummary = '';
    this.areaSummary = '';
    this.keyInsights = [];
    if (this._typingTimer) {
      clearInterval(this._typingTimer);
      this._typingTimer = null;
    }
  }

  eventDateLabel(event: PastEventListItem): string {
    const fmt = (d: string) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      });
    };
    const fmtFull = (d: string) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };
    if (!event.date_end || event.date_end === event.date_start)
      return fmtFull(event.date_start);
    return `${fmt(event.date_start)}–${fmtFull(event.date_end)}`;
  }

  // ── Shared typewriter ─────────────────────────────────────────────────────

  private _startTypewriter(result: ForecastSummaryOutput) {
    this.typedSummary = '';
    this.areaSummary = '';
    this.keyInsights = [];
    this.isTyping = true;
    const text = result.executive_summary;
    let i = 0;
    this._typingTimer = setInterval(() => {
      if (i < text.length) {
        this.typedSummary += text[i++];
      } else {
        clearInterval(this._typingTimer!);
        this._typingTimer = null;
        this.areaSummary = result.area_summary ?? '';
        this.keyInsights = result.key_insights ?? [];
        this.isTyping = false;
      }
    }, 15);
  }

  ngOnDestroy() {
    if (this._typingTimer) clearInterval(this._typingTimer);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _toTitleCase(s: string): string {
    return s
      .replace(/\s*\(Not a Province\)/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private buildSummaryInput(
    records: AffectedData[],
    _totalCount: number
  ): ForecastSummaryInput {
    const provinceMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const municipalitySet = new Set<string>();
    const seen = new Set<string>();

    for (const item of records) {
      const dedupeKey = `${item.brgy}||${item.muni}||${item.prov}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      if (item.prov) {
        const prov = this._toTitleCase(item.prov);
        provinceMap.set(prov, (provinceMap.get(prov) ?? 0) + 1);
        if (item.muni) {
          municipalitySet.add(`${item.muni}||${prov}`);
          const cityKey = `${this._toTitleCase(item.muni)}||${prov}`;
          cityMap.set(cityKey, (cityMap.get(cityKey) ?? 0) + 1);
        }
      }
    }

    const topAreas = Array.from(provinceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([province, count]) => ({ province, affected_barangays: count }));

    const topCities = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [city, province] = key.split('||');
        return { city, province, affected_barangays: count };
      });

    const topBarangaysByHazard = records
      .filter((r) => typeof r.perc_aff_medhigh === 'number' && r.brgy && r.muni)
      .slice()
      .sort((a, b) => b.perc_aff_medhigh - a.perc_aff_medhigh)
      .slice(0, 3)
      .map((r) => ({
        barangay: r.brgy,
        municipality: this._toTitleCase(r.muni),
        province: r.prov ? this._toTitleCase(r.prov) : undefined,
        medhigh_percentage: r.perc_aff_medhigh,
      }));

    return {
      forecast_timestamp: this.dateDataText || 'not available',
      affected_barangays: seen.size,
      affected_municipalities: municipalitySet.size,
      affected_provinces: provinceMap.size,
      top_areas: topAreas,
      top_cities: topCities,
      top_barangays_by_hazard: topBarangaysByHazard,
      notes: [
        'Counts exclude barangays tagged Little to None.',
        'Exposure is based on intersection with NOAH flood hazard layers.',
      ],
    };
  }

  closeModal() {
    this.summaryResult = null;
    this.summaryError = null;
    this.summaryPanelOpen = false;
    this.summaryMode = 'forecast';
    this.pastEventsLoaded = false;
    this.pastEvents = [];
    this.selectedEvent = null;
    this.pastEventResult = null;
    this.pastEventError = null;
    this.modalServices.closeRiskModal();
    this.modalServices.closeBtnRiskAssessment();
    this.modalServices.hideLegend();
    this.pgService.toggleAffectedPopulationVisibilityFalse();
  }

  hideModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.openBtnRiskAssessment();
  }

  mobileDisclaimerSeemore() {
    this.mobileDisclaimer = true;
    this.btnReadMore = false;
  }

  onHeaderColumnClick(field: string) {
    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortField = field;
      this.sortDirection = 'ascending';
    }
  }
}
