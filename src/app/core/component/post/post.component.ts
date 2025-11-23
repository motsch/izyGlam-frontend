import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { Breakpoints } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdService } from '../../services/ad.service';
import { PostService } from '../../services/post.service';
import { TipService } from '../../services/tips.service';
import { MediaService } from '../../services/media.service';

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrl: './post.component.scss',
})
export class PostComponent implements OnInit {
    buttonsDisabled = true; // Permet de désactiver les boutons lorsque l'on récupère les posts
    addPostButtonDisabled = false;
    // Référence au champ de fichier
    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
    @Input() me: any = {};
    @Input() posts: any[] = [];
    aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
    selectedPlatform: string = 'Instagram'; // Par défaut Instagram
    selectedAdsType: string = ''; // Par défaut none
    filteredPosts: any[] = [];
    selectedFile: File | null = null;
    tips: any[] = [];
    randomTip: any = null;
    contentType: string = 'posts';
    // pub
  campagnes:any[] = [];
  //audit
  platforms = [
    { name: 'Instagram', icon: 'assets/icons/instagram-icon.svg' },
    { name: 'LinkedIn', icon: 'assets/icons/linkedin-icon.svg' },
  ];
  
  selectedPlatformForAudit: string | null = null;
  
  platformDescriptions: { [key: string]: string } = {
    instagram: 'Téléversez une capture de votre page de profil Instagram pour obtenir des suggestions d\'amélioration.',
    linkedin: 'Téléversez les captures de vos sections importantes (titre, résumé, expériences) pour obtenir des suggestions d\'amélioration.',
  };
    

    constructor(
        private postService: PostService,
        public sessionService: SessionService,
        private mediaService: MediaService,
        private userService: UserService,
        private tipsService: TipService,
        private _snackBar: MatSnackBar,
        // Pub
        private adService: AdService
    ) { }

    ngOnInit(): void {
        this.getAdByUserId();
        this.loadTips();
        if (this.me.posts) {
            this.selectPlatform('Facebook');
            this.filteredPosts = this.posts.filter(
                (post) => post.platform === this.selectedPlatform
            );
        } else {
            this.userService.getMe().subscribe({
                next: (data: any) => {
                    this.me = data;
                    this.getAllPosts(data);
                },
                error: (error: any) => {
                    console.log(error);
                    this.buttonsDisabled = false;
                },
            });
        }
    }
    
