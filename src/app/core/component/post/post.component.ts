import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdService } from '../../services/ad.service';
import { PostService } from '../../services/post.service';
import { TipService } from '../../services/tips.service';
import { MediaService } from '../../services/media.service';
import { InstagramService } from '../../services/instagram.service';

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrl: './post.component.scss',
})
export class PostComponent implements OnInit {
    buttonsDisabled = true; // Permet de désactiver les boutons lorsque l'on récupère les posts
    addPostButtonDisabled = false;

    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

    @Input() me: any = {};
    @Input() posts: any[] = [];

    aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
    selectedPlatform: string = 'LinkedIn'; // Par défaut Instagram
    selectedAdsType: string = ''; // Par défaut none
    filteredPosts: any[] = [];
    selectedFile: File | null = null;
    tips: any[] = [];
    randomTip: any = null;
    contentType: string = 'posts';

    // pub
    campagnes: any[] = [];

    // audit
    platforms = [
        { name: 'Instagram', icon: 'assets/icons/instagram-icon.svg' },
        { name: 'LinkedIn', icon: 'assets/icons/linkedin-icon.svg' },
    ];

    selectedPlatformForAudit: string | null = null;

    platformDescriptions: { [key: string]: string } = {
        instagram:
            "Téléversez une capture de votre page de profil Instagram pour obtenir des suggestions d'amélioration.",
        linkedin:
            "Téléversez les captures de vos sections importantes (titre, résumé, expériences) pour obtenir des suggestions d'amélioration.",
    };

    caption = '';
    imageUrl = '';
    loading = false;
    successMessage = '';
    errorMessage = '';

    constructor(
        private postService: PostService,
        public sessionService: SessionService,
        private mediaService: MediaService,
        private userService: UserService,
        private tipsService: TipService,
        private _snackBar: MatSnackBar,
        private instagramService: InstagramService,
        // Pub
        private adService: AdService
    ) {}

    ngOnInit(): void {
        this.getAdByUserId();
        this.loadTips();
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

    publish(post: any) {
        if (this.selectedPlatform === 'Instagram') {
            this.publishToInstagram(post);
        } else {
            this.publishToLinkedin(post);
        }
    }

    publishToLinkedin(post: any) {
        console.log('Post envoyé à l’API LinkedIn :', post);

        this.successMessage = '';
        this.errorMessage = '';

        if (!post.content || !post.imageUrl) {
            this.errorMessage =
                'Le texte (content) et l’URL de l’image (imageUrl) sont obligatoires.';
            return;
        }

        this.loading = true;
        this.instagramService.publishLinkedinPost(post).subscribe({
            next: (res) => {
                this.loading = false;
                this.successMessage = 'Post LinkedIn publié avec succès ✅';

                // On recharge les posts pour mettre à jour le status (et on finit par reload la page)
                this.userService.getMe().subscribe({
                    next: (data: any) => {
                        this.me = data;
                        this.getAllPosts(data);
                        // Recharge complète de la page une fois tout terminé
                        window.location.reload();
                    },
                    error: (error: any) => {
                        console.log(error);
                        this.buttonsDisabled = false;
                    },
                });
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage =
                    err?.error?.message ||
                    'Erreur lors de la publication sur LinkedIn.';
            },
        });
    }

    publishToInstagram(post: any) {
        console.log('Post envoyé à l’API Instagram :', post);

        this.successMessage = '';
        this.errorMessage = '';

        if (!post.content || !post.imageUrl) {
            this.errorMessage =
                'Le texte (content) et l’URL de l’image (imageUrl) sont obligatoires.';
            return;
        }

        this.loading = true;
        this.instagramService.publishInstagramPost(post).subscribe({
            next: (res) => {
                this.loading = false;
                this.successMessage = 'Post Instagram publié avec succès ✅';

                this.userService.getMe().subscribe({
                    next: (data: any) => {
                        this.me = data;
                        this.getAllPosts(data);
                        // Recharge complète de la page une fois tout terminé
                        window.location.reload();
                    },
                    error: (error: any) => {
                        console.log(error);
                        this.buttonsDisabled = false;
                    },
                });
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage =
                    err?.error?.message || 'Erreur lors de la publication.';
            },
        });
    }

    shuffleArray(array: any[]): any[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
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
                oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${environment.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
                    environment.INSTAGRAM_REDIRECT_URI
                )}&response_type=code&scope=${instagramScopes}`;
                break;
            case 'linkedin':
                oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${environment.LINKEDIN_APP_ID}&redirect_uri=${encodeURIComponent(
                    environment.LINKEDIN_REDIRECT_URI
                )}&state=${platform}&scope=openid%20profile%20email%20w_member_social`;
                break;
            default:
                this.openSnackBar(`Plateforme ${platform} non prise en charge.`);
                return;
        }

