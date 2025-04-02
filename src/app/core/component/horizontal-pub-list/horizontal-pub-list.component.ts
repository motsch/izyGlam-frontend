import { AfterViewInit, Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-horizontal-pub-list',
  standalone: false,
  templateUrl: './horizontal-pub-list.component.html',
  styleUrl: './horizontal-pub-list.component.scss'
})
export class HorizontalPubListComponent implements AfterViewInit {
  @Input() title: string = '';
  @Input() pubs: any[] = [];
  @Input() me: any;

  constructor(private router: Router) { }

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


  goTo(link: string) {
    console.log("click: " + link);

    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank'); // Ouvre le lien externe dans un nouvel onglet
    } else {
      this.router.navigateByUrl(link); // Navigation interne Angular
    }
  }
}
