import { Component } from '@angular/core';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
  selector: 'app-creation-shop',
  templateUrl: './creation-shop.component.html',
  styleUrls: ['./creation-shop.component.scss']
})
export class CreationShopComponent {
  constructor(
    public sessionService: SessionService,) {}
}
