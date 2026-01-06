const fs = require('fs');

// Dictionnaire complet de traductions français -> galicien
const translations = {
  'Fitness': 'Fitness',
  'Aucune conversation': 'Sen conversas',
  'Créer une conversation': 'Crear conversa',
  'Créer': 'Crear',
  'Ouvrir la liste des conversations': 'Abrir lista de conversas',
  'Photo envoyée': 'Foto enviada',
  'Total': 'Total',
  'Glam for Business': 'Servizos de beleza para empresas',
  'LinkedIn': 'LinkedIn',
  'Instagram': 'Instagram',
  'Un nail art minimaliste pour un effet élégant et moderne.': 'Nail art minimalista para un efecto elegante e moderno.',
  'Choisissez des couleurs audacieuses pour exprimer votre créativité.': 'Escolle cores audaces para expresar a túa creatividade.',
  'Un style vintage revisité pour un look unique !': 'Un estilo vintage reinterpretado para un look único!',
  'Commencez votre post par une question engageante pour inciter à interagir.': 'Comeza a túa publicación cunha pregunta atractiva para animar á interacción.',
  'Optimisez vos visuels avec des couleurs vives et un texte clair.': 'Optimiza os teus visuais con cores vivas e texto claro.',
  'Ajoutez un appel à l\'action clair, comme \'Cliquez sur le lien\' ou \'Partagez votre avis\'.': 'Engade unha chamada á acción clara, como "Preme na ligazón" ou "Comparte a túa opinión".',
  'Utilisez des légendes courtes mais percutantes pour Instagram et Bluesky.': 'Usa lendas curtas pero impactantes para Instagram e Bluesky.',
  'Incluez des questions ouvertes pour encourager les commentaires.': 'Inclúe preguntas abertas para animar aos comentarios.',
  'Ajoutez des hashtags pertinents pour toucher un public plus large.': 'Engade hashtags relevantes para chegar a un público máis amplo.',
  'Ajoutez des statistiques ou des faits intéressants pour capter l\'attention.': 'Engade estatísticas ou feitos interesantes para captar a atención.',
  'Racontez une histoire captivante pour garder vos lecteurs engagés.': 'Conta unha historia cativante para manter os teus lectores comprometidos.',
  'Mettez en avant vos réussites ou celles de vos clients pour LinkedIn.': 'Destaca os teus éxitos ou os dos teus clientes para LinkedIn.',
  'Soyez authentique et montrez votre vraie personnalité.': 'Sé auténtico e mostra a túa verdadeira personalidade.',
  'Analysez vos performances et ajustez votre stratégie en conséquence.': 'Analiza os teus resultados e axusta a túa estratexia en consecuencia.',
  'Utilisez des emojis pour rendre votre contenu plus visuel et attrayant.': 'Usa emojis para facer o teu contido máis visual e atractivo.',
  'Postez à des heures stratégiques pour maximiser la portée.': 'Publica en horas estratéxicas para maximizar o alcance.',
  'Intégrez des stories ou reels pour capter l\'attention rapidement.': 'Integra stories ou reels para captar a atención rapidamente.',
  'Utilisez des légendes captivantes qui donnent envie de cliquer sur \'Lire la suite\'.': 'Usa lendas cativantes que fagan querer premer en "Ler máis".',
  'Partagez des anecdotes personnelles pour créer une connexion émotionnelle.': 'Comparte anécdotas persoais para crear unha conexión emocional.',
  'Variez vos formats : images, vidéos, carrousels ou sondages.': 'Varía os teus formatos: imaxes, vídeos, carruseles ou enquisas.',
  'Adaptez le ton de votre contenu en fonction de la plateforme utilisée.': 'Adapta o ton do teu contido segundo a plataforma utilizada.',
  'Mentionnez d\'autres utilisateurs ou marques pour élargir votre portée.': 'Menciona outros usuarios ou marcas para ampliar o teu alcance.',
  'Testez différents styles visuels pour découvrir ce qui plaît le plus à votre audience.': 'Proba diferentes estilos visuais para descubrir o que máis gusta á túa audiencia.',
  'Utilisez des vidéos courtes pour capter l\'attention rapidement.': 'Usa vídeos curtos para captar a atención rapidamente.',
  'Ajoutez des témoignages clients pour renforcer votre crédibilité.': 'Engade testemuños de clientes para reforzar a túa credibilidade.',
  'Créez des sondages pour engager votre audience.': 'Crea enquisas para involucrar á túa audiencia.',
  'Mettez en avant vos valeurs pour toucher votre public cible.': 'Destaca os teus valores para chegar ao teu público obxectivo.',
  'Ajoutez un avant/après pour démontrer un impact clair.': 'Engade un antes/despois para demostrar un impacto claro.',
  'Incorporez des citations inspirantes pour motiver votre audience.': 'Incorpora citas inspiradoras para motivar á túa audiencia.',
  'Ajoutez des légendes en storytelling pour raconter une histoire.': 'Engade lendas en forma de narración para contar unha historia.',
  'Adaptez vos hashtags à chaque publication pour maximiser la portée.': 'Adapta os teus hashtags a cada publicación para maximizar o alcance.',
  'Évitez de surcharger vos visuels avec trop de texte.': 'Evita sobrecargar os teus visuais con demasiado texto.',
  'Répondez rapidement aux commentaires pour créer une relation.': 'Responde rapidamente aos comentarios para crear unha relación.',
  'Mettez en avant vos coulisses pour humaniser votre marque.': 'Destaca os teus bastidores para humanizar a túa marca.',
  'Utilisez des photos authentiques plutôt que des banques d\'images.': 'Usa fotos auténticas en lugar de bancos de imaxes.',
  'Répétez vos messages clés régulièrement pour ancrer votre communication.': 'Repite as túas mensaxes clave regularmente para ancorar a túa comunicación.',
  'Identifiez les moments forts de l\'année pour vos publications.': 'Identifica os momentos importantes do ano para as túas publicacións.',
  'Utilisez les tendances actuelles pour surfer sur l\'actualité.': 'Usa as tendencias actuais para seguir a actualidade.',
  'Ajoutez des statistiques intéressantes pour capter l\'attention.': 'Engade estatísticas interesantes para captar a atención.',
  'Créez des carrousels pour raconter une histoire en plusieurs étapes.': 'Crea carruseles para contar unha historia en varias etapas.',
  'Mettez un lien clair dans votre bio pour diriger vos visiteurs.': 'Pon unha ligazón clara na túa biografía para dirixir os teus visitantes.',
  'Créez un guide ou une checklist pour offrir de la valeur à votre audience.': 'Crea unha guía ou lista de verificación para ofrecer valor á túa audiencia.',
  'Ajoutez des GIF ou des stickers pour rendre vos stories plus dynamiques.': 'Engade GIF ou adhesivos para facer as túas stories máis dinámicas.',
  'Utilisez des couleurs cohérentes avec votre branding.': 'Usa cores consistentes co teu branding.',
  'Mettez en avant vos collaborateurs pour créer un sentiment d\'équipe.': 'Destaca os teus colaboradores para crear un sentimento de equipo.',
  'Rédigez vos posts comme si vous parliez directement à une personne.': 'Escribe as túas publicacións como se falases directamente cunha persoa.',
  'Ajoutez des quiz interactifs pour augmenter l\'engagement.': 'Engade cuestionarios interactivos para aumentar o compromiso.',
  'Créez un sentiment d\'urgence avec des promotions limitées.': 'Crea un sentimento de urxencia con promocións limitadas.',
  'Intégrez des photos avant/après pour montrer des résultats concrets.': 'Integra fotos antes/despois para mostrar resultados concretos.',
  'Créez des collaborations avec d\'autres créateurs pour élargir votre audience.': 'Crea colaboracións con outros creadores para ampliar a túa audiencia.',
  'Soyez transparent sur vos processus ou vos produits.': 'Sé transparente sobre os teus procesos ou produtos.',
  'Ajoutez des animations pour rendre vos vidéos plus dynamiques.': 'Engade animacións para facer os teus vídeos máis dinámicos.',
  'Créez des posts éducatifs pour apporter de la valeur à votre audience.': 'Crea publicacións educativas para ofrecer valor á túa audiencia.',
  'Mettez en avant des retours d\'expérience pour instaurer la confiance.': 'Destaca comentarios de experiencia para instaurar confianza.',
  'Soyez concis dans vos messages pour aller droit au but.': 'Sé conciso nas túas mensaxes para ir directo ao grano.',
  'Utilisez des mots-clés pertinents pour augmenter la visibilité.': 'Usa palabras clave relevantes para aumentar a visibilidade.',
  'Créez un calendrier éditorial pour planifier vos publications.': 'Crea un calendario editorial para planificar as túas publicacións.',
  'Expérimentez avec des visuels minimalistes pour un impact visuel fort.': 'Experimenta con visuais minimalistas para un forte impacto visual.',
  'Intégrez des témoignages vidéo pour plus d\'authenticité.': 'Integra testemuños en vídeo para máis autenticidade.',
  'Créez des posts humoristiques pour engager avec légèreté.': 'Crea publicacións humorísticas para involucrar con levedade.',
  'Utilisez des graphiques ou infographies pour expliquer des idées complexes.': 'Usa gráficos ou infografías para explicar ideas complexas.',
  'Publiez régulièrement pour garder votre audience engagée.': 'Publica regularmente para manter a túa audiencia comprometida.',
  'Incluez des remerciements ou des célébrations pour créer de la gratitude.': 'Inclúe agradecementos ou celebracións para crear gratitud.',
  'Paiement par crédit entreprise': 'Pago con crédito empresarial',
  'Utiliser mon crédit d\'entreprise': 'Usar o meu crédito empresarial',
  'Mon crédit disponible :': 'O meu crédito dispoñible:',
  'Pas de crédit d\'entreprise': 'Sen crédito empresarial',
  'Informations du salon': 'Información do salón',
  'Vérification professionnelle': 'Verificación profesional',
  'Étape 2 sur 2 · Vos documents restent privés et protégés.': 'Paso 2 de 2 · Os teus documentos permanecen privados e protexidos.',
  'Vérification de votre profil professionnel': 'Verificación do teu perfil profesional',
  'Nous vérifions chaque professionnel pour protéger vos clients et votre réputation.': 'Verificamos cada profesional para protexer os teus clientes e a túa reputación.',
  'Pièce d\'identité': 'Documento de identidade',
  'Carte d\'identité, passeport ou titre de séjour en cours de validité.': 'Documento de identidade, pasaporte ou título de residencia válido.',
  'Extrait Kbis (optionnel)': 'Extracto Kbis (opcional)',
  'Recommandé si vous exercez via une société immatriculée.': 'Recomendado se traballas a través dunha sociedade rexistrada.',
  'Téléverser un document': 'Subir documento',
  'Formats acceptés : PDF, JPG, PNG · taille max 10 Mo.': 'Formatos aceptados: PDF, JPG, PNG · tamaño máximo 10 MB.',
  'La pièce d\'identité et l\'assurance sont obligatoires pour activer votre profil.': 'O documento de identidade e o seguro son obrigatorios para activar o teu perfil.',
  'Document manquant': 'Documento faltante',
  'En cours de vérification': 'En proceso de verificación',
  'Validé': 'Validado',
  'Refusé · nouveau document requis': 'Rexeitado · requírese novo documento',
  'Envoyer les documents': 'Enviar documentos',
  'Je compléterai plus tard': 'Completarei máis tarde',
  'Vos documents ont été envoyés pour vérification.': 'Os teus documentos foron enviados para verificación.',
  'Impossible de téléverser vos documents pour le moment.': 'Non é posible subir os teus documentos neste momento.',
  'La pièce d\'identité est obligatoire.': 'O documento de identidade é obrigatorio.',
  'L\'assurance professionnelle est obligatoire.': 'O seguro profesional é obrigatorio.',
  'Validés': 'Validados',
  'Non validés': 'Non validados',
  'Inatif': 'Inactivo',
  'Statut': 'Estado',
  'Mes messages': 'As miñas mensaxes',
  'Prochain niveau': 'Seguinte nivel',
  'Niveau maximum atteint': 'Nivel máximo acadado',
  'encore {{count}} réservations': 'aínda {{count}} reservas',
  'Confirmation': 'Confirmación',
  'Annuler': 'Cancelar',
  'Terminer': 'Finalizar',
  'Supprimer': 'Eliminar',
  'Rechercher une prestation': 'Buscar servizo',
  'Email de l\'utilisateur': 'Correo do usuario',
  'Que souhaitez-vous réserver ?': 'Que queres reservar?',
  'Choisissez une catégorie. Ensuite : prestation → moment → créneau.': 'Escolle unha categoría. Despois: servizo → momento → franxa horaria.',
  'Paiement sécurisé • Pros vérifiées • Support réactif': 'Pago seguro • Profesionais verificados • Soporte reactivo',
  'Prix clair avant paiement. Vous confirmez quand tout est OK.': 'Prezo claro antes do pago. Confirma cando todo está ben.',
  'Quel moment vous arrange ?': 'Que momento che convén?',
  'On affichera uniquement les créneaux disponibles.': 'Mostraremos só as franxas horarias dispoñibles.',
  'Aujourd\'hui': 'Hoxe',
  'Ce soir': 'Esta noite',
  'Demain': 'Mañá',
  'Cette semaine': 'Esta semana',
  'Voir les créneaux disponibles': 'Ver franxas horarias dispoñibles',
  'Paiement sécurisé • Modification possible avant paiement': 'Pago seguro • Modificación posible antes do pago',
  'Créneaux disponibles': 'Franxas horarias dispoñibles',
  'Sélectionnez un créneau pour continuer.': 'Selecciona unha franxa horaria para continuar.',
  'Vous validez tout au récapitulatif avant paiement.': 'Validas todo no resumo antes do pago.',
  'Récapitulatif': 'Resumo',
  'Vérifiez avant de passer au paiement.': 'Verifica antes de pasar ao pago.',
  'Prestation': 'Servizo',
  'Durée': 'Duración',
  'Quand': 'Cando',
  'Prix': 'Prezo',
  'à partir de': 'a partir de',
  'Continuer vers paiement': 'Continuar ao pago',
  'Paiement sécurisé. Annulation selon conditions. Vous pourrez choisir de reprendre avec le même prestataire après la prestation.': 'Pago seguro. Cancelación segundo condicións. Poderás escoller reservar de novo co mesmo provedor despois do servizo.',
  'Comment souhaitez-vous réserver ?': 'Como queres reservar?',
  'Réservez en 2 minutes — à domicile, paiement sécurisé.': 'Reserva en 2 minutos — no fogar, pago seguro.',
  'Réservation rapide': 'Reserva rápida',
  'Choisissez une prestation, on vous propose les créneaux.': 'Escolle un servizo, propoñémosche as franxas horarias.',
  'Recommandé': 'Recomendado',
  'Choisir un prestataire': 'Escoller un provedor',
  'Parcourez les profils et réservez dans l\'agenda.': 'Navega polos perfís e reserva no calendario.',
  'Gratuit pendant 1 mois': 'Gratis durante 1 mes'
};

