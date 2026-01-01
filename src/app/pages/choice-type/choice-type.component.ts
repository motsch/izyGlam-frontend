import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-choice-type',
  templateUrl: './choice-type.component.html',
  styleUrls: ['./choice-type.component.scss']
})
export class ChoiceTypeComponent {
  constructor(private router: Router) {}

  goQuick(): void {
    this.router.navigate(['/quick']);      // adapte tes routes
  }

  goProvider(): void {
    this.router.navigate(['/main']);  // adapte tes routes
  }

  goBack(): void {
    window.history.back();
  }
}
