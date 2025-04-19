import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AdParkService } from 'src/app/core/services/adPark.service';

@Component({
  selector: 'app-sponsor',
  templateUrl: './sponsor.component.html',
  styleUrls: ['./sponsor.component.scss']
})
export class SponsorComponent implements OnInit {
  // safeVideoUrl: SafeResourceUrl;
  /*adPark: any = {
    name: 'Miss Dior',
    advertisementId: '67d7fa5d1b5680a9e9bd9e3a',
    title: 'Plongez dans l\'univers ',
    citation: 'La beauté commence au moment où vous décidez d\'être vous-même.',
    playlist: 'https://open.spotify.com/embed/playlist/16uXIoXXCxv2cnC8hK4lf0?utm_source=generator',
    hero: {
      videoBackground: true,
      background: 'https://www.youtube.com/embed/cOQ-WEaK7Jo?autoplay=1&mute=1&loop=1&playlist=cOQ-WEaK7Jo&controls=0&showinfo=0&rel=0&playsinline=1',
      quote: 'La beauté commence au moment où vous décidez d\'être vous-même.',
      author: 'Coco Chanel'
    },

    playgrounds: [
      {
        title: '✨ Gagnez un voyage bien-être',
        description: 'Participez à notre grand jeu concours en partenariat avec Dior. Destination : les Maldives !',
        button: 'Je participe',
        image: 'assets/images/pub/sponsor_1.png',
        action: 'concours',
        extra: ''
      },
      {
        title: '🎁 Utilisez vos points de fidélité',
        description: 'Accédez à une sélection privilège de soins, produits et services offerts contre vos points IzyGlam.',
        button: 'J\'utilise mes points',
        image: 'assets/images/pub/sponsor_5.png',
        action: 'points',
        extra: ''
      },
      {
        title: '📦 Recevez un échantillon personnalisé',
        description: 'Un soin sur mesure rien que pour vous. Renseignez vos envies beauté et recevez votre surprise parfumée.',
        button: 'Je personnalise mon échantillon',
        image: 'assets/images/pub/sponsor_2.png',
        action: 'echantillon',
        extra: ''
      },
      {
        title: '🎧 Playlist bien-être',
        description: 'Entrez dans votre bulle avec notre playlist exclusive. Parfaite pour accompagner votre rituel.',
        button: 'Powered by Spotify',
        image: 'assets/sponsors/visuel-playlist.jpg',
        action: 'playlist',
        extra: ''
      },
      /*
      {
        title: '📹 Tutos beauté exclusifs',
        description: 'Réalisez un look signature avec nos tutoriels Dior. Astuces, gestes pros et inspiration haut de gamme.',
        button: 'Je regarde le tuto',
        image: 'assets/images/pub/sponsor_3.png',
        action: 'tuto',
        extra: ''
      },
      {
        title: '💬 La parole aux clients',
        description: 'Envie de savoir ce que les autres pensent ? Lisez ou partagez un avis sincère et inspirant.',
        button: 'Lire les avis',
        image: 'assets/images/pub/sponsor_4.png',
        action: 'avis',
        extra: ''
      }
    ]
  };*/


  adPark: any = {
    hero: {},
    playgrounds: [],
    playlist: ''
  };
  constructor(
    private route: ActivatedRoute, private sanitizer: DomSanitizer, private adParkService: AdParkService) {
    // this.adPark.hero.background = 'https://www.youtube.com/embed/cOQ-WEaK7Jo?autoplay=1&mute=1&loop=1&playlist=cOQ-WEaK7Jo&controls=0&showinfo=0&rel=0&playsinline=1';
  }

  ngOnInit(): void {
    // Récupération de l'ID depuis les paramètres de route
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (id) {
      this.adParkService.getByAdvertisementId(id).subscribe({
        next: (result: any) => {
          this.adPark = result;

          // Sécurisation des URLs sensibles pour l'iframe ou embed
          this.adPark.hero.background = this.sanitizer.bypassSecurityTrustResourceUrl(result.hero.background);
          this.adPark.playlist = this.sanitizer.bypassSecurityTrustResourceUrl(result.playlist);
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement de la campagne adPark :', error);
        }
      });
    } else {
      console.warn('Aucun advertisementId fourni dans l’URL');
    }
  }

  getYoutubeId(url: string): string {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : '';
  }
  openModal(type: string) {
    // Logique à implémenter pour chaque action
    console.log('Ouverture du bloc :', type);
  }

  getDisplayedIndex(i: number): number {
    let count = 0;
    for (let j = 0; j <= i; j++) {
      const current = this.adPark.playgrounds[j];
      if (current && current.action !== 'playlist') {
        count++;
      }
    }
    return count;
  }

}
