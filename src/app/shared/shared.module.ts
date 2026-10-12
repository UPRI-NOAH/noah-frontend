import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from './components/search/search.component';
import { ArrowKeysDirective } from './arrow-keys.directive';
import { BannerComponent } from './components/banner/banner.component';
import { ReplacePipe } from './pipes/replace.pipe';
import { ChangeStyleButtonComponent } from './components/change-style-button/change-style-button.component';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';
import { SummaryComponent } from './components/summary/summary.component';
import { LoginComponent } from './components/login/login.component';
import { SortPipe } from './pipes/sort.pipe';
import { SearchfilterPipe } from './pipes/searchfilter.pipe';
import { PaginationComponent } from './components/pagination/pagination.component';
import { AlertComponent } from './components/alert/alert.component';
import { QcLoginComponent } from './components/qc-login/qc-login.component';
import { SearchRiskAffectedPipe } from './pipes/search-risk-affected.pipe';

@NgModule({
  declarations: [
    ChangeStyleButtonComponent,
    SearchComponent,
    BannerComponent,
    DisclaimerComponent,
    SummaryComponent,
    LoginComponent,
    QcLoginComponent,
    PaginationComponent,
    AlertComponent,
    ReplacePipe,
    SortPipe,
    SearchfilterPipe,
    SearchRiskAffectedPipe,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChangeStyleButtonComponent,
    SearchComponent,
    BannerComponent,
    DisclaimerComponent,
    SummaryComponent,
    LoginComponent,
    QcLoginComponent,
    PaginationComponent,
    AlertComponent,
    ReplacePipe,
    SortPipe,
    SearchfilterPipe,
    SearchRiskAffectedPipe,
  ],
})
export class SharedModule {}
