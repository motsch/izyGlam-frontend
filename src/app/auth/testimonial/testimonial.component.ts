import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-testimonial',
  templateUrl: './testimonial.component.html',
  styleUrls: ['./testimonial.component.scss'],
})
export class TestimonialComponent implements OnInit {
  imgStorageUrl = environment.imgStorageUrl;

  sponsors = [
    { name: 'LVMH', logo: 'sponsors/lvmh.png', url: 'https://www.lvmh.com/' },
    { name: 'Dyson Beauty', logo: 'sponsors/dyson.png', url: 'https://www.dyson.fr' },
    { name: 'Chanel', logo: 'sponsors/chanel.png', url: 'https://www.chanel.com/' },
    { name: 'Sephora', logo: 'sponsors/sephora.png', url: 'https://www.sephora.fr/' },
    { name: 'L’Oréal Pro', logo: 'sponsors/loreal.png', url: 'https://www.lorealprofessionnel.fr/' }
  ];

  constructor() { }

  ngOnInit(): void { }
}
