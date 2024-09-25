import { Component } from '@angular/core';
import { SessionService } from 'src/app/core/services/session.service';
@Component({
  selector: 'app-creation-company',
  templateUrl: './creation-company.component.html',
  styleUrl: './creation-company.component.scss'
})
export class CreationCompanyComponent {
  constructor(public sessionService: SessionService) {}

}
