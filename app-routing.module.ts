import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookFlightComponent } from './book-flight/book-flight.component';
import { ViewDetailsComponent } from './book-flight/view-details.component';

const routes: Routes = [
  { path: 'book', component: BookFlightComponent },
  { path: 'view', component: ViewDetailsComponent },
  { path: '**', redirectTo: 'book' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
