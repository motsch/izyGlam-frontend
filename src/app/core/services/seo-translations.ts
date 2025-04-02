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
            title: 'Accueil | izyGlam',
            description: 'Bienvenue sur izyGlam, votre partenaire pour la gestion des médias sociaux.',
            keywords: 'SEO, Marketing, Réseaux Sociaux, Influence'
        },
        pricing: {
            title: 'Tarifs | izyGlam - Des services adaptés à votre budget',
            description: 'Découvrez nos offres compétitives pour la gestion des réseaux sociaux et le SEO.',
            keywords: 'Tarifs, Marketing digital, izyGlam'
        },
        login: {
            title: 'Connexion | izyGlam - Accédez à votre tableau de bord',
            description: 'Connectez-vous à votre compte izyGlam pour gérer vos réseaux sociaux.',
            keywords: 'Connexion, Tableau de bord, Login izyGlam'
        },
        signup: {
            title: 'Inscription | Rejoignez izyGlam dès maintenant',
            description: 'Inscrivez-vous sur izyGlam pour gérer vos réseaux sociaux et optimiser votre SEO.',
            keywords: 'Inscription, Créer un compte, izyGlam'
        },
        cgu: {
            title: 'Conditions Générales d’Utilisation | izyGlam - Vos droits et obligations',
            description: 'Découvrez les conditions générales d’utilisation de izyGlam. Transparence et conformité pour une utilisation optimale de nos services de gestion des réseaux sociaux.',
            keywords: 'CGU, Conditions générales d’utilisation, izyGlam, Mentions légales, Gestion des réseaux sociaux'
        }
    },
    en: {
        home: {
            title: 'Home | izyGlam',
            description: 'Welcome to izyGlam, your partner for social media management.',
            keywords: 'SEO, Marketing, Social Media, Influence'
        },
        pricing: {
            title: 'Pricing | izyGlam - Services tailored to your budget',
            description: 'Discover our competitive plans for social media management and SEO.',
            keywords: 'Pricing, Social Media, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Login | izyGlam - Access your dashboard',
            description: 'Log in to your izyizyGlamGlow account to manage your social media and SEO.',
            keywords: 'Login, Dashboard, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Sign Up | Join izyGlam today',
            description: 'Sign up on izyGlam to access powerful tools for social media management and SEO.',
            keywords: 'Sign Up, Create Account, izyGlam'
        },
        cgu: {
            title: 'Terms and Conditions | izyGlam - Your rights and obligations',
            description: 'Read izyGlam’s terms and conditions. Transparency and compliance to ensure the optimal use of our social media management services.',
            keywords: 'Terms and Conditions, Legal Information, izyGlam, Social Media Management'
        }
    },
    de: {
        home: {
            title: 'Startseite | izyGlam',
            description: 'Willkommen bei izyGlam, Ihrem Partner für Social-Media-Management.',
            keywords: 'SEO, Marketing, Social Media, Einfluss'
        },
        pricing: {
            title: 'Preise | izyGlam - Services, die zu Ihrem Budget passen',
            description: 'Entdecken Sie unsere wettbewerbsfähigen Pläne für Social-Media-Management und SEO.',
            keywords: 'Preise, Social Media, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Anmelden | izyGlam - Greifen Sie auf Ihr Dashboard zu',
            description: 'Melden Sie sich bei Ihrem izyGlam-Konto an, um Ihre Social Media und SEO zu verwalten.',
            keywords: 'Anmelden, Dashboard, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Registrieren | Melden Sie sich noch heute bei izyGlam an',
            description: 'Registrieren Sie sich bei izyGlam, um leistungsstarke Tools für Social Media Management und SEO zu nutzen.',
            keywords: 'Registrieren, Konto erstellen, izyGlam'
        },
        cgu: {
            title: 'Nutzungsbedingungen | izyGlam - Ihre Rechte und Pflichten',
            description: 'Lesen Sie die Nutzungsbedingungen von izyGlam. Transparenz und Compliance, um die optimale Nutzung unserer Social-Media-Management-Dienste zu gewährleisten.',
            keywords: 'Nutzungsbedingungen, Rechtliche Informationen, izyGlam, Social Media Management'
        }
    },
    es: {
        home: {
            title: 'Inicio | izyGlam',
            description: 'Bienvenido a izyGlam, tu socio para la gestión de redes sociales.',
            keywords: 'SEO, Marketing, Redes Sociales, Influencia'
        },
        pricing: {
            title: 'Precios | izyGlam - Servicios adaptados a tu presupuesto',
            description: 'Descubre nuestros planes competitivos para la gestión de redes sociales y SEO.',
            keywords: 'Precios, Redes Sociales, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Iniciar sesión | izyGlam - Accede a tu panel de control',
            description: 'Inicia sesión en tu cuenta de izyGlam para gestionar tus redes sociales.',
            keywords: 'Iniciar sesión, Panel de control, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Registro | Únete a izyGlam hoy',
            description: 'Regístrate en izyGlam para acceder a potentes herramientas para la gestión de redes sociales y SEO.',
            keywords: 'Registro, Crear cuenta, izyGlam'
        },
        cgu: {
            title: 'Términos y Condiciones | izyGlam - Tus derechos y obligaciones',
            description: 'Lee los términos y condiciones de izyGlam. Transparencia y cumplimiento para asegurar el uso óptimo de nuestros servicios de gestión de redes sociales.',
            keywords: 'Términos y Condiciones, Información legal, izyGlam, Social Media Management'
        }
    },
    nl: {
        home: {
            title: 'Home | izyGlam',
            description: 'Welkom bij izyGlam, uw partner voor social media management.',
            keywords: 'SEO, Marketing, Social Media, Invloed'
        },
        pricing: {
            title: 'Prijzen | izyGlam - Diensten op maat van uw budget',
            description: 'Ontdek onze competitieve plannen voor social media management en SEO.',
            keywords: 'Prijzen, Social Media, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Inloggen | izyGlam - Toegang tot uw dashboard',
            description: 'Log in op uw izyGlam-account om uw social media en SEO te beheren.',
            keywords: 'Inloggen, Dashboard, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Aanmelden | Meld je vandaag nog aan bij izyGlam',
            description: 'Meld je aan bij izyGlam om toegang te krijgen tot krachtige tools voor social media management en SEO.',
            keywords: 'Aanmelden, Account maken, izyGlam'
        },
        cgu: {
            title: 'Algemene Voorwaarden | izyGlam - Uw rechten en verplichtingen',
            description: 'Lees de algemene voorwaarden van izyGlam. Transparantie en naleving om het optimale gebruik van onze social media managementdiensten te waarborgen.',
            keywords: 'Algemene voorwaarden, Juridische informatie, izyGlam, Social Media Management'
        }
    },
    it: {
        home: {
            title: 'Home | izyGlam',
            description: 'Benvenuto su izyGlam, il tuo partner per la gestione dei social media.',
            keywords: 'SEO, Marketing, Social Media, Influenza'
        },
        pricing: {
            title: 'Prezzi | izyGlam - Servizi su misura per il tuo budget',
            description: 'Scopri i nostri piani competitivi per la gestione dei social media e SEO.',
            keywords: 'Prezzi, Social Media, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Login | izyGlam - Accedi alla tua dashboard',
            description: 'Accedi al tuo account izyGlam per gestire i tuoi social media e SEO.',
            keywords: 'Login, Dashboard, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Registrati | Unisciti a izyGlam oggi',
            description: 'Registrati su izyGlam per accedere a strumenti potenti per la gestione dei social media e SEO.',
            keywords: 'Registrati, Crea account, izyGlam'
        },
        cgu: {
            title: 'Termini e Condizioni | izyGlam - I tuoi diritti e doveri',
            description: 'Leggi i termini e le condizioni di izyGlam. Trasparenza e conformità per garantire l\'uso ottimale dei nostri servizi di gestione dei social media.',
            keywords: 'Termini e condizioni, Informazioni legali, izyGlam, Social Media Management'
        }
    },
    sv: {
        home: {
            title: 'Hem | izyGlam',
            description: 'Välkommen till izyGlam, din partner för sociala medier hantering.',
            keywords: 'SEO, Marknadsföring, Sociala Medier, Inflytande'
        },
        pricing: {
            title: 'Priser | izyGlam - Tjänster anpassade till din budget',
            description: 'Upptäck våra konkurrenskraftiga planer för sociala medier hantering och SEO.',
            keywords: 'Priser, Sociala Medier, SEO, Marknadsföring, izyGlam'
        },
        login: {
            title: 'Logga in | izyGlam - Tillgång till din dashboard',
            description: 'Logga in på ditt izyGlam-konto för att hantera dina sociala medier och SEO.',
            keywords: 'Logga in, Dashboard, Social Media Management, izyGlam'
        },
        signup: {
            title: 'Registrera | Gå med i izyGlam idag',
            description: 'Registrera dig på izyGlam för att få tillgång till kraftfulla verktyg för sociala medier hantering och SEO.',
            keywords: 'Registrera, Skapa konto, izyGlam'
        },
        cgu: {
            title: 'Villkor | izyGlam - Dina rättigheter och skyldigheter',
            description: 'Läs igenom izanGlow’s villkor. Transparens och efterlevnad för att säkerställa optimal användning av våra tjänster för sociala medier.',
            keywords: 'Villkor, Legal information, izyGlam, Social Media Management'
        }
    },
    pl: {
        home: {
            title: 'Strona główna | izyGlam',
            description: 'Witamy w izyGlam, twoim partnerze w zarządzaniu mediami społecznościowymi.',
            keywords: 'SEO, Marketing, Media społecznościowe, Wpływ'
        },
        pricing: {
            title: 'Ceny | izyGlam - Usługi dostosowane do twojego budżetu',
            description: 'Odkryj nasze konkurencyjne plany dotyczące zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Ceny, Media społecznościowe, SEO, Marketing, izyGlam'
        },
        login: {
            title: 'Zaloguj się | izyGlam - Uzyskaj dostęp do swojego pulpitu',
            description: 'Zaloguj się na swoje konto w izyGlam, aby zarządzać swoimi mediami społecznościowymi i SEO.',
            keywords: 'Zaloguj się, Pulpit, Zarządzanie mediami społecznościowymi, izyGlam'
        },
        signup: {
            title: 'Zarejestruj się | Dołącz do izyGlam dzisiaj',
            description: 'Zarejestruj się w izyGlam, aby uzyskać dostęp do potężnych narzędzi do zarządzania mediami społecznościowymi i SEO.',
            keywords: 'Zarejestruj się, Utwórz konto, izyGlam'
        },
        cgu: {
            title: 'Warunki korzystania | izyGlam - Twoje prawa i obowiązki',
            description: 'Przeczytaj warunki korzystania z usług izyGlam. Przejrzystość i zgodność zapewniające optymalne korzystanie z naszych usług zarządzania mediami społecznościowymi.',
            keywords: 'Warunki, Informacje prawne, izyGlam, Zarządzanie mediami społecznościowymi'
        }
    },
    ko: {
        home: {
            title: '홈 | izyGlam',
            description: 'izyGlam에 오신 것을 환영합니다, 소셜 미디어 관리 파트너.',
            keywords: 'SEO, 마케팅, 소셜 미디어, 영향력'
        },
        pricing: {
            title: '가격 | izyGlam - 예산에 맞춘 서비스',
            description: '소셜 미디어 관리와 SEO를 위한 경쟁력 있는 요금제를 알아보세요.',
            keywords: '가격, 소셜 미디어, SEO, 마케팅, izyGlam'
        },
        login: {
            title: '로그인 | izyGlam - 대시보드에 액세스',
            description: 'izyGlam 계정에 로그인하여 소셜 미디어와 SEO를 관리하세요.',
            keywords: '로그인, 대시보드, 소셜 미디어 관리, izyGlam'
        },
        signup: {
            title: '가입 | 오늘 izyGlam에 가입하세요',
            description: 'izyGlam에 가입하여 소셜 미디어 관리와 SEO를 위한 강력한 도구에 접근하세요.',
            keywords: '가입, 계정 만들기, izyGlam'
        },
        cgu: {
            title: '이용 약관 | izyGlam - 귀하의 권리와 의무',
            description: 'izyGlam의 이용 약관을 읽어보세요. 소셜 미디어 관리 서비스를 최적화하여 투명성과 준수 보장.',
            keywords: '이용 약관, 법적 정보, izyGlam, 소셜 미디어 관리'
        }
    },
    ru: {
        home: {
            title: 'Главная | izyGlam',
            description: 'Добро пожаловать в izyGlam, вашего партнера по управлению социальными медиа.',
            keywords: 'SEO, Маркетинг, Социальные медиа, Влияние'
        },
        pricing: {
            title: 'Цены | izyGlam - Услуги, соответствующие вашему бюджету',
            description: 'Ознакомьтесь с нашими конкурентоспособными планами по управлению социальными медиа и SEO.',
            keywords: 'Цены, Социальные медиа, SEO, Маркетинг, izyGlam'
        },
        login: {
            title: 'Войти | izyGlam - Доступ к вашему дашборду',
            description: 'Войдите в свой аккаунт izyGlam для управления социальными медиа и SEO.',
            keywords: 'Войти, Дашборд, Управление социальными медиа, izyGlam'
        },
        signup: {
            title: 'Регистрация | Присоединяйтесь к izyGlam сегодня',
            description: 'Зарегистрируйтесь в izyGlam, чтобы получить доступ к мощным инструментам для управления социальными медиа и SEO.',
            keywords: 'Регистрация, Создать аккаунт, izyGlam'
        },
        cgu: {
            title: 'Условия использования | izyGlam - Ваши права и обязанности',
            description: 'Прочитайте условия использования службы izyGlam. Прозрачность и соблюдение для оптимального использования наших услуг по управлению социальными медиа.',
            keywords: 'Условия использования, Юридическая информация, izyGlam, Управление социальными медиа'
        }
    },
    ja: {
        home: {
            title: 'ホーム | izyGlam',
            description: 'izyGlamへようこそ、あなたのソーシャルメディア管理パートナー。',
            keywords: 'SEO, マーケティング, ソーシャルメディア, 影響力'
        },
        pricing: {
            title: '料金 | izyGlam - あなたの予算に合わせたサービス',
            description: 'ソーシャルメディア管理とSEOの競争力のあるプランを発見してください。',
            keywords: '料金, ソーシャルメディア, SEO, マーケティング, izyGlam'
        },
        login: {
            title: 'ログイン | izyGlam - ダッシュボードにアクセス',
            description: 'izyGlamアカウントにログインしてソーシャルメディアとSEOを管理しましょう。',
            keywords: 'ログイン, ダッシュボード, ソーシャルメディア管理, izyGlam'
        },
        signup: {
            title: 'サインアップ | 今日izyGlamに参加しよう',
            description: 'izyGlamにサインアップして、ソーシャルメディア管理とSEOのための強力なツールを活用しましょう。',
            keywords: 'サインアップ, アカウント作成, izyGlam'
        },
        cgu: {
            title: '利用規約 | izyGlam - あなたの権利と義務',
            description: 'izyGlamの利用規約をお読みください。ソーシャルメディア管理サービスを最適に利用するための透明性とコンプライアンス。',
            keywords: '利用規約, 法的情報, izyGlam, ソーシャルメディア管理'
        }
    },zh: {
        home: {
            title: '首页 | izyGlam',
            description: '欢迎来到izyGlam，您的社交媒体管理合作伙伴。',
            keywords: 'SEO, 营销, 社交媒体, 影响力'
        },
        pricing: {
            title: '定价 | izyGlam - 量身定制的服务',
            description: '发现我们具有竞争力的社交媒体管理和SEO计划。',
            keywords: '定价, 社交媒体, SEO, 营销, izyGlam'
        },
        login: {
            title: '登录 | izyGlam - 访问您的仪表板',
            description: '登录您的izyGlam帐户，管理您的社交媒体和SEO。',
            keywords: '登录, 仪表板, 社交媒体管理, izyGlam'
        },
        signup: {
            title: '注册 | 今天就加入izyGlam',
            description: '在izyGlam注册，使用强大的社交媒体管理和SEO工具。',
            keywords: '注册, 创建账户, izyGlam'
        },
        cgu: {
            title: '使用条款 | izyGlam - 您的权利和义务',
            description: '阅读izyGlam的使用条款。透明度和合规性确保您能够最优化使用我们的社交媒体管理服务。',
            keywords: '使用条款, 法律信息, izyGlam, 社交媒体管理'
        }
    },
    ar: {
        home: {
            title: 'الرئيسية | izyGlam',
            description: 'مرحبًا بكم في izyGlam، شريككم في إدارة وسائل التواصل الاجتماعي.',
            keywords: 'SEO, تسويق, وسائل التواصل الاجتماعي, تأثير'
        },
        pricing: {
            title: 'الأسعار | izyGlam - خدمات تناسب ميزانيتك',
            description: 'اكتشف خططنا التنافسية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'الأسعار, وسائل التواصل الاجتماعي, SEO, تسويق, izyGlam'
        },
        login: {
            title: 'تسجيل الدخول | izyGlam - الوصول إلى لوحة التحكم',
            description: 'تسجيل الدخول إلى حسابك على izyGlam لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'تسجيل الدخول, لوحة التحكم, إدارة وسائل التواصل الاجتماعي, izyGlam'
        },
        signup: {
            title: 'التسجيل | انضم إلى izyGlam اليوم',
            description: 'قم بالتسجيل في izyGlam للوصول إلى أدوات قوية لإدارة وسائل التواصل الاجتماعي وSEO.',
            keywords: 'التسجيل, إنشاء حساب, izyGlam'
        },
        cgu: {
            title: 'الشروط والأحكام | izyGlam - حقوقك وواجباتك',
            description: 'اطلع على شروط الاستخدام الخاصة بـizyGlam. الشفافية والامتثال لضمان الاستخدام الأمثل لخدماتنا لإدارة وسائل التواصل الاجتماعي.',
            keywords: 'الشروط والأحكام, المعلومات القانونية, izyGlam, إدارة وسائل التواصل الاجتماعي'
        }
    },
    tr: {
        home: {
            title: 'Ana Sayfa | izyGlam',
            description: 'izyGlam\'a hoş geldiniz, sosyal medya yönetimi partneriniz.',
            keywords: 'SEO, Pazarlama, Sosyal Medya, Etki'
        },
        pricing: {
            title: 'Fiyatlandırma | izyGlam - Bütçenize uygun hizmetler',
            description: 'Sosyal medya yönetimi ve SEO için rekabetçi planlarımızı keşfedin.',
            keywords: 'Fiyatlandırma, Sosyal Medya, SEO, Pazarlama, izyGlam'
        },
        login: {
            title: 'Giriş Yap | izyGlam - Gösterge tablonuza erişin',
            description: 'Sosyal medya ve SEO yönetmek için izyGlam hesabınıza giriş yapın.',
            keywords: 'Giriş Yap, Gösterge Tablosu, Sosyal Medya Yönetimi, izyGlam'
        },
        signup: {
            title: 'Kaydol | Bugün izyGlam\'a katılın',
            description: 'Sosyal medya yönetimi ve SEO için güçlü araçlara erişmek için izyGlam\'a kaydolun.',
            keywords: 'Kaydol, Hesap Oluştur, izyGlam'
        },
        cgu: {
            title: 'Hizmet Şartları | izyGlam - Haklarınız ve Yükümlülükleriniz',
            description: 'izyGlam\'ın kullanım şartlarını okuyun. Şeffaflık ve uyum, sosyal medya yönetimi hizmetlerimizi optimal bir şekilde kullanmanızı sağlar.',
            keywords: 'Hizmet Şartları, Hukuki Bilgiler, izyGlam, Sosyal Medya Yönetimi'
        }
    },
    vi: {
        home: {
            title: 'Trang chủ | izyGlam',
            description: 'Chào mừng đến với izyGlam, đối tác quản lý mạng xã hội của bạn.',
            keywords: 'SEO, Tiếp thị, Mạng xã hội, Ảnh hưởng'
        },
        pricing: {
            title: 'Giá cả | izyGlam - Dịch vụ phù hợp với ngân sách của bạn',
            description: 'Khám phá các gói dịch vụ cạnh tranh của chúng tôi cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Giá cả, Mạng xã hội, SEO, Tiếp thị, izyGlam'
        },
        login: {
            title: 'Đăng nhập | izyGlam - Truy cập vào bảng điều khiển của bạn',
            description: 'Đăng nhập vào tài khoản izyGlam của bạn để quản lý mạng xã hội và SEO.',
            keywords: 'Đăng nhập, Bảng điều khiển, Quản lý mạng xã hội, izyGlam'
        },
        signup: {
            title: 'Đăng ký | Tham gia izyGlam hôm nay',
            description: 'Đăng ký tại izyGlam để truy cập vào các công cụ mạnh mẽ cho việc quản lý mạng xã hội và SEO.',
            keywords: 'Đăng ký, Tạo tài khoản, izyGlam'
        },
        cgu: {
            title: 'Điều khoản sử dụng | izyGlam - Quyền lợi và nghĩa vụ của bạn',
            description: 'Đọc các điều khoản sử dụng của izyGlam. Minh bạch và tuân thủ để đảm bảo sử dụng tối ưu dịch vụ quản lý mạng xã hội của chúng tôi.',
            keywords: 'Điều khoản sử dụng, Thông tin pháp lý, izyGlam, Quản lý mạng xã hội'
        }
    }
};
