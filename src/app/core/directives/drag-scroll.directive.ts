import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDragScroll]'
})
export class DragScrollDirective {
  private isDown = false;
  private startX = 0;
  private scrollLeft = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    this.isDown = true;
    this.startX = e.pageX - this.el.nativeElement.offsetLeft;
    this.scrollLeft = this.el.nativeElement.scrollLeft;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grabbing');
    this.renderer.addClass(this.el.nativeElement, 'active-drag');
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.endDrag();
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.endDrag();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDown) return;
    e.preventDefault();
    const x = e.pageX - this.el.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 1.2; // Ajuste la vitesse si besoin
    this.el.nativeElement.scrollLeft = this.scrollLeft - walk;
  }

  private endDrag() {
    this.isDown = false;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
    this.renderer.removeClass(this.el.nativeElement, 'active-drag');
  }
}
