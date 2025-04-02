import { AfterViewInit, Component, Input } from '@angular/core';

@Component({
  selector: 'app-horizontal-shop-list',
  standalone: false,
  templateUrl: './horizontal-shop-list.component.html',
  styleUrl: './horizontal-shop-list.component.scss'
})
export class HorizontalShopListComponent implements AfterViewInit {
  @Input() title: string = '';
  @Input() shops: any[] = [];
  @Input() me: any;


  ngAfterViewInit(): void {
    const elements = document.querySelectorAll('.drag-scroll');

    elements.forEach((el) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      (el as HTMLElement).addEventListener('mousedown', (event) => {
        const e = event as MouseEvent;
        isDown = true;
        (el as HTMLElement).classList.add('active-drag');
        startX = e.pageX - (el as HTMLElement).offsetLeft;
        scrollLeft = (el as HTMLElement).scrollLeft;
      });

      (el as HTMLElement).addEventListener('mouseleave', () => {
        isDown = false;
        (el as HTMLElement).classList.remove('active-drag');
      });

      (el as HTMLElement).addEventListener('mouseup', () => {
        isDown = false;
        (el as HTMLElement).classList.remove('active-drag');
      });

      (el as HTMLElement).addEventListener('mousemove', (event) => {
        const e = event as MouseEvent;
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - (el as HTMLElement).offsetLeft;
        const walk = (x - startX) * 1.2; // ajustable
        (el as HTMLElement).scrollLeft = scrollLeft - walk;
      });
    });
  }

}
