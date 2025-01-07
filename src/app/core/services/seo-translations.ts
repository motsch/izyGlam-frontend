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
        home: {
            title: 'Accueil | izyGlow',
            description: 'Bienvenue sur izyGlow, votre partenaire pour la gestion des médias sociaux.',
            keywords: 'SEO, Marketing, Réseaux Sociaux, Influence'
        },
        pricing: {
            title: 'Tarifs | izyGlow - Des services adaptés à votre budget',
            description: 'Découvrez nos offres compétitives pour la gestion des réseaux sociaux et le SEO.',
            keywords: 'Tarifs, Marketing digital, iziGlow'
        },
        login: {
            title: 'Connexion | izyGlow - Accédez à votre tableau de bord',
            description: 'Connectez-vous à votre compte izyGlow pour gérer vos réseaux sociaux.',
            keywords: 'Connexion, Tableau de bord, Login iziGlow'
        },
        signup: {
            title: 'Inscription | Rejoignez izyGlow dès maintenant',
            description: 'Inscrivez-vous sur izyGlow pour gérer vos réseaux sociaux et optimiser votre SEO.',
            keywords: 'Inscription, Créer un compte, iziGlow'
        },
        cgu: {
            title: 'Conditions Générales d’Utilisation | izyGlow - Vos droits et obligations',
            description: 'Découvrez les conditions générales d’utilisation de izyGlow. Transparence et conformité pour une utilisation optimale de nos services de gestion des réseaux sociaux.',
            keywords: 'CGU, Conditions générales d’utilisation, iziGlow, Mentions légales, Gestion des réseaux sociaux'
        }
    },
    en: {
        home: {
            title: 'Home | izyGlow',
            description: 'Welcome to izyGlow, your partner for social media management.',
            keywords: 'SEO, Marketing, Social Media, Influence'
        },
        pricing: {
            title: 'Pricing | izyGlow - Services tailored to your budget',
            description: 'Discover our competitive plans for social media management and SEO.',
            keywords: 'Pricing, Social Media, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Login | izyGlow - Access your dashboard',
            description: 'Log in to your izyGlow account to manage your social media and SEO.',
            keywords: 'Login, Dashboard, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Sign Up | Join izyGlow today',
            description: 'Sign up on izyGlow to access powerful tools for social media management and SEO.',
            keywords: 'Sign Up, Create Account, iziGlow'
        },
        cgu: {
            title: 'Terms and Conditions | izyGlow - Your rights and obligations',
            description: 'Read izyGlow’s terms and conditions. Transparency and compliance to ensure the optimal use of our social media management services.',
            keywords: 'Terms and Conditions, Legal Information, izyGlow, Social Media Management'
        }
    },
    de: {
        home: {
            title: 'Startseite | izyGlow',
            description: 'Willkommen bei izyGlow, Ihrem Partner für Social-Media-Management.',
            keywords: 'SEO, Marketing, Social Media, Einfluss'
        },
        pricing: {
            title: 'Preise | izyGlow - Services, die zu Ihrem Budget passen',
            description: 'Entdecken Sie unsere wettbewerbsfähigen Pläne für Social-Media-Management und SEO.',
            keywords: 'Preise, Social Media, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Anmelden | izyGlow - Greifen Sie auf Ihr Dashboard zu',
            description: 'Melden Sie sich bei Ihrem izyGlow-Konto an, um Ihre Social Media und SEO zu verwalten.',
            keywords: 'Anmelden, Dashboard, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Registrieren | Melden Sie sich noch heute bei izyGlow an',
            description: 'Registrieren Sie sich bei izyGlow, um leistungsstarke Tools für Social Media Management und SEO zu nutzen.',
            keywords: 'Registrieren, Konto erstellen, iziGlow'
        },
        cgu: {
            title: 'Nutzungsbedingungen | izyGlow - Ihre Rechte und Pflichten',
            description: 'Lesen Sie die Nutzungsbedingungen von izyGlow. Transparenz und Compliance, um die optimale Nutzung unserer Social-Media-Management-Dienste zu gewährleisten.',
            keywords: 'Nutzungsbedingungen, Rechtliche Informationen, iziGlow, Social Media Management'
        }
    },
    es: {
        home: {
            title: 'Inicio | izyGlow',
            description: 'Bienvenido a izyGlow, tu socio para la gestión de redes sociales.',
            keywords: 'SEO, Marketing, Redes Sociales, Influencia'
        },
        pricing: {
            title: 'Precios | izyGlow - Servicios adaptados a tu presupuesto',
            description: 'Descubre nuestros planes competitivos para la gestión de redes sociales y SEO.',
            keywords: 'Precios, Redes Sociales, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Iniciar sesión | izyGlow - Accede a tu panel de control',
            description: 'Inicia sesión en tu cuenta de izyGlow para gestionar tus redes sociales.',
            keywords: 'Iniciar sesión, Panel de control, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Registro | Únete a izyGlow hoy',
            description: 'Regístrate en izyGlow para acceder a potentes herramientas para la gestión de redes sociales y SEO.',
            keywords: 'Registro, Crear cuenta, iziGlow'
        },
        cgu: {
            title: 'Términos y Condiciones | izyGlow - Tus derechos y obligaciones',
            description: 'Lee los términos y condiciones de izyGlow. Transparencia y cumplimiento para asegurar el uso óptimo de nuestros servicios de gestión de redes sociales.',
            keywords: 'Términos y Condiciones, Información legal, iziGlow, Social Media Management'
        }
    },
    nl: {
        home: {
            title: 'Home | izyGlow',
            description: 'Welkom bij izyGlow, uw partner voor social media management.',
            keywords: 'SEO, Marketing, Social Media, Invloed'
        },
        pricing: {
            title: 'Prijzen | izyGlow - Diensten op maat van uw budget',
            description: 'Ontdek onze competitieve plannen voor social media management en SEO.',
            keywords: 'Prijzen, Social Media, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Inloggen | izyGlow - Toegang tot uw dashboard',
            description: 'Log in op uw izyGlow-account om uw social media en SEO te beheren.',
            keywords: 'Inloggen, Dashboard, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Aanmelden | Meld je vandaag nog aan bij izyGlow',
            description: 'Meld je aan bij izyGlow om toegang te krijgen tot krachtige tools voor social media management en SEO.',
            keywords: 'Aanmelden, Account maken, iziGlow'
        },
        cgu: {
            title: 'Algemene Voorwaarden | izyGlow - Uw rechten en verplichtingen',
            description: 'Lees de algemene voorwaarden van izyGlow. Transparantie en naleving om het optimale gebruik van onze social media managementdiensten te waarborgen.',
            keywords: 'Algemene voorwaarden, Juridische informatie, iziGlow, Social Media Management'
        }
    },
    it: {
        home: {
            title: 'Home | izyGlow',
            description: 'Benvenuto su izyGlow, il tuo partner per la gestione dei social media.',
            keywords: 'SEO, Marketing, Social Media, Influenza'
        },
        pricing: {
            title: 'Prezzi | izyGlow - Servizi su misura per il tuo budget',
            description: 'Scopri i nostri piani competitivi per la gestione dei social media e SEO.',
            keywords: 'Prezzi, Social Media, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Login | izyGlow - Accedi alla tua dashboard',
            description: 'Accedi al tuo account iziGlow per gestire i tuoi social media e SEO.',
            keywords: 'Login, Dashboard, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Registrati | Unisciti a izyGlow oggi',
            description: 'Registrati su izyGlow per accedere a strumenti potenti per la gestione dei social media e SEO.',
            keywords: 'Registrati, Crea account, iziGlow'
        },
        cgu: {
            title: 'Termini e Condizioni | izyGlow - I tuoi diritti e doveri',
            description: 'Leggi i termini e le condizioni di izyGlow. Trasparenza e conformità per garantire l\'uso ottimale dei nostri servizi di gestione dei social media.',
            keywords: 'Termini e condizioni, Informazioni legali, iziGlow, Social Media Management'
        }
    },
    sv: {
        home: {
            title: 'Hem | izyGlow',
            description: 'Välkommen till izyGlow, din partner för sociala medier hantering.',
            keywords: 'SEO, Marknadsföring, Sociala Medier, Inflytande'
        },
        pricing: {
            title: 'Priser | izyGlow - Tjänster anpassade till din budget',
            description: 'Upptäck våra konkurrenskraftiga planer för sociala medier hantering och SEO.',
            keywords: 'Priser, Sociala Medier, SEO, Marknadsföring, iziGlow'
        },
        login: {
            title: 'Logga in | izyGlow - Tillgång till din dashboard',
            description: 'Logga in på ditt izyGlow-konto för att hantera dina sociala medier och SEO.',
            keywords: 'Logga in, Dashboard, Social Media Management, iziGlow'
        },
        signup: {
            title: 'Registrera | Gå med i izyGlow idag',
            description: 'Registrera dig på izyGlow för att få tillgång till kraftfulla verktyg för sociala medier hantering och SEO.',
            keywords: 'Registrera, Skapa konto, iziGlow'
        },
        cgu: {
            title: 'Villkor | izyGlow - Dina rättigheter och skyldigheter',
            description: 'Läs igenom izanGlow’s villkor. Transparens och efterlevnad för att säkerställa optimal användning av våra tjänster för sociala medier.',
            keywords: 'Villkor, Legal information, iziGlow, Social Media Management'
        }
    },
    pl: {
        home: {
            title: 'Strona główna | izyGlow',
            description: 'Witamy w izyGlow, twoim partnerze w zarządzaniu mediami społecznościowymi.',
            keywords: 'SEO, Marketing, Media społecznościowe, Wpływ'
        },
        pricing: {
            title: 'Ceny | izyGlow - Usługi dostosowane do twojego budżetu',
            description: 'Odkryj nasze konkurencyjne plany dotyczące zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Ceny, Media społecznościowe, SEO, Marketing, iziGlow'
        },
        login: {
            title: 'Zaloguj się | izyGlow - Uzyskaj dostęp do swojego pulpitu',
            description: 'Zaloguj się na swoje konto w izyGlow, aby zarządzać swoimi mediami społecznościowymi i SEO.',
            keywords: 'Zaloguj się, Pulpit, Zarządzanie mediami społecznościowymi, iziGlow'
        },
        signup: {
            title: 'Zarejestruj się | Dołącz do izyGlow dzisiaj',
            description: 'Zarejestruj się w izyGlow, aby uzyskać dostęp do potężnych narzędzi do zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Zarejestruj się, Utwórz konto, iziGlow'
        },
        cgu: {
            title: 'Warunki korzystania | izyGlow - Twoje prawa i obowiązki',
            description: 'Przeczytaj warunki korzystania z usług izyGlow. Przejrzystość i zgodność zapewniające optymalne korzystanie z naszych usług zarządzania mediami społecznościowymi.',
            keywords: 'Warunki, Informacje prawne, iziGlow, Zarządzanie mediami społecznościowymi'
        }
    },
    ko: {
        home: {
            title: '홈 | izyGlow',
            description: 'izyGlow에 오신 것을 환영합니다, 소셜 미디어 관리 파트너.',
            keywords: 'SEO, 마케팅, 소셜 미디어, 영향력'
        },
        pricing: {
            title: '가격 | izyGlow - 예산에 맞춘 서비스',
            description: '소셜 미디어 관리와 SEO를 위한 경쟁력 있는 요금제를 알아보세요.',
            keywords: '가격, 소셜 미디어, SEO, 마케팅, iziGlow'
        },
        login: {
            title: '로그인 | izyGlow - 대시보드에 액세스',
            description: 'izyGlow 계정에 로그인하여 소셜 미디어와 SEO를 관리하세요.',
            keywords: '로그인, 대시보드, 소셜 미디어 관리, iziGlow'
        },
        signup: {
            title: '가입 | 오늘 izyGlow에 가입하세요',
            description: 'izyGlow에 가입하여 소셜 미디어 관리와 SEO를 위한 강력한 도구에 접근하세요.',
            keywords: '가입, 계정 만들기, iziGlow'
        },
        cgu: {
            title: '이용 약관 | izyGlow - 귀하의 권리와 의무',
            description: 'izyGlow의 이용 약관을 읽어보세요. 소셜 미디어 관리 서비스를 최적화하여 투명성과 준수 보장.',
            keywords: '이용 약관, 법적 정보, iziGlow, 소셜 미디어 관리'
        }
    },
    ru: {
        home: {
            title: 'Главная | izyGlow',
            description: 'Добро пожаловать в izyGlow, вашего партнера по управлению социальными медиа.',
            keywords: 'SEO, Маркетинг, Социальные медиа, Влияние'
        },
        pricing: {
            title: 'Цены | izyGlow - Услуги, соответствующие вашему бюджету',
            description: 'Ознакомьтесь с нашими конкурентоспособными планами по управлению социальными медиа и SEO.',
            keywords: 'Цены, Социальные медиа, SEO, Маркетинг, iziGlow'
        },
        login: {
            title: 'Войти | izyGlow - Доступ к вашему дашборду',
            description: 'Войдите в свой аккаунт izyGlow для управления социальными медиа и SEO.',
            keywords: 'Войти, Дашборд, Управление социальными медиа, iziGlow'
        },
        signup: {
            title: 'Регистрация | Присоединяйтесь к izyGlow сегодня',
            description: 'Зарегистрируйтесь в izyGlow, чтобы получить доступ к мощным инструментам для управления социальными медиа и SEO.',
            keywords: 'Регистрация, Создать аккаунт, iziGlow'
        },
        cgu: {
            title: 'Условия использования | izyGlow - Ваши права и обязанности',
            description: 'Прочитайте условия использования службы izyGlow. Прозрачность и соблюдение для оптимального использования наших услуг по управлению социальными медиа.',
            keywords: 'Условия использования, Юридическая информация, iziGlow, Управление социальными медиа'
        }
    },
    ja: {
        home: {
            title: 'ホーム | izyGlow',
            description: 'izyGlowへようこそ、あなたのソーシャルメディア管理パートナー。',
            keywords: 'SEO, マーケティング, ソーシャルメディア, 影響力'
        },
        pricing: {
            title: '料金 | izyGlow - あなたの予算に合わせたサービス',
            description: 'ソーシャルメディア管理とSEOの競争力のあるプランを発見してください。',
            keywords: '料金, ソーシャルメディア, SEO, マーケティング, iziGlow'
        },
        login: {
            title: 'ログイン | izyGlow - ダッシュボードにアクセス',
            description: 'izyGlowアカウントにログインしてソーシャルメディアとSEOを管理しましょう。',
            keywords: 'ログイン, ダッシュボード, ソーシャルメディア管理, iziGlow'
        },
        signup: {
            title: 'サインアップ | 今日izyGlowに参加しよう',
            description: 'izyGlowにサインアップして、ソーシャルメディア管理とSEOのための強力なツールを活用しましょう。',
            keywords: 'サインアップ, アカウント作成, iziGlow'
        },
        cgu: {
            title: '利用規約 | izyGlow - あなたの権利と義務',
            description: 'izyGlowの利用規約をお読みください。ソーシャルメディア管理サービスを最適に利用するための透明性とコンプライアンス。',
            keywords: '利用規約, 法的情報, iziGlow, ソーシャルメディア管理'
        }
    },zh: {
        home: {
            title: '首页 | izyGlow',
            description: '欢迎来到izyGlow，您的社交媒体管理合作伙伴。',
            keywords: 'SEO, 营销, 社交媒体, 影响力'
        },
        pricing: {
            title: '定价 | izyGlow - 量身定制的服务',
            description: '发现我们具有竞争力的社交媒体管理和SEO计划。',
            keywords: '定价, 社交媒体, SEO, 营销, iziGlow'
        },
        login: {
            title: '登录 | izyGlow - 访问您的仪表板',
            description: '登录您的izyGlow帐户，管理您的社交媒体和SEO。',
            keywords: '登录, 仪表板, 社交媒体管理, iziGlow'
        },
        signup: {
            title: '注册 | 今天就加入izyGlow',
            description: '在izyGlow注册，使用强大的社交媒体管理和SEO工具。',
            keywords: '注册, 创建账户, iziGlow'
        },
        cgu: {
            title: '使用条款 | izyGlow - 您的权利和义务',
            description: '阅读izyGlow的使用条款。透明度和合规性确保您能够最优化使用我们的社交媒体管理服务。',
            keywords: '使用条款, 法律信息, iziGlow, 社交媒体管理'
        }
    },
    ar: {
        home: {
            title: 'الرئيسية | izyGlow',
            description: 'مرحبًا بكم في izyGlow، شريككم في إدارة وسائل التواصل الاجتماعي.',
            keywords: 'SEO, تسويق, وسائل التواصل الاجتماعي, تأثير'
        },
        pricing: {
            title: 'الأسعار | izyGlow - خدمات تناسب ميزانيتك',
            description: 'اكتشف خططنا التنافسية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'الأسعار, وسائل التواصل الاجتماعي, SEO, تسويق, iziGlow'
        },
        login: {
            title: 'تسجيل الدخول | izyGlow - الوصول إلى لوحة التحكم',
            description: 'تسجيل الدخول إلى حسابك على izyGlow لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'تسجيل الدخول, لوحة التحكم, إدارة وسائل التواصل الاجتماعي, iziGlow'
        },
        signup: {
            title: 'التسجيل | انضم إلى izyGlow اليوم',
            description: 'قم بالتسجيل في izyGlow للوصول إلى أدوات قوية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'التسجيل, إنشاء حساب, iziGlow'
        },
        cgu: {
            title: 'الشروط والأحكام | izyGlow - حقوقك وواجباتك',
            description: 'اطلع على شروط الاستخدام الخاصة بـizyGlow. الشفافية والامتثال لضمان الاستخدام الأمثل لخدماتنا لإدارة وسائل التواصل الاجتماعي.',
            keywords: 'الشروط والأحكام, المعلومات القانونية, iziGlow, إدارة وسائل التواصل الاجتماعي'
        }
    },
    tr: {
        home: {
            title: 'Ana Sayfa | izyGlow',
            description: 'izyGlow\'a hoş geldiniz, sosyal medya yönetimi partneriniz.',
            keywords: 'SEO, Pazarlama, Sosyal Medya, Etki'
        },
        pricing: {
            title: 'Fiyatlandırma | izyGlow - Bütçenize uygun hizmetler',
            description: 'Sosyal medya yönetimi ve SEO için rekabetçi planlarımızı keşfedin.',
            keywords: 'Fiyatlandırma, Sosyal Medya, SEO, Pazarlama, iziGlow'
        },
        login: {
            title: 'Giriş Yap | izyGlow - Gösterge tablonuza erişin',
            description: 'Sosyal medya ve SEO yönetmek için iziGlow hesabınıza giriş yapın.',
            keywords: 'Giriş Yap, Gösterge Tablosu, Sosyal Medya Yönetimi, iziGlow'
        },
        signup: {
            title: 'Kaydol | Bugün iziGlow\'a katılın',
            description: 'Sosyal medya yönetimi ve SEO için güçlü araçlara erişmek için iziGlow\'a kaydolun.',
            keywords: 'Kaydol, Hesap Oluştur, iziGlow'
        },
        cgu: {
            title: 'Hizmet Şartları | izyGlow - Haklarınız ve Yükümlülükleriniz',
            description: 'izyGlow\'ın kullanım şartlarını okuyun. Şeffaflık ve uyum, sosyal medya yönetimi hizmetlerimizi optimal bir şekilde kullanmanızı sağlar.',
            keywords: 'Hizmet Şartları, Hukuki Bilgiler, iziGlow, Sosyal Medya Yönetimi'
        }
    },
    vi: {
        home: {
            title: 'Trang chủ | izyGlow',
            description: 'Chào mừng đến với izyGlow, đối tác quản lý mạng xã hội của bạn.',
            keywords: 'SEO, Tiếp thị, Mạng xã hội, Ảnh hưởng'
        },
        pricing: {
            title: 'Giá cả | izyGlow - Dịch vụ phù hợp với ngân sách của bạn',
            description: 'Khám phá các gói dịch vụ cạnh tranh của chúng tôi cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Giá cả, Mạng xã hội, SEO, Tiếp thị, iziGlow'
        },
        login: {
            title: 'Đăng nhập | izyGlow - Truy cập vào bảng điều khiển của bạn',
            description: 'Đăng nhập vào tài khoản izyGlow của bạn để quản lý mạng xã hội và SEO.',
            keywords: 'Đăng nhập, Bảng điều khiển, Quản lý mạng xã hội, iziGlow'
        },
        signup: {
            title: 'Đăng ký | Tham gia izyGlow hôm nay',
            description: 'Đăng ký tại izyGlow để truy cập vào các công cụ mạnh mẽ cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Đăng ký, Tạo tài khoản, iziGlow'
        },
        cgu: {
            title: 'Điều khoản sử dụng | izyGlow - Quyền lợi và nghĩa vụ của bạn',
            description: 'Đọc các điều khoản sử dụng của izyGlow. Minh bạch và tuân thủ để đảm bảo sử dụng tối ưu dịch vụ quản lý mạng xã hội của chúng tôi.',
            keywords: 'Điều khoản sử dụng, Thông tin pháp lý, iziGlow, Quản lý mạng xã hội'
        }
    }
};
