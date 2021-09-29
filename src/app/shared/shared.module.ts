import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from './components/search/search.component';

const modules = [CommonModule, FormsModule, ReactiveFormsModule];
const components = [SearchComponent];
const directives = [];
@NgModule({
  declarations: [...components, ...directives],
  imports: [...modules],
  exports: [...modules, ...components, ...directives],
})
export class SharedModule {}