// Traductions portugais -> galicien pour la section invoice
const ptTranslations = {
  'Número de factura:': 'Número de factura:',
  'Data de vencemento:': 'Data de vencemento:',
  'Inmediato': 'Inmediato',
  'Estado do pagamento:': 'Estado do pagamento:',
  'Data do servizo:': 'Data do servizo:',
  'Descrición': 'Descrición',
  'Cantidade': 'Cantidade',
  'Unidade': 'Unidade',
  'Prezo unitario (sen impostos)': 'Prezo unitario (sen impostos)',
  '% IVE': '% IVE',
  'IVE total': 'IVE total',
  'Total (con impostos)': 'Total (con impostos)',
  'Servizo reservado': 'Servizo reservado',
  'servizo': 'servizo',
  'Comisión de izyGlam': 'Comisión de izyGlam',
  'Taxas de servizo': 'Taxas de servizo',
  'IVE (Estado)': 'IVE (Estado)',
  'Subtotal (sen impostos)': 'Subtotal (sen impostos)',
  'IVE': 'IVE',
  'izyGlam - Beleza e benestar na casa': 'izyGlam - Beleza e benestar no fogar',
  'Sen definir': 'Sen definir',
  'Data non válida': 'Data non válida'
};

// Fonction pour remplacer récursivement toutes les valeurs
function replaceAllValues(obj, translations, ptTranslations) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      result[key] = replaceAllValues(obj[key], translations, ptTranslations);
    } else {
      const value = obj[key];
      if (typeof value === 'string') {
        if (translations[value]) {
          result[key] = translations[value];
        } else if (ptTranslations[value]) {
          result[key] = ptTranslations[value];
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Charger le fichier gl.json
const file = 'src/assets/i18n/gl.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const replaced = replaceAllValues(data, translations, ptTranslations);
fs.writeFileSync(file, JSON.stringify(replaced, null, 2), 'utf8');
console.log('✅ gl.json mis à jour avec toutes les traductions galiciennes!');
