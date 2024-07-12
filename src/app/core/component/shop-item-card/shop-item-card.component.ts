import { Component, Input } from "@angular/core";

@Component({
  selector: "app-shop-item-card",
  templateUrl: "./shop-item-card.component.html",
  styleUrls: ["./shop-item-card.component.scss"],
})
export class ShopItemCardComponent {
  @Input() item: any;
  // /assets/images/ubertest2.webp
}
