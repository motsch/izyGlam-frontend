import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-horizontal-shop-list',
  standalone: false,
  templateUrl: './horizontal-shop-list.component.html',
  styleUrl: './horizontal-shop-list.component.scss'
})
export class HorizontalShopListComponent {
  @Input() title: string = '';
  @Input() shops: any[] = [];
  @Input() me: any;
}