        window.location.href = oauthUrl;
    }

    openSnackBar(phrase: string) {
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
                this.randomTip = this.getRandomTip();
                console.log('Random Tip :', this.randomTip);
            },
            error: (err: any) => {
                console.log(err);
            },
        });
    }

    public getRandomTip(): any {
        if (this.tips.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.tips.length);
            return this.tips[randomIndex];
        }
        return null;
    }

    getAllPosts(me: any) {
        this.posts = [];
        this.postService.getMonthlyPosts(me._id).subscribe({
            next: (data: any) => {
                console.log(data);
                this.posts = data.map((post: any) => {
                    return {
                        ...post,
                        content: JSON.parse(post.content),
                    };
                });
                this.regenerateImages(this.posts);
                if (!this.selectedPlatform) {
                    this.selectPlatform('Facebook');
                }
                this.filteredPosts = this.posts.filter(
                    (post) => post.platform === this.selectedPlatform
                );
                this.buttonsDisabled = false;
                console.log(this.posts);
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    editContentManually(post: any) {
        console.log(post.edit);

        if (!post.edit || post.edit === undefined) {
            post.contentToUpdate = post.content.caption;
            post.edit = true;
        } else {
            post.content.caption = post.contentToUpdate;
            const postClone = {
                ...post,
                content: JSON.stringify(post.content),
            };

            this.postService.updatePostById(postClone._id, postClone).subscribe({
                next: (data) => {
                    console.log(data);
                    post.content = JSON.parse(postClone.content);
                    post.edit = !post.edit;
                },
                error: (error) => {
                    console.log(error);
                },
            });
        }

        console.log(post.edit);
    }

    openFileSelector() {
        if (this.fileInput) {
            this.fileInput.nativeElement.click();
        } else {
            console.error("fileInput n'est pas encore initialisé.");
        }
    }

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
        console.log('POST: ' + JSON.stringify(post));

        this.postService
            .improveInstagramPost(post, this.selectedPlatform, this.me._id)
            .subscribe({
                next: (response: any) => {
                    post.content.caption = response.improved;
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

        this.postService.updateOnePostFromAi(this.me._id, post._id).subscribe({
            next: async (response: any) => {
                console.log('Response update one post :', response);
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
        this.buttonsDisabled = true;
        this.postService
            .createOnePostFromAi(this.me._id, this.selectedPlatform)
            .subscribe({
                next: (response: any) => {
                    console.log(
                        'Response CREATE ONE POST AUTO : ' +
                            JSON.stringify(response)
                    );
                    let postToSend = response.post;
                    postToSend.content = postToSend.content;
                    this.regenerateImage(postToSend);
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
        this.buttonsDisabled = true;
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

    regenerateImages(posts: any[]) {
        if (!posts || posts.length === 0) {
            return;
        }

        const postsWithoutImage = posts.filter(
            (p) => !p.imageUrl || p.imageUrl.trim() === ''
        );

        if (postsWithoutImage.length === 0) {
            console.log('Tous les posts ont déjà une image, rien à régénérer.');
            return;
        }

        this.buttonsDisabled = true;

        const postIds = postsWithoutImage.map((p) => p._id);

        this.postService.sendPromptsToAiImage(postIds).subscribe({
            next: (response) => {
                console.log('Résultat génération multiple :', response);

                if (response?.results && Array.isArray(response.results)) {
                    response.results.forEach((result: any) => {
                        if (result.success && result.imageUrl) {
                            const foundPost = this.posts?.find(
                                (p: any) => p._id === result.postId
                            );
                            if (foundPost) {
                                foundPost.imageUrl = result.imageUrl;
                            }
                        } else {
                            console.warn(
                                `Échec de génération pour le post ${result.postId} :`,
                                result.error
                            );
                        }
                    });
                }

                this.getAllPosts(this.me);

                this.buttonsDisabled = false;
            },
            error: (error) => {
                console.error(
                    'Erreur lors de la génération des images :',
                    error
                );
                this.buttonsDisabled = false;
            },
        });
    }

    uploadNewImage(post: any) {
        // Logic to allow user to upload their own image
    }

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
    }

    selectAuditType(type: string) {
        console.log(`Selection de la plateforme : ${type}`);
        this.contentType = 'audit';
        this.selectedAdsType = type;
        this.selectedPlatform = '';
    }

    selectUGCType(type: string) {
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
                this.getAllPosts(this.me);
            },
            error: (err: any) => {
                console.log('Erreur lors de la suppression du hashtag');
                this.buttonsDisabled = false;
            },
        });
    }

    getAdByUserId() {
        this.adService.getByUserId(this.me._id).subscribe({
            next: (data: any[]) => {
                console.log(data);
                this.campagnes = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    createNewAd() {
        console.log('CREATE PUB');
    }

    /** AUDIT */
    selectPlatformForAudit(platform: string): void {
        console.log(platform);
        this.selectedPlatformForAudit = platform;
    }

    handleFileUpload(event: any): void {
        const files = event.target.files;
        console.log(
            'Fichiers téléversés pour',
            this.selectedPlatformForAudit,
            files
        );
    }

    launchAudit(): void {
        if (this.selectedPlatformForAudit) {
            console.log(`Audit lancé pour ${this.selectedPlatformForAudit}`);
        }
    }
}
