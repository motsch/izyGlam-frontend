/** -------------- CONSTANTES DE L'APPLICATION -------------- */
export class Global {
    
  /** Navigation drawer */
  public static MENU_ITEMS = [
    {
      parent: 'Dashboard',
      name: 'Dashboard 1 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Dashboard',
      name: 'Dashboard 2 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Dashboard',
      name: 'Dashboard 3 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Dashboard',
      name: 'Dashboard 4 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Carte',
      name: 'Liste des cartes',
      trad: 'SIDEBAR.SUBNAV.MAPSLIST',
      parentTrad: 'SIDEBAR.MAP',
      route: 'user',
      active: false,
    },
    {
      parent: 'Carte0',
      name: 'Carte 2 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Carte0',
      name: 'Carte 3 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Carte0',
      name: 'Carte 4 (no link)',
      trad: '',
      active: false,
    },
    {
      parent: 'Robots',
      name: 'Flotte de robots',
      trad: 'SIDEBAR.SUBNAV.ROBOTSLIST',
      parentTrad: 'SIDEBAR.ROBOTS',
      route: 'robots',
      active: false,
    },
    {
      parent: 'Robots',
      name: 'Modèles de robots',
      trad: 'SIDEBAR.SUBNAV.ROBOTSMODEL',
      parentTrad: 'SIDEBAR.ROBOTS',
      route: 'robots-models',
      active: false,
    },
    {
      parent: 'Robots',
      name: 'Groupes de robots',
      trad: 'SIDEBAR.SUBNAV.ROBOTSGROUP',
      parentTrad: 'SIDEBAR.ROBOTS',
      route: 'robots-groups',
      active: false,
    },
    {
      parent: 'Missions',
      name: 'Suivi de missions',
      trad: 'SIDEBAR.SUBNAV.MISSIONSLIST',
      parentTrad: 'SIDEBAR.MISSIONS',
      route: 'missions',
      active: false,
    },
    {
      parent: 'Missions',
      name: 'Templates',
      route: 'missions-template',
      trad: 'SIDEBAR.SUBNAV.MISSIONSTEMPLATE',
      parentTrad: 'SIDEBAR.MISSIONS',
      active: false,
    },
    {
      parent: 'Admin',
      name: 'Utilisateurs',
      trad: 'SIDEBAR.SUBNAV.USERS',
      parentTrad: 'SIDEBAR.ADMIN',
      route: 'users',
      active: false,
    },
    {
      parent: 'Admin',
      name: 'Rôles',
      trad: 'SIDEBAR.SUBNAV.ROLES',
      parentTrad: 'SIDEBAR.ADMIN',
      route: 'roles',
      active: false,
    },
    {
      parent: 'Admin',
      name: 'Sites',
      trad: 'SIDEBAR.SUBNAV.SITES',
      parentTrad: 'SIDEBAR.ADMIN',
      route: 'sites',
      active: false,
    },
  ];

  /** nom de la clef pour la récupération du nom de l'établissement */
  public static CLEF_NOM_SITE = 'nom_site';

  /** Le loading peut être désactivé pour l'admin */
  public static activeLoading: boolean;

  /** Etat des missions */
  public static ETAT_MISSION = {
    DISPONIBLE: { texte: 'DISPONIBLE', valeur: 3 },
    ENATTENTE: { texte: 'ENATTENTE', valeur: 2 },
    ENREPOS: { texte: 'ENPAUSE', valeur: 2 },
    INDISPONIBLE: { texte: 'TERMINEE', valeur: 1 },
  };

  /**
   * Donne l'état à partir du string en paramètre
   * @param etat
   */
  public static getEtat(etat: string) {
    if (etat === Global.ETAT_MISSION.DISPONIBLE.texte) {
      return Global.ETAT_MISSION.DISPONIBLE;
    } else if (etat === Global.ETAT_MISSION.ENATTENTE.texte) {
      return Global.ETAT_MISSION.ENATTENTE;
    } else if (etat === Global.ETAT_MISSION.ENREPOS.texte) {
      return Global.ETAT_MISSION.ENREPOS;
    } else if (etat === Global.ETAT_MISSION.INDISPONIBLE.texte) {
      return Global.ETAT_MISSION.INDISPONIBLE;
    } else {
      return Global.ETAT_MISSION.INDISPONIBLE;
    }
  }
}
