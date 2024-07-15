import { Component, OnInit, OnDestroy } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { interval, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-coming-soon',
    templateUrl: './coming-soon.component.html',
    styleUrls: ['./coming-soon.component.scss'],
})
export class ComingSoonComponent implements OnInit, OnDestroy {
    countryAccepted: boolean = true;
    imgStorageUrl: string = environment.imgStorageUrl;
    private countdownSubscription!: Subscription;
    timeLeft: any = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    targetDate: Date = new Date('2025-02-14'); // Date de lancement valide US format)
    country: string | null = '';
    constructor(
        private route: ActivatedRoute,
        private title: Title,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        const country = this.activatedRoute.snapshot.params['country'];
        if (environment.allowedCountries.includes(country)) {
            this.router.navigate(['/home']);
        } else if (environment.comingSoonCountries.includes(country)) {
            this.targetDate = new Date(environment.comingSoonCountriesDate);
        } else if (environment.comingSoonCountries2.includes(country)) {
            this.targetDate = new Date(environment.comingSoonCountries2Date);
        } else {
            console.log('Pays non pris en charge: ', country);
            this.countryAccepted = false;
        }
        console.log('Pays: ', country);
        this.title.setTitle(this.route.snapshot.data['title']);
        if (isNaN(this.targetDate.getTime())) {
            console.error("La date cible n'est pas valide!");
        } else {
            this.startCountdown();
        }
    }

    ngOnDestroy() {
        if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
        }
    }

    startCountdown() {
        this.countdownSubscription = interval(1000)
            .pipe(
                startWith(0),
                map(() => {
                    const now = new Date();
                    const distance = this.targetDate.getTime() - now.getTime();

                    if (distance < 0) {
                        this.countdownSubscription.unsubscribe();
                        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
                    }

                    return {
                        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                        hours: Math.floor(
                            (distance % (1000 * 60 * 60 * 24)) /
                                (1000 * 60 * 60)
                        ),
                        minutes: Math.floor(
                            (distance % (1000 * 60 * 60)) / (1000 * 60)
                        ),
                        seconds: Math.floor((distance % (1000 * 60)) / 1000),
                    };
                })
            )
            .subscribe((timeLeft) => (this.timeLeft = timeLeft));
    }
}
