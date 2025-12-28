interface SeoTranslation {
    title: string;
    description: string;
    keywords: string;
}

interface SeoTranslations {
    [lang: string]: {
        [page: string]: SeoTranslation;
    };
}

export const SEO_TRANSLATIONS: SeoTranslations = {
    fr: {
        'home': {
            title: 'izyGlam | Réservez et gérez vos prestations beauté à domicile',
            description: 'izyGlam est la plateforme tout-en-un pour réserver des prestations beauté à domicile et permettre aux professionnelles de gérer leurs rendez-vous, paiements et clients simplement.',
            keywords: 'izyGlam, beauté à domicile, réservation esthétique, plateforme beauté, gestion rendez-vous beauté'
        },
        'pricing': {
            title: 'Tarifs izyGlam | Des offres simples pour les professionnelles de la beauté',
            description: 'Découvrez les tarifs izyGlam : une solution claire et sans surprise pour gérer vos salons, réservations et clientes, que vous soyez indépendante ou gériez plusieurs salons.',
            keywords: 'tarifs izyGlam, abonnement beauté, logiciel salon esthétique, prix plateforme beauté'
        },
        'signup': {
            title: 'Inscription izyGlam | Créez votre compte gratuitement',
            description: 'Créez votre compte izyGlam en quelques minutes et commencez à gérer vos prestations beauté, réservations et paiements en toute simplicité.',
            keywords: 'inscription izyGlam, créer compte beauté, plateforme esthétique inscription'
        },
        'login': {
            title: 'Connexion izyGlam | Accédez à votre espace personnel',
            description: 'Connectez-vous à votre compte izyGlam pour gérer vos rendez-vous, clientes, salons et paiements en toute sécurité.',
            keywords: 'connexion izyGlam, login izyGlam, espace personnel beauté'
        },
        'cgu': {
            title: 'Conditions Générales d’Utilisation | izyGlam',
            description: 'Consultez les conditions générales d’utilisation de la plateforme izyGlam : droits, obligations, paiements, annulations et responsabilités.',
            keywords: 'CGU izyGlam, conditions utilisation plateforme beauté, mentions légales izyGlam'
        },
        'main': {
            title: 'Trouver un prestataire beauté à domicile | izyGlam',
            description: 'Recherchez une boutique ou un prestataire près de chez vous, parcourez les catégories (coiffure, manucure, massage…) et réservez facilement votre prestation beauté à domicile avec izyGlam.',
            keywords: 'prestataire beauté à domicile, réservation beauté, coiffure à domicile, manucure à domicile, massage à domicile, esthétique à domicile, izyGlam'
        },
        'profile': {
            title: 'Mon profil | izyGlam',
            description: 'Gérez vos informations personnelles, préférences et paramètres de compte sur izyGlam.',
            keywords: 'profil izyGlam, compte utilisateur beauté, paramètres compte izyGlam'
        },
        'shop': {
            title: 'Salon de beauté | Réservez votre prestation sur izyGlam',
            description: 'Découvrez ce salon de beauté sur izyGlam, consultez les prestations disponibles et réservez facilement votre rendez-vous à domicile.',
            keywords: 'salon beauté, réservation esthétique, prestation beauté à domicile, izyGlam salon'
        },
        'payement': {
            title: 'Paiement sécurisé | Réservation sur izyGlam',
            description: 'Finalisez votre réservation en toute sécurité sur izyGlam. Paiement par carte bancaire, confirmation rapide et protection client.',
            keywords: 'paiement sécurisé beauté, réservation esthétique paiement, izyGlam paiement'
        },
        'order': {
            title: 'Mes réservations | izyGlam',
            description: 'Consultez l’historique de vos réservations et prestations effectuées ou à venir sur izyGlam.',
            keywords: 'mes réservations izyGlam, commandes beauté, historique prestations'
        },
        'favorite': {
            title: 'Mes favoris | izyGlam',
            description: 'Retrouvez vos salons et prestataires favoris pour réserver vos prestations beauté encore plus rapidement.',
            keywords: 'favoris beauté, salons favoris, prestataires favoris izyGlam'
        },
        'help': {
            title: 'Centre d’aide | izyGlam',
            description: 'Besoin d’aide ? Consultez le centre d’assistance izyGlam pour trouver des réponses rapides à vos questions.',
            keywords: 'aide izyGlam, support plateforme beauté, assistance réservation'
        },
        'pro': {
            title: 'Devenez prestataire beauté à domicile | izyGlam',
            description: 'Rejoignez izyGlam et développez votre activité de beauté à domicile. Gérez vos clientes, réservations et paiements simplement.',
            keywords: 'devenir prestataire beauté, esthétique à domicile, plateforme professionnelle beauté, izyGlam pro'
        }

    },
    en: {
        home: {
            title: 'izyGlam | Book and manage at-home beauty services',
            description: 'izyGlam is the all-in-one platform to book at-home beauty services and help professionals manage appointments, payments, and clients with ease.',
            keywords: 'izyGlam, at-home beauty, beauty booking, beauty platform, beauty appointment management'
        },
        pricing: {
            title: 'izyGlam Pricing | Simple plans for beauty professionals',
            description: 'Explore izyGlam pricing: clear, no-surprise plans to manage salons, bookings, and clients—whether you’re solo or running multiple salons.',
            keywords: 'izyGlam pricing, beauty subscription, salon management software, beauty platform price'
        },
        signup: {
            title: 'Sign up | Create your free izyGlam account',
            description: 'Create your izyGlam account in minutes and start managing your beauty services, bookings, and payments effortlessly.',
            keywords: 'izyGlam sign up, create beauty account, beauty platform registration'
        },
        login: {
            title: 'Log in | Access your izyGlam account',
            description: 'Log in to your izyGlam account to manage bookings, clients, salons, and payments securely.',
            keywords: 'izyGlam login, beauty account login, client booking management'
        },
        cgu: {
            title: 'Terms of Use | izyGlam',
            description: 'Read izyGlam’s Terms of Use: rights, obligations, payments, cancellations, and responsibilities on the platform.',
            keywords: 'izyGlam terms, terms of use, legal information, beauty platform'
        },
        main: {
            title: 'Find an at-home beauty professional | izyGlam',
            description: 'Search for a salon or professional near you, browse categories (hair, nails, massage…), and book your at-home beauty service with izyGlam.',
            keywords: 'at-home beauty professional, beauty booking, at-home hair, at-home manicure, at-home massage, at-home aesthetics, izyGlam'
        },
        profile: {
            title: 'My profile | izyGlam',
            description: 'Manage your personal details, preferences, and account settings on izyGlam.',
            keywords: 'izyGlam profile, account settings, beauty user account'
        },
        shop: {
            title: 'Beauty salon | Book your service on izyGlam',
            description: 'Discover this beauty salon on izyGlam, view available services, and book your at-home appointment easily.',
            keywords: 'beauty salon, beauty booking, at-home beauty service, izyGlam salon'
        },
        payement: {
            title: 'Secure payment | Book on izyGlam',
            description: 'Complete your booking securely on izyGlam. Card payment, quick confirmation, and customer protection.',
            keywords: 'secure beauty payment, booking payment, izyGlam payment'
        },
        order: {
            title: 'My bookings | izyGlam',
            description: 'View your booking history and upcoming at-home beauty services on izyGlam.',
            keywords: 'izyGlam bookings, beauty orders, appointment history'
        },
        favorite: {
            title: 'My favorites | izyGlam',
            description: 'Find your favorite salons and professionals to book your at-home beauty services faster.',
            keywords: 'beauty favorites, favorite salons, favorite professionals, izyGlam'
        },
        help: {
            title: 'Help center | izyGlam',
            description: 'Need help? Visit the izyGlam help center to quickly find answers to your questions.',
            keywords: 'izyGlam help, support, booking assistance, beauty platform support'
        },
        pro: {
            title: 'Become an at-home beauty provider | izyGlam',
            description: 'Join izyGlam and grow your at-home beauty business. Manage clients, bookings, and payments with ease.',
            keywords: 'become a beauty provider, at-home aesthetics, beauty professional platform, izyGlam pro'
        }
    },
    de: {
        home: {
            title: 'izyGlam | Beauty-Services zu Hause buchen und verwalten',
            description: 'izyGlam ist die All-in-One-Plattform, um Beauty-Services zu Hause zu buchen und Profis bei Terminen, Zahlungen und Kundinnen zu unterstützen.',
            keywords: 'izyGlam, Beauty zu Hause, Beauty buchen, Beauty Plattform, Terminverwaltung Beauty'
        },
        pricing: {
            title: 'izyGlam Preise | Einfache Tarife für Beauty-Profis',
            description: 'Entdecken Sie die izyGlam Tarife: klare Angebote ohne Überraschungen – für Solo-Profis oder mehrere Salons.',
            keywords: 'izyGlam Preise, Beauty Abo, Salonsoftware, Beauty Plattform Preis'
        },
        signup: {
            title: 'Registrieren | Kostenloses izyGlam Konto erstellen',
            description: 'Erstellen Sie in wenigen Minuten Ihr izyGlam Konto und verwalten Sie Leistungen, Buchungen und Zahlungen ganz einfach.',
            keywords: 'izyGlam Registrierung, Beauty Konto erstellen, Beauty Plattform anmelden'
        },
        login: {
            title: 'Anmelden | Zugriff auf Ihr izyGlam Konto',
            description: 'Melden Sie sich an, um Buchungen, Kundinnen, Salons und Zahlungen sicher zu verwalten.',
            keywords: 'izyGlam Login, Beauty Anmeldung, Terminverwaltung'
        },
        cgu: {
            title: 'Nutzungsbedingungen | izyGlam',
            description: 'Lesen Sie die Nutzungsbedingungen von izyGlam: Rechte, Pflichten, Zahlungen, Stornierungen und Verantwortlichkeiten.',
            keywords: 'izyGlam Nutzungsbedingungen, AGB, rechtliche Hinweise, Beauty Plattform'
        },
        main: {
            title: 'Beauty-Profi zu Hause finden | izyGlam',
            description: 'Suchen Sie einen Salon oder Profi in Ihrer Nähe, entdecken Sie Kategorien (Haare, Nägel, Massage …) und buchen Sie Ihren Beauty-Termin zu Hause mit izyGlam.',
            keywords: 'Beauty Profi zu Hause, Beauty Buchung, Friseur zu Hause, Maniküre zu Hause, Massage zu Hause, izyGlam'
        },
        profile: {
            title: 'Mein Profil | izyGlam',
            description: 'Verwalten Sie persönliche Daten, Einstellungen und Präferenzen auf izyGlam.',
            keywords: 'izyGlam Profil, Kontoeinstellungen, Beauty Nutzerkonto'
        },
        shop: {
            title: 'Beauty-Salon | Service auf izyGlam buchen',
            description: 'Entdecken Sie diesen Beauty-Salon auf izyGlam, sehen Sie Leistungen und buchen Sie Ihren Termin zu Hause ganz einfach.',
            keywords: 'Beauty Salon, Beauty Buchung, Beauty Service zu Hause, izyGlam Salon'
        },
        payement: {
            title: 'Sichere Zahlung | Buchung auf izyGlam',
            description: 'Schließen Sie Ihre Buchung sicher ab: Kartenzahlung, schnelle Bestätigung und Kundenschutz auf izyGlam.',
            keywords: 'sichere Zahlung Beauty, Buchung Zahlung, izyGlam Zahlung'
        },
        order: {
            title: 'Meine Buchungen | izyGlam',
            description: 'Sehen Sie Ihre vergangenen und kommenden Beauty-Buchungen zu Hause auf izyGlam.',
            keywords: 'izyGlam Buchungen, Beauty Bestellungen, Terminverlauf'
        },
        favorite: {
            title: 'Meine Favoriten | izyGlam',
            description: 'Finden Sie Ihre Lieblingssalons und Profis, um schneller zu buchen.',
            keywords: 'Beauty Favoriten, Lieblingssalons, Lieblingsprofis, izyGlam'
        },
        help: {
            title: 'Hilfe | izyGlam',
            description: 'Brauchen Sie Hilfe? Im izyGlam Hilfe-Center finden Sie schnell Antworten.',
            keywords: 'izyGlam Hilfe, Support, Buchung Hilfe, Beauty Plattform'
        },
        pro: {
            title: 'Beauty-Anbieter werden | izyGlam',
            description: 'Treten Sie izyGlam bei und entwickeln Sie Ihr Beauty-Business zu Hause. Verwalten Sie Kundinnen, Buchungen und Zahlungen einfach.',
            keywords: 'Beauty Anbieter werden, Kosmetik zu Hause, Plattform für Beauty-Profis, izyGlam pro'
        }
    },
    es: {
        home: {
            title: 'izyGlam | Reserva y gestiona servicios de belleza a domicilio',
            description: 'izyGlam es la plataforma todo-en-uno para reservar belleza a domicilio y ayudar a profesionales a gestionar citas, pagos y clientas fácilmente.',
            keywords: 'izyGlam, belleza a domicilio, reserva estética, plataforma belleza, gestión citas belleza'
        },
        pricing: {
            title: 'Precios izyGlam | Planes simples para profesionales de belleza',
            description: 'Descubre los precios de izyGlam: planes claros, sin sorpresas, para gestionar salones, reservas y clientas.',
            keywords: 'precios izyGlam, suscripción belleza, software salón, precio plataforma belleza'
        },
        signup: {
            title: 'Registro | Crea tu cuenta gratuita en izyGlam',
            description: 'Crea tu cuenta izyGlam en minutos y empieza a gestionar servicios, reservas y pagos de forma sencilla.',
            keywords: 'registro izyGlam, crear cuenta belleza, alta plataforma estética'
        },
        login: {
            title: 'Iniciar sesión | Accede a tu cuenta izyGlam',
            description: 'Inicia sesión para gestionar reservas, clientas, salones y pagos de forma segura.',
            keywords: 'login izyGlam, iniciar sesión belleza, gestión reservas'
        },
        cgu: {
            title: 'Términos de uso | izyGlam',
            description: 'Consulta los términos de uso de izyGlam: derechos, obligaciones, pagos, cancelaciones y responsabilidades.',
            keywords: 'términos izyGlam, condiciones de uso, legal, plataforma belleza'
        },
        main: {
            title: 'Encuentra un profesional de belleza a domicilio | izyGlam',
            description: 'Busca un salón o profesional cerca, explora categorías (peluquería, uñas, masaje…) y reserva tu servicio de belleza a domicilio con izyGlam.',
            keywords: 'profesional belleza a domicilio, reservar belleza, peluquería a domicilio, manicura a domicilio, masaje a domicilio, estética a domicilio, izyGlam'
        },
        profile: {
            title: 'Mi perfil | izyGlam',
            description: 'Gestiona tus datos personales, preferencias y ajustes de cuenta en izyGlam.',
            keywords: 'perfil izyGlam, ajustes cuenta, usuario belleza'
        },
        shop: {
            title: 'Salón de belleza | Reserva en izyGlam',
            description: 'Descubre este salón en izyGlam, consulta servicios disponibles y reserva tu cita a domicilio fácilmente.',
            keywords: 'salón de belleza, reserva estética, servicio belleza a domicilio, izyGlam salón'
        },
        payement: {
            title: 'Pago seguro | Reserva en izyGlam',
            description: 'Finaliza tu reserva con seguridad: pago con tarjeta, confirmación rápida y protección al cliente.',
            keywords: 'pago seguro belleza, pago reserva, izyGlam pago'
        },
        order: {
            title: 'Mis reservas | izyGlam',
            description: 'Consulta tu historial y próximas reservas de belleza a domicilio en izyGlam.',
            keywords: 'mis reservas izyGlam, pedidos belleza, historial citas'
        },
        favorite: {
            title: 'Mis favoritos | izyGlam',
            description: 'Encuentra tus salones y profesionales favoritos para reservar más rápido.',
            keywords: 'favoritos belleza, salones favoritos, profesionales favoritos, izyGlam'
        },
        help: {
            title: 'Centro de ayuda | izyGlam',
            description: '¿Necesitas ayuda? Visita el centro de ayuda de izyGlam para encontrar respuestas rápidamente.',
            keywords: 'ayuda izyGlam, soporte, asistencia reservas, plataforma belleza'
        },
        pro: {
            title: 'Conviértete en proveedor de belleza a domicilio | izyGlam',
            description: 'Únete a izyGlam y haz crecer tu negocio de belleza a domicilio. Gestiona clientas, reservas y pagos fácilmente.',
            keywords: 'ser profesional belleza, estética a domicilio, plataforma profesionales, izyGlam pro'
        }
    },
    nl: {
        'home': {
            title: 'Home | izyGlam',
            description: 'Welkom bij izyGlam, uw partner voor social media management.',
            keywords: 'SEO, Marketing, Social Media, Invloed'
        },
        'pricing': {
            title: 'Prijzen | izyGlam - Diensten op maat van uw budget',
            description: 'Ontdek onze competitieve plannen voor social media management en SEO.',
            keywords: 'Prijzen, Social Media, SEO, Marketing, izyGlam'
        },
        'login': {
            title: 'Inloggen | izyGlam - Toegang tot uw dashboard',
            description: 'Log in op uw izyGlam-account om uw social media en SEO te beheren.',
            keywords: 'Inloggen, Dashboard, Social Media Management, izyGlam'
        },
        'signup': {
            title: 'Aanmelden | Meld je vandaag nog aan bij izyGlam',
            description: 'Meld je aan bij izyGlam om toegang te krijgen tot krachtige tools voor social media management en SEO.',
            keywords: 'Aanmelden, Account maken, izyGlam'
        },
        'cgu': {
            title: 'Algemene Voorwaarden | izyGlam - Uw rechten en verplichtingen',
            description: 'Lees de algemene voorwaarden van izyGlam. Transparantie en naleving om het optimale gebruik van onze social media managementdiensten te waarborgen.',
            keywords: 'Algemene voorwaarden, Juridische informatie, izyGlam, Social Media Management'
        }
    },
    it: {
        'home': {
            title: 'Home | izyGlam',
            description: 'Benvenuto su izyGlam, il tuo partner per la gestione dei social media.',
            keywords: 'SEO, Marketing, Social Media, Influenza'
        },
        'pricing': {
            title: 'Prezzi | izyGlam - Servizi su misura per il tuo budget',
            description: 'Scopri i nostri piani competitivi per la gestione dei social media e SEO.',
            keywords: 'Prezzi, Social Media, SEO, Marketing, izyGlam'
        },
        'login': {
            title: 'Login | izyGlam - Accedi alla tua dashboard',
            description: 'Accedi al tuo account izyGlam per gestire i tuoi social media e SEO.',
            keywords: 'Login, Dashboard, Social Media Management, izyGlam'
        },
        'signup': {
            title: 'Registrati | Unisciti a izyGlam oggi',
            description: 'Registrati su izyGlam per accedere a strumenti potenti per la gestione dei social media e SEO.',
            keywords: 'Registrati, Crea account, izyGlam'
        },
        'cgu': {
            title: 'Termini e Condizioni | izyGlam - I tuoi diritti e doveri',
            description: 'Leggi i termini e le condizioni di izyGlam. Trasparenza e conformità per garantire l\'uso ottimale dei nostri servizi di gestione dei social media.',
            keywords: 'Termini e condizioni, Informazioni legali, izyGlam, Social Media Management'
        }
    },
    sv: {
        'home': {
            title: 'Hem | izyGlam',
            description: 'Välkommen till izyGlam, din partner för sociala medier hantering.',
            keywords: 'SEO, Marknadsföring, Sociala Medier, Inflytande'
        },
        'pricing': {
            title: 'Priser | izyGlam - Tjänster anpassade till din budget',
            description: 'Upptäck våra konkurrenskraftiga planer för sociala medier hantering och SEO.',
            keywords: 'Priser, Sociala Medier, SEO, Marknadsföring, izyGlam'
        },
        'login': {
            title: 'Logga in | izyGlam - Tillgång till din dashboard',
            description: 'Logga in på ditt izyGlam-konto för att hantera dina sociala medier och SEO.',
            keywords: 'Logga in, Dashboard, Social Media Management, izyGlam'
        },
        'signup': {
            title: 'Registrera | Gå med i izyGlam idag',
            description: 'Registrera dig på izyGlam för att få tillgång till kraftfulla verktyg för sociala medier hantering och SEO.',
            keywords: 'Registrera, Skapa konto, izyGlam'
        },
        'cgu': {
            title: 'Villkor | izyGlam - Dina rättigheter och skyldigheter',
            description: 'Läs igenom izanGlow’s villkor. Transparens och efterlevnad för att säkerställa optimal användning av våra tjänster för sociala medier.',
            keywords: 'Villkor, Legal information, izyGlam, Social Media Management'
        }
    },
    pl: {
        'home': {
            title: 'Strona główna | izyGlam',
            description: 'Witamy w izyGlam, twoim partnerze w zarządzaniu mediami społecznościowymi.',
            keywords: 'SEO, Marketing, Media społecznościowe, Wpływ'
        },
        'pricing': {
            title: 'Ceny | izyGlam - Usługi dostosowane do twojego budżetu',
            description: 'Odkryj nasze konkurencyjne plany dotyczące zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Ceny, Media społecznościowe, SEO, Marketing, izyGlam'
        },
        'login': {
            title: 'Zaloguj się | izyGlam - Uzyskaj dostęp do swojego pulpitu',
            description: 'Zaloguj się na swoje konto w izyGlam, aby zarządzać swoimi mediami społecznościowymi i SEO.',
            keywords: 'Zaloguj się, Pulpit, Zarządzanie mediami społecznościowymi, izyGlam'
        },
        'signup': {
            title: 'Zarejestruj się | Dołącz do izyGlam dzisiaj',
            description: 'Zarejestruj się w izyGlam, aby uzyskać dostęp do potężnych narzędzi do zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Zarejestruj się, Utwórz konto, izyGlam'
        },
        'cgu': {
            title: 'Warunki korzystania | izyGlam - Twoje prawa i obowiązki',
            description: 'Przeczytaj warunki korzystania z usług izyGlam. Przejrzystość i zgodność zapewniające optymalne korzystanie z naszych usług zarządzania mediami społecznościowymi.',
            keywords: 'Warunki, Informacje prawne, izyGlam, Zarządzanie mediami społecznościowymi'
        }
    },
    ko: {
        'home': {
            title: '홈 | izyGlam',
            description: 'izyGlam에 오신 것을 환영합니다, 소셜 미디어 관리 파트너.',
            keywords: 'SEO, 마케팅, 소셜 미디어, 영향력'
        },
        'pricing': {
            title: '가격 | izyGlam - 예산에 맞춘 서비스',
            description: '소셜 미디어 관리와 SEO를 위한 경쟁력 있는 요금제를 알아보세요.',
            keywords: '가격, 소셜 미디어, SEO, 마케팅, izyGlam'
        },
        'login': {
            title: '로그인 | izyGlam - 대시보드에 액세스',
            description: 'izyGlam 계정에 로그인하여 소셜 미디어와 SEO를 관리하세요.',
            keywords: '로그인, 대시보드, 소셜 미디어 관리, izyGlam'
        },
        'signup': {
            title: '가입 | 오늘 izyGlam에 가입하세요',
            description: 'izyGlam에 가입하여 소셜 미디어 관리와 SEO를 위한 강력한 도구에 접근하세요.',
            keywords: '가입, 계정 만들기, izyGlam'
        },
        'cgu': {
            title: '이용 약관 | izyGlam - 귀하의 권리와 의무',
            description: 'izyGlam의 이용 약관을 읽어보세요. 소셜 미디어 관리 서비스를 최적화하여 투명성과 준수 보장.',
            keywords: '이용 약관, 법적 정보, izyGlam, 소셜 미디어 관리'
        }
    },
    ru: {
        'home': {
            title: 'Главная | izyGlam',
            description: 'Добро пожаловать в izyGlam, вашего партнера по управлению социальными медиа.',
            keywords: 'SEO, Маркетинг, Социальные медиа, Влияние'
        },
        'pricing': {
            title: 'Цены | izyGlam - Услуги, соответствующие вашему бюджету',
            description: 'Ознакомьтесь с нашими конкурентоспособными планами по управлению социальными медиа и SEO.',
            keywords: 'Цены, Социальные медиа, SEO, Маркетинг, izyGlam'
        },
        'login': {
            title: 'Войти | izyGlam - Доступ к вашему дашборду',
            description: 'Войдите в свой аккаунт izyGlam для управления социальными медиа и SEO.',
            keywords: 'Войти, Дашборд, Управление социальными медиа, izyGlam'
        },
        'signup': {
            title: 'Регистрация | Присоединяйтесь к izyGlam сегодня',
            description: 'Зарегистрируйтесь в izyGlam, чтобы получить доступ к мощным инструментам для управления социальными медиа и SEO.',
            keywords: 'Регистрация, Создать аккаунт, izyGlam'
        },
        'cgu': {
            title: 'Условия использования | izyGlam - Ваши права и обязанности',
            description: 'Прочитайте условия использования службы izyGlam. Прозрачность и соблюдение для оптимального использования наших услуг по управлению социальными медиа.',
            keywords: 'Условия использования, Юридическая информация, izyGlam, Управление социальными медиа'
        }
    },
    ja: {
        'home': {
            title: 'ホーム | izyGlam',
            description: 'izyGlamへようこそ、あなたのソーシャルメディア管理パートナー。',
            keywords: 'SEO, マーケティング, ソーシャルメディア, 影響力'
        },
        'pricing': {
            title: '料金 | izyGlam - あなたの予算に合わせたサービス',
            description: 'ソーシャルメディア管理とSEOの競争力のあるプランを発見してください。',
            keywords: '料金, ソーシャルメディア, SEO, マーケティング, izyGlam'
        },
        'login': {
            title: 'ログイン | izyGlam - ダッシュボードにアクセス',
            description: 'izyGlamアカウントにログインしてソーシャルメディアとSEOを管理しましょう。',
            keywords: 'ログイン, ダッシュボード, ソーシャルメディア管理, izyGlam'
        },
        'signup': {
            title: 'サインアップ | 今日izyGlamに参加しよう',
            description: 'izyGlamにサインアップして、ソーシャルメディア管理とSEOのための強力なツールを活用しましょう。',
            keywords: 'サインアップ, アカウント作成, izyGlam'
        },
        'cgu': {
            title: '利用規約 | izyGlam - あなたの権利と義務',
            description: 'izyGlamの利用規約をお読みください。ソーシャルメディア管理サービスを最適に利用するための透明性とコンプライアンス。',
            keywords: '利用規約, 法的情報, izyGlam, ソーシャルメディア管理'
        }
    }, zh: {
        'home': {
            title: '首页 | izyGlam',
            description: '欢迎来到izyGlam，您的社交媒体管理合作伙伴。',
            keywords: 'SEO, 营销, 社交媒体, 影响力'
        },
        'pricing': {
            title: '定价 | izyGlam - 量身定制的服务',
            description: '发现我们具有竞争力的社交媒体管理和SEO计划。',
            keywords: '定价, 社交媒体, SEO, 营销, izyGlam'
        },
        'login': {
            title: '登录 | izyGlam - 访问您的仪表板',
            description: '登录您的izyGlam帐户，管理您的社交媒体和SEO。',
            keywords: '登录, 仪表板, 社交媒体管理, izyGlam'
        },
        'signup': {
            title: '注册 | 今天就加入izyGlam',
            description: '在izyGlam注册，使用强大的社交媒体管理和SEO工具。',
            keywords: '注册, 创建账户, izyGlam'
        },
        'cgu': {
            title: '使用条款 | izyGlam - 您的权利和义务',
            description: '阅读izyGlam的使用条款。透明度和合规性确保您能够最优化使用我们的社交媒体管理服务。',
            keywords: '使用条款, 法律信息, izyGlam, 社交媒体管理'
        }
    },
    ar: {
        'home': {
            title: 'الرئيسية | izyGlam',
            description: 'مرحبًا بكم في izyGlam، شريككم في إدارة وسائل التواصل الاجتماعي.',
            keywords: 'SEO, تسويق, وسائل التواصل الاجتماعي, تأثير'
        },
        'pricing': {
            title: 'الأسعار | izyGlam - خدمات تناسب ميزانيتك',
            description: 'اكتشف خططنا التنافسية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'الأسعار, وسائل التواصل الاجتماعي, SEO, تسويق, izyGlam'
        },
        'login': {
            title: 'تسجيل الدخول | izyGlam - الوصول إلى لوحة التحكم',
            description: 'تسجيل الدخول إلى حسابك على izyGlam لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'تسجيل الدخول, لوحة التحكم, إدارة وسائل التواصل الاجتماعي, izyGlam'
        },
        'signup': {
            title: 'التسجيل | انضم إلى izyGlam اليوم',
            description: 'قم بالتسجيل في izyGlam للوصول إلى أدوات قوية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'التسجيل, إنشاء حساب, izyGlam'
        },
        'cgu': {
            title: 'الشروط والأحكام | izyGlam - حقوقك وواجباتك',
            description: 'اطلع على شروط الاستخدام الخاصة بـizyGlam. الشفافية والامتثال لضمان الاستخدام الأمثل لخدماتنا لإدارة وسائل التواصل الاجتماعي.',
            keywords: 'الشروط والأحكام, المعلومات القانونية, izyGlam, إدارة وسائل التواصل الاجتماعي'
        }
    },
    tr: {
        'home': {
            title: 'Ana Sayfa | izyGlam',
            description: 'izyGlam\'a hoş geldiniz, sosyal medya yönetimi partneriniz.',
            keywords: 'SEO, Pazarlama, Sosyal Medya, Etki'
        },
        'pricing': {
            title: 'Fiyatlandırma | izyGlam - Bütçenize uygun hizmetler',
            description: 'Sosyal medya yönetimi ve SEO için rekabetçi planlarımızı keşfedin.',
            keywords: 'Fiyatlandırma, Sosyal Medya, SEO, Pazarlama, izyGlam'
        },
        'login': {
            title: 'Giriş Yap | izyGlam - Gösterge tablonuza erişin',
            description: 'Sosyal medya ve SEO yönetmek için izyGlam hesabınıza giriş yapın.',
            keywords: 'Giriş Yap, Gösterge Tablosu, Sosyal Medya Yönetimi, izyGlam'
        },
        'signup': {
            title: 'Kaydol | Bugün izyGlam\'a katılın',
            description: 'Sosyal medya yönetimi ve SEO için güçlü araçlara erişmek için izyGlam\'a kaydolun.',
            keywords: 'Kaydol, Hesap Oluştur, izyGlam'
        },
        'cgu': {
            title: 'Hizmet Şartları | izyGlam - Haklarınız ve Yükümlülükleriniz',
            description: 'izyGlam\'ın kullanım şartlarını okuyun. Şeffaflık ve uyum, sosyal medya yönetimi hizmetlerimizi optimal bir şekilde kullanmanızı sağlar.',
            keywords: 'Hizmet Şartları, Hukuki Bilgiler, izyGlam, Sosyal Medya Yönetimi'
        }
    },
    vi: {
        'home': {
            title: 'Trang chủ | izyGlam',
            description: 'Chào mừng đến với izyGlam, đối tác quản lý mạng xã hội của bạn.',
            keywords: 'SEO, Tiếp thị, Mạng xã hội, Ảnh hưởng'
        },
        'pricing': {
            title: 'Giá cả | izyGlam - Dịch vụ phù hợp với ngân sách của bạn',
            description: 'Khám phá các gói dịch vụ cạnh tranh của chúng tôi cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Giá cả, Mạng xã hội, SEO, Tiếp thị, izyGlam'
        },
        'login': {
            title: 'Đăng nhập | izyGlam - Truy cập vào bảng điều khiển của bạn',
            description: 'Đăng nhập vào tài khoản izyGlam của bạn để quản lý mạng xã hội và SEO.',
            keywords: 'Đăng nhập, Bảng điều khiển, Quản lý mạng xã hội, izyGlam'
        },
        'signup': {
            title: 'Đăng ký | Tham gia izyGlam hôm nay',
            description: 'Đăng ký tại izyGlam để truy cập vào các công cụ mạnh mẽ cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Đăng ký, Tạo tài khoản, izyGlam'
        },
        'cgu': {
            title: 'Điều khoản sử dụng | izyGlam - Quyền lợi và nghĩa vụ của bạn',
            description: 'Đọc các điều khoản sử dụng của izyGlam. Minh bạch và tuân thủ để đảm bảo sử dụng tối ưu dịch vụ quản lý mạng xã hội của chúng tôi.',
            keywords: 'Điều khoản sử dụng, Thông tin pháp lý, izyGlam, Quản lý mạng xã hội'
        }
    }
};
