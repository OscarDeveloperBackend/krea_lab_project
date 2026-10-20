import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from './features/layout/app-header/app-header';
import { AppFooter } from './features/layout/app-footer/app-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, AppFooter],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('krea_lab_frontend');
}
