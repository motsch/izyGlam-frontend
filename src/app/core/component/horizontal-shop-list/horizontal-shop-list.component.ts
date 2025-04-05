import { AfterViewInit, Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-horizontal-shop-list',
  standalone: false,
  templateUrl: './horizontal-shop-list.component.html',
  styleUrl: './horizontal-shop-list.component.scss'
})
export class HorizontalShopListComponent implements OnChanges {
  @Input() title: string = '';
  @Input() shops: any[] = [];
  @Input() me: any;
  loadedShops: { [key: string]: boolean } = {};

  ngOnChanges(): void {
    if (this.shops) {
      this.loadedShops = {};
      for (const shop of this.shops) {
        this.loadedShops[shop._id] = false;
      }
    }
  }
  
  onShopLoaded(shopId: string) {
    this.loadedShops[shopId] = true;
  }
}
