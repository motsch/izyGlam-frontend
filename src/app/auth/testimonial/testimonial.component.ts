import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-testimonial',
    templateUrl: './testimonial.component.html',
    styleUrls: ['./testimonial.component.scss'],
})
export class TestimonialComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;
    constructor() {}

    ngOnInit() {}

    // Testimonial Carousel
    public testimonial = [
        {
            image: 'assets/images/1.png',
            name: 'Mark jkcno',
            designation: 'Designer',
            description:
                'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.Contrary to popular belief, Lorem Ipsum is not simply random text. ',
        },
        {
            image: 'assets/images/1.png',
            name: 'Adegoke Yusuff',
            designation: 'Content Writer',
            description:
                'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.Contrary to popular belief, Lorem Ipsum is not simply random text.',
        },
        {
            image: 'assets/images/1.png',
            name: 'John Shipmen',
            designation: 'Lead Developer',
            description:
                'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.Contrary to popular belief, Lorem Ipsum is not simply random text. ',
        },
    ];

    // Testimonial Carousel Options
    public testimonialCarousel: OwlOptions = {
        loop: true,
        margin: 10,
        nav: false,
        dots: true,
        items: 1,
    };
}