    shuffleArray(array: any[]): any[] {
        const shuffled = [...array]; // Crée une copie du tableau pour éviter de modifier l'original
        for (let i = shuffled.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1)); // Génère un index aléatoire
            // Échange les éléments
            [shuffled[i], shuffled[randomIndex]] = [
                shuffled[randomIndex],
                shuffled[i],
            ];
        }
        return shuffled;
    }
    
    connectToPlatform(platform: string): void {
        let oauthUrl = '';
    
        switch (platform.toLowerCase()) {
            case 'instagram':
                const instagramScopes = encodeURIComponent(
                    'instagram_business_basic,instagram_business_manage_messages,instagram_business_content_publish,instagram_business_manage_comments'
                );
                oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${environment.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(environment.INSTAGRAM_REDIRECT_URI)}&response_type=code&scope=${instagramScopes}`;
                break;
            case 'linkedin':
                oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${environment.LINKEDIN_APP_ID}&redirect_uri=${encodeURIComponent(environment.LINKEDIN_REDIRECT_URI)}&state=${platform}&scope=openid%20profile%20email%20w_member_social`;
                break;    
            default:
                this.openSnackBar(`Plateforme ${platform} non prise en charge.`);
                return;
        }
    
        // Redirection vers la page d'autorisation de la plateforme
        window.location.href = oauthUrl;
    }
    

    openSnackBar(phrase: string) {
        // const uploadTranslation = this.translate.instant("ALERT.CLOSE");
        this._snackBar.open(phrase, 'uploadTranslation', {
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 5000,
            panelClass: ['orange-snackbar', 'login-snackbar'],
        });
    }

    loadTips(): void {
        this.tipsService.getAll().subscribe({
            next: (data: any[]) => {
                this.tips = this.shuffleArray(data);
                // Sélectionner un tip aléatoire après le chargement
                this.randomTip = this.getRandomTip();
                console.log('Random Tip :', this.randomTip);
            },
            error: (err: any) => {
                console.log(err);
            },
        });
    }

    // Méthode pour récupérer un tip aléatoire
    public getRandomTip(): any {
        if (this.tips.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.tips.length);
            return this.tips[randomIndex];
        }
        return null;
    }

    getAllPosts(me: any) {
        // this.buttonsDisabled = true;
        this.postService.getMonthlyPosts(me._id).subscribe({
            next: (data: any) => {
                console.log(data);
                // Convertir le champ 'content' de chaque post en objet JSON
                this.posts = data.map((post: any) => {
                    return {
                        ...post,
                        content: JSON.parse(post.content), // Conversion en JSON
                    };
                });
                if (!this.selectedPlatform) {
                    this.selectPlatform('Facebook');
                }
                this.filteredPosts = this.posts.filter(
                    (post) => post.platform === this.selectedPlatform
                );
                //this.loaderService.hide();
                this.buttonsDisabled = false;
                console.log(this.posts); // Vérifier le contenu des posts convertis
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    generateContentByAI(post: any) {
        // Logic to generate content using AI
        console.log(post.content.image_prompt);
    }

    editContentManually(post: any) {
        console.log(post.edit);

        if (!post.edit || post.edit === undefined) {
            post.contentToUpdate = post.content.caption;
            // Logic to allow user to edit content manually
            post.edit = true;
        } else {
            post.content.caption = post.contentToUpdate;
            // Création d'un clone avec la version JSON du contenu
            const postClone = {
                ...post,
                content: JSON.stringify(post.content),
            };

            // Mise à jour du post
            this.postService
                .updatePostById(postClone._id, postClone)
                .subscribe({
                    next: (data) => {
                        console.log(data);

                        // Appliquer les changements de contenu au post d'origine
                        post.content = JSON.parse(postClone.content); // Reconvertir en JSON si nécessaire
                        post.edit = !post.edit; // Basculer l'état d'édition pour mettre fin à l'édition
                    },
                    error: (error) => {
                        console.log(error);
                    },
                });
        }

        console.log(post.edit);
    }

    // Méthode pour ouvrir la fenêtre de sélection de fichier
    openFileSelector() {
        if (this.fileInput) {
            this.fileInput.nativeElement.click();
        } else {
            console.error("fileInput n'est pas encore initialisé.");
        }
    }

    // Méthode déclenchée lorsque l'utilisateur sélectionne un fichier
    onFileSelected(event: any, post: any) {
        this.selectedFile = event.target.files[0];
        console.log('Fichier sélectionné :', this.selectedFile);
        this.uploadMedia(post);
    }

    uploadMedia(post: any) {
        if (this.selectedFile) {
            this.mediaService
                .uploadMedia(post._id, this.selectedFile, 'video')
                .subscribe(
                    (response: any) => {
                        console.log('Média uploadé avec succès', response);

                        this.getAllPosts(this.me);
                    },
                    (error: any) => {
                        console.error(
                            "Erreur lors de l'upload du média :",
                            error
                        );
                        this.buttonsDisabled = false;
                    }
                );
        } else {
            console.log('Aucun fichier sélectionné');
        }
    }

    closeEditContentManually(post: any) {
        console.log(post.edit);
        post.edit = false;
        console.log(post.edit);
    }

    correctContentAuto(post: any) {
        // this.loaderService.show();
        console.log('POST: ' + JSON.stringify(post));
        //this.buttonsDisabled =  true;
        console.log('POST !!!! => ' + JSON.stringify(post));
        console.log(post.content.caption);
        console.log(post._id);

        console.log('this.me._id : => ' + this.me._id);
        // Logic to correct content using AI
        this.postService
            .improveInstagramPost(post, this.selectedPlatform, this.me._id)
            .subscribe({
                next: (response: any) => {
                    post.content.caption = response.improved;
                    // this.loaderService.hide();
                    // this.buttonsDisabled = false;
                },
                error: (error: any) => {
                    console.error(
                        "Erreur lors de l'amélioration du texte :",
                        error
                    );
                },
            });
    }

    changeOnePostAuto(post: any) {
        this.buttonsDisabled = true;
        console.log('POST: ' + JSON.stringify(post));
        // Logic to change one post with AI
        this.postService.updateOnePostFromAi(this.me._id, post._id).subscribe({
            next: async (response: any) => {
                console.log(
                    'FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS, FRANCIS'
                );
                console.log(response);
                post = response;
                await this.regenerateImage(response);
            },
            error: (error) => {
                console.error(
                    'Erreur lors de la modification du post :',
                    error
                );
            },
        });
    }

    createNewPost() {
        if (!this.selectedPlatform) {
            console.error('Aucune plateforme sélectionnée');
            return;
        }
        // this.loaderService.show();
        this.buttonsDisabled = true;
        this.postService
            .createOnePostFromAi(this.me._id, this.selectedPlatform)
            .subscribe({
                next: (response: any) => {
                    console.log(
                        'RETOUR (post ?) : ' + JSON.stringify(response.post._id)
                    );
                    console.log(
                        'Response CREATE ONE POST AUTO : ' +
                        JSON.stringify(response)
                    );
                    let postToSend = response.post;
                    postToSend.content = postToSend.content;
                    this.regenerateImage(postToSend);
                    // this.postService.sendPromptToAiImage
                    // this.getAllPosts(this.me);
                },
                error: (error) => {
                    console.error(
                        'Erreur lors de la création du post :',
                        error
                    );
                    this.buttonsDisabled = false;
                },
            });
    }

    async generateAllImages() {
        for (let i = 0; i < this.filteredPosts.length; i++) {
            if (!this.filteredPosts[i].imageUrl) {
                await this.regenerateImage(this.filteredPosts[i]);
            }
            this.buttonsDisabled = true;
        }
    }

    regenerateImage(post: any) {
        // this.loaderService.show();
        this.buttonsDisabled = true;
        // Logic to regenerate image with AI
        this.postService.sendPromptToAiImage(post._id).subscribe({
            next: (response) => {
                console.log(response);
                post.imageUrl = response.imageUrl;
                this.getAllPosts(this.me);
            },
            error: (error) => {
                console.error(
                    "Erreur lors de la génération de l'image:",
                    error
                );
                this.buttonsDisabled = false;
            },
        });
    }

    uploadNewImage(post: any) {
        // Logic to allow user to upload their own image
    }

    // Méthode pour mettre à jour la plateforme
    selectPlatform(platform: string) {
        console.log(`Selection de la plateforme : ${platform}`);
        this.contentType = 'posts';
        this.selectedPlatform = platform;
        this.selectedAdsType = '';
        this.filterPosts();
        this.tips = this.shuffleArray(this.tips);
    }

    selectAdsType(type: string) {
        console.log(`Selection de la plateforme : ${type}`);
        this.contentType = 'pubs';
        this.selectedAdsType = type;
        this.selectedPlatform = '';
        // this.filterPosts();
        // this.tips = this.shuffleArray(this.tips);
    }
    selectAuditType(type: string){
        console.log(`Selection de la plateforme : ${type}`);
        this.contentType = 'audit';
        this.selectedAdsType = type;
        this.selectedPlatform = '';
    }
    selectUGCType(type: string){
        console.log(`Selection de la plateforme : ${type}`);
        this.contentType = 'ugc';
        this.selectedAdsType = type;
        this.selectedPlatform = '';
    }
    selectComsType() {
        this.contentType = 'coms';
        this.selectedAdsType = 'coms';
        this.selectedPlatform = '';

    }

    // Méthode pour filtrer les publications en fonction de la plateforme sélectionnée
    filterPosts() {
        this.filteredPosts = this.posts.filter(
            (post) => post.platform === this.selectedPlatform
        );
    }

    isImage(url: string): boolean {
        console.log('URL : ' + url);
        const imageExtensions = [
            '.png',
            '.jpeg',
            '.jpg',
            '.gif',
            '.bmp',
            '.webp',
        ];
        const extension = url.substring(url.lastIndexOf('.')).toLowerCase();
        return imageExtensions.includes(extension);
    }

    removeHashtag(post: any, index: number): void {
        post.content.hashtags.splice(index, 1);
        post.content = JSON.stringify(post.content);
        this.postService.updatePostById(post._id, post).subscribe({
            next: (data: any) => {
                console.log('Hashtag supprimé');
                console.log(data);
                // post = data;
                // post.content = JSON.parse(post.content);
                this.getAllPosts(this.me);
            },
            error: (err: any) => {
                console.log('Erreur lors de la suppression du hashtag');
                this.buttonsDisabled = false;
            },
        });
    }

    openBlueskyLoginPopup(): void {
        const popupWidth = 400;
        const popupHeight = 600;
        const left = window.screenX + (window.innerWidth - popupWidth) / 2;
        const top = window.screenY + (window.innerHeight - popupHeight) / 2;
    
        const popup = window.open(
            '',
            'Bluesky Login',
            `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
        );
    
        if (popup) {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Connexion à Bluesky</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
                        :root {
                            --bluesky-blue: #0085ff;
                            --background-light: #f9f9f9;
                            --text-dark: #000;
                            --text-muted: #666;
                            --font-family: 'Inter', sans-serif;
                        }
                        body {
                            font-family: var(--font-family);
                            background-color: var(--background-light);
                            color: var(--text-dark);
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                        }
                        .bluesky-logo {
                            width: 60px;
                            height: 60px;
                            margin-bottom: 20px;
                        }
                        h1 {
                            color: var(--bluesky-blue);
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        p {
                            font-size: 14px;
                            color: var(--text-muted);
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        form {
                            width: 100%;
                            max-width: 300px;
                            text-align: left;
                        }
                        label {
                            font-size: 14px;
                            margin-bottom: 5px;
                            display: block;
                            color: var(--text-muted);
                        }
                        input {
                            width: 100%;
                            padding: 10px;
                            margin-bottom: 15px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        }
                        button {
                            width: 100%;
                            background: var(--bluesky-blue);
                            color: #fff;
                            border: none;
                            padding: 10px;
                            font-size: 16px;
                            font-weight: bold;
                            border-radius: 5px;
                            cursor: pointer;
                        }
                        button:hover {
                            background: #0072cc;
                        }
                    </style>
                </head>
                <body>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 320" class="bluesky-logo">
                        <path fill="#0085ff" d="M180 142c-16.3-31.7-60.7-90.8-102-120C38.5-5.9 23.4-1 13.5 3.4 2.1 8.6 0 26.2 0 36.5c0 10.4 5.7 84.8 9.4 97.2 12.2 41 55.7 55 95.7 50.5-58.7 8.6-110.8 30-42.4 106.1 75.1 77.9 103-16.7 117.3-64.6 14.3 48 30.8 139 116 64.6 64-64.6 17.6-97.5-41.1-106.1 40 4.4 83.5-9.5 95.7-50.5 3.7-12.4 9.4-86.8 9.4-97.2 0-10.3-2-27.9-13.5-33C336.5-1 321.5-6 282 22c-41.3 29.2-85.7 88.3-102 120Z"/>
                    </svg>
                    <h1>Connexion à Bluesky</h1>
                    <p>Veuillez entrer vos identifiants pour générer un jeton d'accès temporaire. Ces informations ne seront pas stockées.</p>
                    <form id="blueskyLoginForm">
                        <label for="handle">Handle (e.g., @username.bsky.social):</label>
                        <input type="text" id="handle" name="handle" required />
                        <label for="password">Mot de passe:</label>
                        <input type="password" id="password" name="password" required />
                        <button type="submit">Se connecter</button>
                    </form>
                    <script>
                        document.getElementById('blueskyLoginForm').addEventListener('submit', function(event) {
                            event.preventDefault();
                            const handle = document.getElementById('handle').value;
                            const password = document.getElementById('password').value;
                            window.opener.postMessage({ handle, password }, '*');
                            window.close();
                        });
                    </script>
                </body>
                </html>
            `;
            popup.document.write(htmlContent);
        }
    }









    /** PUB */
    
  getAdByUserId() {
    this.adService.getByUserId(this.me._id).subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.campagnes = data;
      },
      error: (error: any) => {
        console.log(error);
      },
    })
  }

  createNewAd() {
    console.log("CREATE PUB")
  }
    

  /** AUDIT */
  selectPlatformForAudit(platform: string): void {
    console.log(platform)
    this.selectedPlatformForAudit = platform;
  }
  
  handleFileUpload(event: any): void {
    const files = event.target.files;
    console.log('Fichiers téléversés pour', this.selectedPlatformForAudit, files);
  }
  
  launchAudit(): void {
    if (this.selectedPlatformForAudit) {
      console.log(`Audit lancé pour ${this.selectedPlatformForAudit}`);
      // Ajoutez ici votre logique d'analyse
    }
  }
}
