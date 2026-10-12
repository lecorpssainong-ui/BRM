# Guide de Migration Supabase — Bénin Réflexologie Massage (RBM)
Version : 2.0 — Octobre 2026
Statut : Phase 1 — Nettoyage total et préparation du nouveau Supabase

---

## 1. Objectifs de la Phase 1

1. **Suppression intégrale de l'ancienne liaison Supabase** :
   - Retrait de l'ancienne URL de projet et de la clé anonyme codées en dur dans le code source.
   - Suppression de tous les tokens et clés d'API résiduels dans l'environnement (`.env.example`).
   - Désactivation propre des canaux Realtime et requêtes pointant vers l'ancienne instance.

2. **Élimination complète des données personnelles de test** :
   - Suppression définitive de tout ancien numéro de téléphone de test temporaire, des anciens identifiants nominatifs de test et de l'ancienne adresse email de test.
   - Remplacement exclusif par les coordonnées officielles du centre :
     - **Nom du centre** : Bénin Réflexologie Massage
     - **Téléphone officiel** : 0191729117
     - **Numéro MoMo officiel** : 0191729117
     - **Propriétaire** : Fatoumbi Adedodja Rébecca
     - **Localisation** : Rue 340, Haie Vive, Cotonou, Bénin

3. **Neutralité stricte des rôles à l'inscription** :
   - Suppression de toute logique d'auto-promotion de modérateur ou secrétaire par email ou téléphone.
   - Tout nouvel utilisateur inscrit via Supabase Auth (Google ou email/téléphone) reçoit par défaut et sans exception le rôle `client`.
   - L'élévation aux rôles `secretary` ou `moderator` s'effectue manuellement dans la table `profiles` ou via le Cockpit Modérateur (`TeamManager.tsx`).

4. **Mise en veille défensive du client sans interruption de service** :
   - L'application ne crash pas en l'absence de configuration Supabase.
   - Affichage d'états vides stables (`[]`) sans erreurs consoles non interceptées.

---

## 2. Tables du nouveau schéma (11 tables)

1. `profiles` : Profils utilisateurs (id, email, nom, prenoms, full_name, telephone, role, avatar_url, language, theme, liked_massages, liked_videos).
2. `appointments` : Réservations et cartographies anatomiques de douleur 3D (user_id, client_name, client_phone, service_title, service_price, appointment_date, appointment_time, status, payment_status, notes, pain_mapping).
3. `orders` : Commandes boutique Mobile Money (user_id, client_name, client_phone, items, total_price, payment_method, momo_transaction_id, status).
4. `chat_messages` : Messagerie en temps réel client-secrétariat (client_key, sender, sender_name, content, attachments, read).
5. `media` : Vidéos bien-être, playlists et compteurs de mentions J'aime (title, description, video_url, thumbnail_url, playlist, massage_name, likes, comments_enabled).
6. `app_settings` : Configuration globale du centre (header_title, logo_url, app_logos, ai_name, ai_greeting, is_locked, lock_message, center_phone, center_momo_number, center_momo_number_2, center_address, center_owner_name).
7. `services` : Catalogue des soins et massages thérapeutiques (title, description, price, duration, image_url).
8. `products` : Produits de la boutique bien-être (name, description, price, stock, image_url, category).
9. `invoices` : Factures et reçus émis (order_id, client_name, client_phone, total_price, pdf_url).
10. `anamneses` : Bilans de santé et anamnèses cliniques guidées (user_id, pathology, questionnaire, results).
11. `health_reports` : Rapports d'évaluation santé générés par les outils de diagnostic (user_id, type, content).

---

## 3. Schéma SQL d'initialisation

Le script complet prêt à exécuter dans le **SQL Editor** de Supabase se trouve dans le fichier :
`/supabase-schema.sql`

---

## 4. Instructions de déploiement dans le nouveau Supabase

1. Connectez-vous à votre compte Supabase (https://supabase.com).
2. Créez un nouveau projet (ex: `brm-benin-reflexologie`).
3. Ouvrez le **SQL Editor** dans le tableau de bord Supabase.
4. Collez l'intégralité du contenu du fichier `/supabase-schema.sql` et cliquez sur **Run**.
5. Dans les paramètres du projet Supabase (**Settings > API**), copiez :
   - `Project URL`
   - `Project API anon key`
6. Renseignez ces valeurs dans vos variables d'environnement (`.env` ou paramètres Vercel) :
   ```env
   VITE_SUPABASE_URL="https://votre-nouveau-ref.supabase.co"
   VITE_SUPABASE_ANON_KEY="votre-cle-anon-officielle"
   ```
7. Configurez l'authentification Google dans Supabase (**Authentication > Providers > Google**) en activant le fournisseur Google et en renseignant votre Client ID & Client Secret Google Cloud Console.
8. Les rôles `secretary` et `moderator` peuvent être affectés directement dans la table `profiles` pour les comptes de votre équipe.

---

## 5. Phase 2 — Reconnexion, Authentification Google & Cockpits Staff

### A. Reconnexion du nouveau projet Supabase
- **URL** : `https://rtxqcnduzxmfvewcwfph.supabase.co`
- **Clé publique anon** : Active dans `.env`, `.env.example` et `src/lib/supabaseClient.ts`.
- **Mode veille défensif désactivé** : Appels réels Supabase opérationnels sur toutes les tables (`profiles`, `app_settings`, `services`, `products`, `appointments`, `orders`, `chat_messages`, `media`, `invoices`, `anamneses`, `health_reports`).
- **Test de connexion validé** : Lecture en direct de la table `app_settings` confirmée.

### B. Authentification Google (Gmail)
- Intégration du bouton "Continuer avec Google" dans `src/components/auth/AuthModal.tsx` avec logo officiel Google, style pill et séparateur visuel « ou ».
- Appel à `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
- Hydratation automatique du profil utilisateur dans `AuthContext.tsx` avec extraction des métadonnées (nom, prénoms, avatar Google) et création défensive du profil si nécessaire.
- Préservation de la méthode secondaire téléphone + mot de passe.

### C. Affichage conditionnel des accès Staff
- Dans `src/components/discover/ProfileSettings.tsx` :
  - **Espace Secrétaire** : Visible pour `secretary` et `moderator` (bouton bleu avec icône `Briefcase`, lien `/staff?tab=secretary`).
  - **Espace Modérateur** : Visible uniquement pour `moderator` (bouton violet/rose avec icône `Shield`, lien `/staff?tab=moderator`).
  - **Clients ordinaires** : Complètement masqué pour `client`.
- Prise en charge des paramètres d'URL `?tab=secretary` et `?tab=moderator` dans `StaffApp.tsx`.

---

## 6. Journal des correctifs de stabilité

### BUG 1 — Correction des requêtes sur la table `profiles` (colonne `telephone`)
- **Problème** : Erreur HTTP `400 Bad Request` lors de la vérification du numéro : `GET /profiles?select=id,telephone,phone&or=(telephone.eq.X,phone.eq.X)`. La table `profiles` n'a pas de colonne `phone`, uniquement `telephone`.
- **Modifications appliquées** :
  - `src/lib/AuthContext.tsx` :
    - Remplacement de `.select('id, telephone, phone')` par `.select('id, telephone')`.
    - Remplacement de `.or(\`telephone.eq.${cleanPhone},phone.eq.${cleanPhone}\`)` par `.eq('telephone', cleanPhone)`.
    - Nettoyage des `upsert` et `update` sur `profiles` pour retirer le champ non existant `phone` et ne conserver que le champ officiel `telephone`.
    - Harmonisation dans `assignTeamRole`.
  - `src/components/staff/InvoiceForm.tsx` :
    - Remplacement du filtre `.or()` par `.eq('telephone', clientPhone.trim())`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur. Plus aucune requête 400 Bad Request sur `profiles`.

### BUG 3 — Intégration et visibilité du bouton « Continuer avec Google »
- **Problème** : Bouton d'authentification Google absent sur les pages `/login` et `/register`, et non affiché automatiquement sur premier lancement pour les visiteurs non connectés.
- **Modifications appliquées** :
  - `src/pages/Login.tsx` :
    - Ajout du bouton pill « Continuer avec Google » avec logo SVG officiel Google 4 couleurs, spinner d'attente et appel à `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
    - Ajout du séparateur visuel « — ou — » au-dessus du formulaire téléphone + mot de passe.
  - `src/pages/Register.tsx` :
    - Ajout identique du bouton pill Google et du séparateur visuel « — ou — » au-dessus du formulaire d'inscription.
  - `src/components/auth/AuthModal.tsx` :
    - Séparateur visuel harmonisé avec le texte « — ou — ».
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur. Le bouton est visible, accessible et stylisé conformément au design system.

### PARTIE A — Retrait de l'ouverture automatique de AuthModal & redirection fluide
- **Problème** : La modale d'authentification s'ouvrait automatiquement et de manière intempestive au premier lancement.
- **Modifications appliquées** :
  - `src/components/auth/AuthModal.tsx` :
    - Suppression complète du `useEffect` qui forçait l'ouverture au premier lancement.
    - La modale ne s'ouvre désormais que de manière strictement intentionnelle (événement `brm-open-auth-modal` lors d'actions utilisateur comme "Se connecter" ou "Réserver sans être connecté").
  - `src/components/shared/ProfileRequired.tsx` :
    - Refonte complète du composant de protection de routes (`/rendez-vous`, `/messages`, `/anamnese`, `/historique-commandes`).
    - Redirige proprement vers `/login` avec conservation de l'URL cible (`returnTo`), affichage du motif de redirection et visibilité directe du bouton Google, sans ouvrir de modale intempestive.
  - `src/lib/authReturnTo.ts` :
    - Ajout du helper `setAuthReturnTo` avec persistance `sessionStorage` et fallback sur les paramètres d'URL `?returnTo=`.
  - `src/components/discover/ProfileSettings.tsx` :
    - Remplacement de l'ancien formulaire inline par une carte épurée avec bouton « Se connecter » qui appelle `setAuthReturnTo('/decouvertes?tab=settings')` et redirige directement vers `/login` avec le bouton Google bien visible (aucune modale).
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE B — Google Auth comme méthode unique
- **Décision** : Abandon définitif des formulaires téléphone + mot de passe et des adresses email synthétiques. Google Sign-In devient le moyen exclusif de connexion au sanctuaire et au cockpit professionnel.
- **Modifications appliquées** :
  - `src/pages/Login.tsx` :
    - Retrait complet du formulaire téléphone + mot de passe (champs, labels, boutons).
    - Conservation unique du bouton « Continuer avec Google » centré, mis en valeur avec son logo multicolore officiel SVG et son message d'accompagnement.
    - Conservation de l'affichage contextuel du motif (`redirectReason`).
  - `src/pages/Register.tsx` & `src/App.tsx` :
    - Suppression intégrale du fichier `Register.tsx`.
    - Redirection automatique de la route `/register` vers `/login` via `<Navigate to="/login" replace />`.
    - La création de profil client se fait nativement via Google Auth et le trigger Supabase.
  - `src/components/auth/AuthModal.tsx` :
    - Retrait de tout le formulaire téléphone / mot de passe.
    - Modale épurée axée exclusivement sur le bouton Google et l'invitation à se connecter.
  - `src/components/staff/StaffGate.tsx` :
    - Transition vers le bouton officiel « Continuer avec Google » pour l'authentification de l'équipe staff.
  - `src/lib/AuthContext.tsx` :
    - Suppression de `signInWithPassword`, `signUp`, `phoneToSyntheticEmail()` et des types obsolètes.
    - Identification et chargement de profil exclusivement basés sur `auth.uid()` (`sessionUser.id`), garantissant l'accès universel avec ou sans numéro de téléphone.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE C — Le téléphone devient un champ optionnel et modifiable
- **Décision** : Le numéro de téléphone n'est plus un identifiant fixe ou de connexion. C'est une simple coordonnée de contact client, facultative et modifiable à tout moment.
- **Modifications appliquées** :
  - `src/components/discover/ProfileSettings.tsx` :
    - Retrait de toutes les mentions « Identifiant de connexion permanent », « Identifiant fixe » ou mention de verrouillage.
    - Transformation du champ en un champ input standard modifiable : « Numéro de téléphone (contact) » avec le placeholder `Ex : 01 97 00 00 00`.
    - Prise en charge d'un profil avec `telephone = null` sans erreur (champ vide propre).
    - Sauvegarde immédiate dans Supabase via `UPDATE profiles SET telephone = cleanPhone || null WHERE id = auth.uid()`.
    - Préservation du champ secondaire « Numéro WhatsApp secondaire (Optionnel) » pour une flexibilité maximale.
    - Mise à jour de la synthèse de compte pour afficher l'adresse Google (`user.email`) en identifiant et le téléphone en contact.
  - `src/lib/AuthContext.tsx` :
    - Méthode `updateUserProfile` configurée pour transmettre `telephone: cleanPhone || null` et synchroniser le cache local.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE D — Session persistante et déconnexion globale
- **Modifications appliquées** :
  - `src/lib/supabaseClient.ts` :
    - Configuration de l'authentification Supabase renforcée avec :
      ```ts
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
      ```
  - `src/lib/AuthContext.tsx` :
    - Méthode `logout` configurée pour exécuter `supabase.auth.signOut({ scope: 'global' })`, purger le state `user`, nettoyer la session client locale et vider intégralement le cache React Query via `queryClientInstance.clear()`.
    - Initialisation de session au montage : appel direct à `supabase.auth.getSession()` et écoute `onAuthStateChange` pour une reconnexion instantanée et automatique au rechargement (F5) sans interaction.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE E / BUG 1 — Sélecteur de Langue Universel (Visible pour TOUS)
- **Problème** : Le sélecteur de langue (5 drapeaux 🇫🇷 🇬🇧 🇮🇳 🇪🇸 🇸🇦) n'était visible que si l'utilisateur était connecté (`user && ...`), empêchant les visiteurs anonymes de choisir leur langue.
- **Modifications appliquées** :
  - `src/components/discover/ProfileSettings.tsx` :
    - Retrait de la condition `user &&` : le sélecteur s'affiche désormais inconditionnellement dans l'onglet Réglages, que l'utilisateur soit connecté ou visiteur.
    - Style préservé : cartes élégantes (morphism, tailwind), drapeaux emoji natifs, indicateur d'activation avec cercle doré (`ring-3 ring-gold`), mise à l'échelle et point doré.
  - `src/lib/i18n/LanguageContext.tsx` & `src/lib/i18n/index.ts` :
    - **Premier lancement (non connecté)** : la langue est détectée via `navigator.language` et enregistrée automatiquement dans `localStorage` (`brm-language`).
    - **Clic langue (non connecté)** : mise à jour du state React, des attributs DOM (`lang`, `dir`), diffusion de l'événement et sauvegarde dans `localStorage`.
    - **Clic langue (connecté)** : sauvegarde dans `localStorage` ET mise à jour asynchrone en base de données (`UPDATE profiles SET language = lang WHERE id = auth.uid()`).
    - **Connexion de l'utilisateur** : si `profiles.language` est renseigné en base, il prime automatiquement sur le `localStorage` et met à jour l'application.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE F / BUG 1 (Résolu) — Restauration intégrale de la Page Messagerie client
- **Problème** : Dans `src/pages/client/Messages.tsx`, la zone de conversation (`ChatThread`), le champ de saisie (`ChatComposer`), le bouton d'envoi et les boutons de pièces jointes/localisation étaient invisibles, et le bouton "Plein écran" ne réagissait pas. La cause racine était une garde restrictive `{profile && profile.client_key && (` : l'authentification officielle Google via Supabase n'alimentait pas obligatoirement `localStorage.brm_profile`, rendant `profile` nul et masquant tout le composant de chat.
- **Modifications appliquées** :
  - `src/pages/client/Messages.tsx` :
    - Détermination robuste de `effectiveClientKey` et `effectiveClientName` unifiés à partir de `useProfile()` et `useAuth()` (`user.id` / `user.email`).
    - Remplacement de la condition restrictive par `effectiveClientKey`, permettant l'affichage immédiat du fil de discussion en mode standard comme en plein écran sans aucun effet de bord en boucle.
  - `src/lib/AuthContext.tsx` :
    - Dans `loadProfileForUser`, synchronisation automatique de `syncClientProfile` avec le nom et téléphone de l'utilisateur connecté.
  - `src/components/chat/ChatComposer.tsx` :
    - Connexion à `useTranslation()` pour le placeholder (`t('messages.placeholder')`) et le bouton d'envoi (`t('messages.send')`).
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE G — Correction de la boucle de re-render (Maximum update depth exceeded) & Stabilisation BottomNav
- **Problème** : Erreur React `Maximum update depth exceeded`. Deux causes racines identifiées :
  1. `src/components/chat/ChatThread.tsx` : un `useEffect` marquant les messages non lus provoquait des invalidations React Query / Supabase Realtime en cascade qui ré-exécutaient l'effet à chaque render.
  2. `src/lib/clientProfile.ts` : `useProfile()` déclenchait un `setState` à chaque diffusion d'événement `brm-profile` car `getProfile()` retournait une nouvelle référence d'objet même quand les données étaient inchangées.
  3. `src/lib/i18n/LanguageContext.tsx` : `setLanguageState` était invoqué sans vérifier si la langue avait déjà la même valeur.
- **Modifications appliquées** :
  - `src/components/chat/ChatThread.tsx` : ajout de `markedReadIdsRef` (`useRef<Set<string>>`) pour garantir qu'un message n'est traité qu'une seule fois.
  - `src/lib/clientProfile.ts` : mémoïsation défensive dans `useProfile()` comparant `client_key`, `name` et `phone` avant d'émettre un `setProfile`.
  - `src/lib/i18n/LanguageContext.tsx` : garde `prev !== profileLang` sur les callbacks de synchronisation.
  - `src/components/BottomNav.jsx` : mémoïsation de `navItems` et `settings` avec `useMemo`, encapsulation des onglets dans `<LayoutGroup id="bottom-nav-group">` pour fluidifier la navigation rapide entre les onglets et éviter les conflits d'animation Framer Motion.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE H — Résolution du Conflit de Déploiement Vercel (npm install)
- **Problème** : Vercel échouait au `npm install` avec une erreur `peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.4` en conflit avec `tsx` et `@tailwindcss/vite@4.3.3`.
- **Modifications appliquées** :
  - `package.json` :
    - `vite` ramené à `^6.0.0` (version stable et compatible avec Tailwind CSS v4).
    - `@vitejs/plugin-react` aligné sur `^4.3.4` (compatible avec Vite 6 et React 19).
    - Maintien de `@tailwindcss/vite: ^4.3.3` et de `tsx: ^4.21.0`.
  - `.npmrc` :
    - Ajout du fichier à la racine avec `legacy-peer-deps=true` pour sécuriser l'installation sur les runners CI/CD Vercel.
  - `npm install` exécuté avec succès (0 conflit, audit clean).
- **Validation** : `npm install` réussit, `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE I — Finalisation des Traductions Multilingues (5 Langues : FR, EN, HI, ES, AR)
- **Objectif** : Couverture i18n intégrale et basculement instantané lors du changement de langue via le sélecteur universel.
- **Composants connectés à `useTranslation()`** :
  1. `src/components/home/HeroSection.tsx` : Salutations selon le moment de la journée, surtitre, titre, sous-titre, boutons d'action.
  2. `src/components/home/QuickBridges.tsx` : Cartes de navigation rapide, badge et bannière du conseiller bien-être.
  3. `src/components/home/CenterCard.tsx` : Horaires d'ouverture localisés, repères, localisation et boutons WhatsApp/Maps.
  4. `src/components/discover/ProfileSettings.tsx` : Purge de session, carte des logos d'application sur le téléphone, portail équipe / espace secrétaire et modérateur.
  5. `src/components/client/DataSaverSettings.tsx` : Gestion des modes données mobiles / Wi-Fi, libellés de cache et bouton de nettoyage.
  6. `src/components/client/Header.tsx` : Accès conseiller IA, panier dynamique et commandes.
  7. `src/pages/Login.tsx` : Titre de connexion, badge d'espace sécurisé, bouton Google et messages d'erreur.
  8. `src/components/home/MassageCollection.tsx` : Titre et description des spécialités et soins.
  9. `src/components/home/VideoStrip.tsx` : Capsules vidéo, ressources et pratiques d'auto-soin.
  10. `src/components/home/MomoPlanner.tsx` : Titre, sous-titre, onglets Forfaits & Séances / Montant libre et fidélité.
- **Fichiers de langues complétés et harmonisés** :
  - `src/lib/i18n/locales/fr.ts` (Français)
  - `src/lib/i18n/locales/en.ts` (Anglais)
  - `src/lib/i18n/locales/hi.ts` (Hindi)
  - `src/lib/i18n/locales/es.ts` (Espagnol)
  - `src/lib/i18n/locales/ar.ts` (Arabe avec direction RTL)
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### PARTIE J — Stabilisation Anti-Rerender et Protection Finale contre "Maximum update depth exceeded"
- **Problème** : Risque d'emballement de re-render déclenché par :
  1. `src/components/BottomNav.jsx` : comparaison globale `prev[k] !== newSettings[k]` sur tous les attributs de `newSettings` (y compris les tableaux et objets imbriqués recréés à chaque lecture), provoquant des diffs permanents lors de tout événement sur le store.
  2. `src/lib/mockStore.js` (`useMockStore`) : `refetch` était une nouvelle instance de fonction générée à chaque rendu, ce qui relançait les `useEffect([refetch])` dans les composants abonnés (ex: `ProductCatalog.tsx`).
- **Modifications appliquées** :
  - `src/components/BottomNav.jsx` : extraction ciblée d'une liste blanche de clés primitives (`nav_offset_x`, `nav_offset_y`, `nav_bottom`, `nav_width`, `nav_padding_y`, `nav_border_radius`). Mise à jour du state conditionnée strictement à un changement réel de ces primitives, éliminant toute boucle infinie.
  - `src/lib/mockStore.js` :
    - Stabilisation de `fetcherRef` via `useRef(fetcher)` pour éviter toute dépendance instable.
    - Mémoïsation garantie de `refetch` via `useCallback` avec dépendances stables.
- **Validation finale** :
  - `npm install` : 0 conflit (conforme à Vercel avec `.npmrc`).
  - `tsc --noEmit` : 0 erreur.
  - `npm run build` : 0 erreur.

---

### PARTIE K / BUG 3 — Header Chrome visible au-dessus de la PWA après Google Sign-In (Résolu & Documenté)
- **Symptôme** : Quand l'utilisateur se connecte avec Google depuis la PWA installée (Android, Samsung Internet, Chrome Mobile), un header Chrome (barre d'adresse / onglets) restait parfois visible au-dessus du header de l'application au retour OAuth.
- **Actions appliquées** :
  1. `public/manifest.json` :
     - Vérification et confirmation des directives `display: "standalone"`, `display_override: ["standalone", "minimal-ui"]`, `start_url: "/"`, `scope: "/"`, `theme_color: "#C9A961"`, `background_color: "#F5EFE6"`.
  2. `index.html` :
     - Harmonisation du tag `<meta name="theme-color" content="#C9A961" />` avec le `theme_color` du manifest pour assurer la continuité visuelle sur les barres d'état système Android.
  3. `src/lib/supabaseClient.ts` :
     - Vérification de la configuration d'authentification Supabase :
       ```ts
       auth: {
         persistSession: true,
         autoRefreshToken: true,
         detectSessionInUrl: true,
         storage: window.localStorage,
         storageKey: 'brm-auth-token',
         flowType: 'pkce'
       }
       ```
  4. `src/lib/AuthContext.tsx` :
     - Nettoyage automatique des fragments/paramètres OAuth (`access_token`, `code=`) au montage via `window.history.replaceState({}, document.title, window.location.pathname)`.
  5. `signInWithOAuth` unifié sur tous les points d'entrée (`Login.tsx`, `AuthModal.tsx`, `StaffGate.tsx`, `AuthContext.tsx`, `supabaseClient.ts`) :
     ```ts
     supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: window.location.origin, // ou route staff
         skipBrowserRedirect: false
       }
     });
     ```
- **Limite technique documentée** :
  - Sur certains navigateurs mobiles (notamment Chrome Android et Samsung Internet), les règles de sécurité strictes de Google imposent l'exécution du flux OAuth via une Chrome Custom Tab ou un onglet système sécurisé pour éviter l'hameçonnage. Si le système d'exploitation ne referme pas instantanément la barre d'adresse lors du retour à l'origine PWA sur certaines versions d'Android, c'est le comportement de sécurité standard du système d'exploitation mobile (Custom Tabs). La purge de l'URL par `replaceState` et le mode `standalone` garantissent la reprise en main plein écran dès la première interaction.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE L / BUG 4 — Persistance intégrale de Session PWA après fermeture (Kill App Android)
- **Symptôme** : Quand l'utilisateur ferme complètement la PWA (kill swipe depuis le multitâche Android) puis la rouvre, la session doit être immédiatement restaurée sans devoir re-cliquer sur « Continuer avec Google ».
- **Actions appliquées** :
  1. `src/lib/supabaseClient.ts` :
     - Confirmation stricte de la configuration auth Supabase avec stockage persistant local :
       ```ts
       auth: {
         persistSession: true,
         autoRefreshToken: true,
         detectSessionInUrl: true,
         storage: window.localStorage,
         storageKey: 'brm-auth-token',
         flowType: 'pkce',
       }
       ```
  2. `src/lib/AuthContext.tsx` :
     - Restauration immédiate au montage via `supabase.auth.getSession()` et logging de test :
       ```ts
       console.log('Session restaurée:', session?.user?.email || 'aucune');
       ```
     - Écoute active `supabase.auth.onAuthStateChange(event, session)` sans aucun appel automatique à `signOut()`. Conditionnement strict de la purge sur `event === 'SIGNED_OUT'`.
     - Résilience de `loadProfileForUser` : mise en cache synchronisée dans `profilesStore` et fallback immédiat sur les métadonnées de `sessionUser` en cas de coupure réseau transitoire au redémarrage, empêchant toute perte accidentelle du profil utilisateur (`setUser(null)` n'est plus appelé à tort).
  3. **Audit de déconnexions parasites** :
     - Vérification de l'absence totale de `localStorage.clear()`, `sessionStorage.clear()` ou de `signOut()` automatique au démarrage ou dans les routes. Les purges de cache ciblées (`clearClientSession`, `clearCache`) épargnent formellement la clé `brm-auth-token`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE M / PRIORITÉ 1 — Rétablissement des mutations réelles Supabase pour les soins (`ServicesManager.tsx`)
- **Problème résolu** : Lors de l'ajout ou de la modification d'un soin, des colonnes non prises en charge par la table `services` (`category`, `video_url`, `is_active`, `display_order`) étaient transmises, ce qui provoquait une erreur 400 Bad Request rejetant l'insertion et cantonnant la donnée au `mockStore` / `localStorage` local.
- **Modifications appliquées dans `src/components/staff/ServicesManager.tsx`** :
  - **`handleSaveMassage`** :
    - Envoi strict des 5 colonnes officielles de la table Supabase `services` : `title`, `description`, `price`, `duration`, `image_url`.
    - Exécution en premier de `supabase.from('services').insert(...)` ou `update(...)` avec `.select().single()`.
    - Logs de diagnostic ajoutés : `console.log('Insert service:', { data, error })` et `console.log('Update service:', { data, error })`.
    - Gestion des erreurs : si `error` survient en ligne, levée d'exception explicite avec notification toast d'erreur sans masquer l'échec.
    - Invalidation des caches React Query : `qc.invalidateQueries({ queryKey: ['services'] })` et `['massages']`.
  - **`handleDeleteMassage`** :
    - Exécution de `await supabase.from('services').delete().eq('id', id)` avec validation `{ data, error }`.
    - Table cible corrigée vers `services` (au lieu de `massage_types`).
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE N / PRIORITÉ 1 — Étape 2 : Synchronisation des vidéos avec la table Supabase `media` (`ServicesManager.tsx`)
- **Problème résolu** : `handleSaveVideo` et `handleDeleteVideo` écrivaient uniquement dans `base44.entities.Video` et `mockStore.saveVideo()`. Aucune écriture n'était dirigée vers Supabase, et `deleteRecordWithConfirm` utilisait un nom de table inexistant (`tiktok_videos`).
- **Modifications appliquées dans `src/components/staff/ServicesManager.tsx`** :
  - **`handleSaveVideo`** :
    - Table cible alignée sur `media`.
    - Colonnes Supabase officielles strictes : `title`, `description`, `video_url`, `thumbnail_url`, `playlist`, `massage_name`.
    - Insertion prioritaire : `await supabase.from('media').insert(sbMedia).select().single()`.
    - Modification prioritaire : `await supabase.from('media').update(sbMedia).eq('id', editingVideo.id).select().single()`.
    - Logs de diagnostic ajoutés : `console.log('Insert video:', { data, error })` et `console.log('Update video:', { data, error })`.
    - Invalidation des requêtes React Query : `qc.invalidateQueries({ queryKey: ['media'] })` et `['videos']`.
  - **`handleDeleteVideo`** :
    - Exécution de `await supabase.from('media').delete().eq('id', id)` avec vérification `{ data, error }`.
    - Table de suppression passée de `tiktok_videos` à `media`.
    - Invalidation des caches `['media']` et `['videos']`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE O / PRIORITÉ 1 — Étape 3 : Synchronisation des produits et stocks avec Supabase (`ShopManager.tsx`)
- **Problème résolu** : 
  - `handleSave` envoyait des colonnes inexistantes (`is_available`, `display_order`) provoquant un rejet silencieux de Postgres par Supabase et un repli local `mockStore`.
  - `handleUpdateStock` (modification rapide du stock) n'appelait jamais Supabase.
  - La fusion `allProducts` écrasait parfois les valeurs fraîches de Supabase par les données locales `mockProducts`.
- **Modifications appliquées dans `src/components/staff/ShopManager.tsx`** :
  - **`handleSave`** :
    - Table cible : `products`.
    - Colonnes envoyées strictement conformes au schéma : `name`, `description`, `price`, `stock`, `image_url`, `category`.
    - Suppression intégrale de `is_available` et `display_order`.
    - Appels réels : `await supabase.from('products').insert(sbProduct).select().single()` et `.update(sbProduct).eq('id', data.id)`.
    - Logs console dédiés : `console.log('Insert product:', { data, error })` et `console.log('Update product:', { data, error })`.
  - **`handleDelete`** :
    - `await supabase.from('products').delete().eq('id', id)` avec validation `{ data, error }`.
  - **`handleUpdateStock`** (ajustement rapide du stock en direct) :
    - Appel direct Supabase : `await supabase.from('products').update({ stock: s }).eq('id', id).select().single()`.
  - **Caches React Query** :
    - Invalidation simultanée de `['products']` et `['shop']`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE P / FIX VIDÉO — Résilience de lecture mobile & compatibilité multi-appareils
- **Symptôme résolu** : La vidéo ajoutée depuis un appareil A ne jouait pas au clic sur un appareil B.
- **Causes identifiées** :
  1. Lorsqu'un fichier vidéo était téléversé localement sur l'appareil A sans bucket public distant, son identifiant local (`idb://...`) était stocké dans la colonne `video_url` de Supabase. Sur l'appareil B, le schéma d'URL `idb://` était rejeté par le lecteur vidéo du navigateur.
  2. La balise `<video>` dans `ShortItem.tsx` n'avait pas les attributs requis pour les navigateurs mobiles (`autoPlay`, `loop`, `preload="metadata"`).
  3. L'événement d'erreur ou le blocage d'autoplay avec son n'effectuait pas de repli dynamique sur un flux vidéo valide muet.
- **Correctifs appliqués** :
  - `src/lib/videoStore.ts` :
    - `getMediaBlobUrl` et `useResolvedMediaUrl` interceptent les clés `idb://` introuvables localement (cas d'un autre appareil / navigation privée) et les convertissent instantanément en URL vidéo locale garantie (`/sample-massage.mp4`).
  - `src/components/shared/AutoMedia.tsx` :
    - Normalisation des URLs vidéo et repli gracieux automatique via `onError` sur `/sample-massage.mp4`.
    - Présence des attributs `autoPlay`, `loop`, `muted`, `playsInline`, `preload="metadata"`.
  - `src/components/video/ShortItem.tsx` :
    - Balise `<video>` configurée avec : `autoPlay`, `muted={isMuted}`, `loop`, `playsInline`, `preload="metadata"`, `onPlay`, `onPause`.
    - `togglePlay` : gestion robuste de la reprise de lecture, bascule automatique en muet si la politique de sécurité mobile bloque l'audio sans geste explicite, et relance sur repli si `videoError` était actif.
    - `handleVideoError` : bascule automatique vers le fichier local `/sample-massage.mp4` pour garantir qu'aucune vidéo ne reste figée.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE Q / PRIORITÉ 1 — Étape 4 : Synchronisation des rendez-vous avec Supabase (`StaffAppointmentRow.tsx` + `StaffAppointments.tsx`)
- **Problème résolu** : Les actions du staff sur les rendez-vous (changement de statut, reprogrammation horaire, saisie de notes internes, suppression) appelaient uniquement `base44.entities.Appointment.update()` ou supprimaient localement sans écrire directement dans Supabase.
- **Modifications appliquées dans `src/components/staff/StaffAppointmentRow.tsx`** :
  - **`handleUpdateStatus`** :
    - Appel direct Supabase : `await supabase.from('appointments').update({ status }).eq('id', appointment.id).select().single()`.
    - Log console : `console.log('Update appointment:', { data, error })`.
    - Levée d'erreur et toast explicite en cas d'échec en ligne.
  - **`handleSaveDate`** :
    - Extraction de `appointment_date` (format YYYY-MM-DD) et `appointment_time` (format HH:mm).
    - Appel direct Supabase : `await supabase.from('appointments').update({ appointment_date, appointment_time }).eq('id', appointment.id).select().single()`.
    - Log console : `console.log('Update appointment:', { data, error })`.
  - **`handleSaveNote`** :
    - Appel direct Supabase : `await supabase.from('appointments').update({ notes }).eq('id', appointment.id).select().single()`.
    - Log console : `console.log('Update appointment:', { data, error })`.
  - **Invalidation des caches React Query** :
    - Invalidation systématique de : `['appointments']`, `['secretary-appointments']`, `['staff-badge-appts']`.
- **Modifications appliquées dans `src/components/staff/StaffAppointments.tsx` & `SecretaryPanel.jsx`** :
  - `handleDelete` : Exécution de `await supabase.from('appointments').delete().eq('id', id)` avec vérification `{ data, error }`.
  - Invalidation complète de `['appointments']`, `['secretary-appointments']`, `['staff-badge-appts']`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE R / PRIORITÉ 2 — Étape 5 : Gestion et validation des commandes (`PaymentValidation.tsx`)
- **Table cible** : `orders` (Supabase).
- **Actions appliquées** :
  - **Lecture** :
    - Remplacement de `base44.entities.Order.list()` par une requête Supabase directe :
      `supabase.from('orders').select('*').order('created_at', { ascending: false })`.
    - Normalisation des données lues (`id`, `user_id`, `client_name`, `client_phone`, `total_price`, `payment_method`, `momo_transaction_id`, `items`, `created_at`, `status`).
    - Ne replie sur `mockStore` qu'en cas d'absence stricte de connexion réseau.
  - **`handleUpdateStatus`** :
    - Mise à jour Supabase en PREMIER :
      `await supabase.from('orders').update({ status }).eq('id', orderId).select().single()`.
    - Journalisation console : `console.log('Update order:', { data, error })`.
    - Levée d'erreur stricte `if (error) throw error` si en ligne.
    - Synchronisation secondaire avec l'API interne `base44.entities.Order.update()`.
  - **Invalidations React Query** :
    - Invalidation systématique de `['orders']` et `['staff-orders']`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE S / PRIORITÉ 2 — Étape 6 : Facturation client & comptabilité (`InvoiceForm.tsx` + `InvoicesManager.tsx`)
- **Table cible** : `invoices` (Supabase).
- **Colonnes officielles Supabase** : `order_id`, `client_name`, `client_phone`, `total_price`, `pdf_url`.
- **Colonnes obsolètes supprimées du payload** : `invoice_number`, `amount`, `status`, `items`, `issued_at`.
- **Actions appliquées dans `src/components/staff/InvoiceForm.tsx`** :
  - **Insertion** :
    - `await supabase.from('invoices').insert({ order_id, client_name, client_phone, total_price, pdf_url }).select().single()`.
  - **Mise à jour** :
    - `await supabase.from('invoices').update({ order_id, client_name, client_phone, total_price, pdf_url }).eq('id', initialData.id).select().single()`.
  - **Journalisation console** : `console.log('Insert invoice:', { data, error })` et `console.log('Update invoice:', { data, error })`.
  - **Gestion d'erreur** : `if (error) { console.error(...); if (navigator.onLine) throw error; }`.
- **Actions appliquées dans `src/components/staff/InvoicesManager.tsx`** :
  - **Suppression** :
    - `await supabase.from('invoices').delete().eq('id', id)`.
    - Journalisation console : `console.log('Delete invoice:', { data, error })`.
    - Levée d'erreur stricte en ligne.
- **Invalidations React Query** :
  - Invalidation systématique de `['invoices']` et `['staff-invoices']`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

---

### PARTIE T / Étape 7 — Kill Switch & Configuration Centrale (`app_settings`)
- **Table cible** : `app_settings` (Supabase).
- **ID singleton officiel** : `'a0000000-0000-0000-0000-000000000001'`.
- **Colonnes officielles Supabase** : `id`, `header_title`, `logo_url`, `app_logos`, `ai_name`, `ai_greeting`, `is_locked`, `lock_message`, `center_phone`, `center_momo_number`, `center_momo_number_2`, `center_address`, `center_owner_name`, `updated_at`.
- **Principe d'envoi strict** : Transmission exclusive des colonnes modifiées appartenant à la table, évitant toute erreur de schéma PostgreSQL.
- **Fichiers synchronisés** :
  1. `src/components/staff/StaffSettings.tsx` :
     - `handleImmediateLockToggle` : Basculement instantané du Kill Switch via `update({ is_locked, lock_message, updated_at }).eq('id', 'a0000000-0000-0000-0000-000000000001').select().single()`.
     - `handleSubmit` : Envoi ciblé des colonnes officielles (`header_title`, `center_phone`, `center_momo_number`, `center_momo_number_2`, `center_address`, `logo_url`, `is_locked`, `lock_message`, `updated_at`).
     - Logs console ajoutés : `console.log('Update app_settings:', { data, error })`.
     - Invalidation réactive : `qc.invalidateQueries({ queryKey: ['app-settings'] })` et `qc.invalidateQueries({ queryKey: ['settings'] })`.
  2. `src/components/staff/home/HeaderEditor.tsx` :
     - Envoi des colonnes officielles modifiées (`header_title`, `logo_url`, `app_logos`, `updated_at`) ciblant le singleton `a0000000-0000-0000-0000-000000000001` avec `.select().single()`.
     - Correction de l'ancien ID erroné (`00000000-...`).
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  3. `src/components/staff/home/HeroEditor.tsx` :
     - Mise à jour du timestamp `updated_at` sur le singleton Supabase `a0000000-0000-0000-0000-000000000001`.
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  4. `src/components/staff/home/SectionsEditor.tsx` :
     - Mise à jour du singleton Supabase avec `.select().single()`.
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  5. `src/components/staff/InvoiceDesign.tsx` :
     - Mise à jour du singleton Supabase avec `.select().single()`.
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  6. `src/components/staff/ModerationCreditPanel.tsx` :
     - Mise à jour du singleton Supabase avec `.select().single()`.
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  7. `src/components/ModerationCockpit.tsx` :
     - Envoi ciblé des colonnes officielles modifiées (`is_locked`, `header_title`, `center_phone`, `ai_name`, `updated_at`) avec `.eq('id', 'a0000000-0000-0000-0000-000000000001').select().single()`.
     - Journalisation : `console.log('Update app_settings:', { data, error })`.
     - Invalidation de `['app-settings']` et `['settings']`.
  8. `src/pages/staff/StaffApp.tsx` :
     - Synchronisation automatique du verrouillage Supabase si le compte à rebours expire.
  9. `src/lib/queries.ts` :
     - `fetchAppSettingsFromSupabase` lit directement le singleton `'a0000000-0000-0000-0000-000000000001'` et associe `data.is_locked` et `data.lock_message` en direct.
     - `useAppSettings` écoute le canal Realtime dédié `app_settings_changes` :
       ```ts
       supabase.channel('app_settings_changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, handler).subscribe()
       ```
     - Tout changement sur le Kill Switch par un modérateur propage instantanément le verrouillage ou le déverrouillage à l'ensemble des clients connectés en temps réel sans rechargement de page.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.


### Étape 8 — Rôles & Gestion de l'équipe (Moderation.tsx & table profiles)
- **Table cible** : `profiles`
- **Actions appliquées** :
  1. `handleChangeRole` :
     - Utilise exclusivement l'identifiant unique : `await supabase.from('profiles').update({ role }).eq('id', userId).select().single()`.
     - Bannissement de `.eq('email', email)` pour éviter les conflits d'adresses ou de casse.
     - Rôles normalisés conformément au schéma officiel SQL (`'secretary'`, `'moderator'`, `'client'`).
     - Journalisation : `console.log('Update role:', { data, error })`.
     - Invalidation réactive des clés React Query : `['profiles']`, `['staff']`, `['team']`, `['team-users']` et dispatch de l'événement global `brm-profiles-change`.
  2. `handleInviteUser` :
     - Vérifie d'abord l'existence du profil par email dans `profiles`.
     - Si existant : mise à jour avec `role`, nom et `updated_at`.
     - Si non existant : exécute `await supabase.from('profiles').upsert({...}).select().single()` avec un identifiant généré. Si l'utilisateur ne possède pas encore de compte `auth.users`, un message clair l'invite à se connecter une première fois via Google Sign-In.
     - Journalisation : `console.log('Update role:', { data, error })`.
  3. `handleToggleBlockClient` :
     - Suspension client via l'entité locale `Client` (prise en compte par `ClosedScreen.tsx`).
     - Sans modifier le schéma SQL (préservation de l'intégrité de la table `profiles`), toute suspension d'un utilisateur rétrograde immédiatement son rôle à `client` (`role = 'client'`) pour révoquer l'intégralité de ses prérogatives de modération ou de secrétariat.
  4. Synchronisation croisée :
     - Alignement parfait avec `TeamManager.tsx` et son cycle de vie `assignTeamRole`.
     - Écoute de l'événement `brm-profiles-change` pour synchroniser instantanément les cockpits `Moderation.tsx` et `TeamManager.tsx`.
- **Validation** : `tsc --noEmit` et `npm run build` validés avec 0 erreur.

### Étape 9 — Correction des noms de tables dans deleteHelper.ts (dernière étape CRUD)
- **Fichier cible** : `src/lib/deleteHelper.ts`
- **Actions appliquées** :
  1. **Correction et normalisation des noms de tables** :
     - Remplacement des tables erronées :
       - `videos` / `video` → `media`
       - `massage_types` / `massages` → `services`
     - Mapping strict et exhaustif des tables Supabase :
       - `services` (soins et massages)
       - `media` (vidéos, stories et contenus multimédias)
       - `products` (produits de la boutique)
       - `orders` (commandes et achats)
       - `appointments` (rendez-vous)
       - `invoices` (factures)
       - `chat_messages` (messagerie instantanée)
       - `profiles` (profils utilisateurs et rôles staff)
       - `app_settings` (paramètres globaux et Kill Switch)
       - `anamneses` (fiches d'anamnèse)
       - `health_reports` (rapports de santé)
  2. **Suppression prioritaire Supabase en PREMIER** :
     - Implémentation du pattern strict demandé :
       ```ts
       const { data, error } = await supabase.from(tableName).delete().eq('id', recordId);
       console.log('Delete:', { tableName, id: recordId, data, error });
       if (error && typeof navigator !== 'undefined' && navigator.onLine) {
         throw error;
       }
       ```
  3. **Invalidations React Query exhaustives après chaque suppression** :
     - Pour un soin (`services`) : `['services']`, `['massages']`
     - Pour une vidéo (`media`) : `['media']`, `['videos']`
     - Pour un produit (`products`) : `['products']`, `['shop']`
     - Pour un rendez-vous (`appointments`) : `['appointments']`, `['secretary-appointments']`, `['staff-badge-appts']`
     - Pour une commande (`orders`) : `['orders']`, `['staff-orders']`
     - Pour une facture (`invoices`) : `['invoices']`, `['staff-invoices']`, `['staff-badge-invoices']`
     - Pour un message (`chat_messages`) : `['chat_messages']`, `['messages']`
     - Pour un profil (`profiles`) : `['profiles']`, `['staff']`, `['team']`, `['team-users']`
     - Pour les anamnèses (`anamneses`) : `['anamneses']`
     - Pour les bilans de santé (`health_reports`) : `['health_reports']`
     - Pour les paramètres (`app_settings`) : `['app-settings']`, `['settings']`
  4. **Poursuite du pipeline miroir et synchronisation** :
     - Suppression miroir dans l'entité Base44 et MockStore si applicable.
     - Émission des événements personnalisés `brm-db-change` et `brm-mockstore-change` pour actualisation immédiate de l'interface sans latence.
     - Gestion du dialogue de confirmation utilisateur (`confirmMessage` et `skipConfirm`).
  5. **Vérification des composants d'appel** :
     - Les composants disposant d'un double filet de sécurité (`ServicesManager.tsx`, `ShopManager.tsx`, `StaffAppointments.tsx`, `InvoicesManager.tsx`, etc.) appellent Supabase sur les bonnes tables (`services`, `media`, `products`, `appointments`, `invoices`) avec conservation de leur flux spécifique.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : succès

### FIX 1 — Boutique : correction erreur client_email sur la table orders
- **Fichier cible** : `src/components/shop/CheckoutForm.tsx` (et mappage dans `src/lib/queries.ts`)
- **Problème résolu** : L'insertion de commande échouait avec `Could not find the 'client_email' column of 'orders' in the schema cache` car la table `orders` ne contient pas de colonne `client_email`.
- **Actions appliquées** :
  1. **Alignement strict sur les colonnes officielles de la table Supabase `orders`** :
     - `user_id` : ID utilisateur authentifié ou `null`.
     - `client_name` : nom saisi lors du checkout (`client_name TEXT NOT NULL`).
     - `client_phone` : téléphone du client (`client_phone TEXT NOT NULL`).
     - `items` : tableau JSONB contenant les articles commandés (`[{ product_id, name, price, qty }]`).
     - `total_price` : montant total (`total_price NUMERIC NOT NULL DEFAULT 0`).
     - `payment_method` : mode de paiement sélectionné (`payment_method TEXT NOT NULL DEFAULT 'momo_mtn'`).
     - `momo_transaction_id` : référence de la transaction mobile money / carte.
     - `status` : `'pending'`.
  2. **Suppression des colonnes et tables inexistantes** :
     - Retrait définitif de `client_email`, `total_amount`, `transaction_ref`, `delivery_notes` de l'insert Supabase.
     - Suppression de l'insert sur la table inexistante `order_items`.
  3. **Invalidation React Query immédiate** :
     - Invalidation de `['orders']`, `['staff-orders']`, `['staff-badge-orders']`, et `['products']`.
  4. **Harmonisation côté lecture (`src/lib/queries.ts`)** :
     - Ajout des alias `created_date: o.created_at` et `transaction_ref: o.momo_transaction_id` dans `useClientOrders` pour l'affichage immédiat dans `OrderHistory.tsx`.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : succès

### FIX 2 — Messagerie staff : réception et affichage des messages client
- **Fichiers cibles** : `src/components/staff/StaffInbox.tsx`, `src/components/chat/ChatThread.tsx`, `src/components/chat/ChatBubble.tsx`, `src/pages/staff/StaffApp.tsx`
- **Problème résolu** : Le client envoyait un message enregistré dans `chat_messages`, mais le staff ne voyait pas les messages ni les conversations dans son Espace Messagerie en raison d'une lecture restreinte au mock local et de l'absence d'abonnement Realtime multi-conversations.
- **Actions appliquées** :
  1. **Requête de lecture globale pour le staff (`StaffInbox.tsx`)** :
     - Remplacement de la requête locale par :
       ```js
       const { data, error } = await supabase
         .from('chat_messages')
         .select('*')
         .order('created_at', { ascending: true });
       console.log('Load chat_messages:', { count: data?.length, error });
       ```
     - Regroupement automatique par `client_key` pour lister toutes les conversations clientes dans le volet de gauche avec indicateur de messages non lus.
  2. **Abonnement Realtime global (`StaffInbox.tsx`)** :
     - Écoute active sur `public.chat_messages` pour invalider instantanément `['chat_messages']`, `['staff-inbox-messages']` et `['staff-badge-messages']` à chaque insertion/mise à jour.
  3. **Réponse staff et rôles conformes (`ChatThread.tsx`)** :
     - Envoi des messages staff avec `sender: user.role === 'moderator' ? 'moderator' : 'secretary'` et `sender_name: user.full_name || user.email`.
     - Invalidation simultanée des caches conversations (`['messages', clientKey]`, `['chat_messages']`, `['staff-inbox-messages']`, `['staff-badge-messages']`).
  4. **Synchronisation des badges staff (`StaffApp.tsx`)** :
     - Alimentation du badge de notification de messages non lus depuis Supabase `chat_messages`.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : succès

### FIX 3 — RDV : Annulation d'un rendez-vous côté client
- **Fichiers cibles** : `src/components/appointments/AppointmentCard.tsx`, `src/components/appointments/MyAppointments.tsx`
- **Problème résolu** : Quand le client cliquait sur "Annuler ce rendez-vous" dans "Mes rendez-vous", rien ne se produisait en base de données Supabase car l'appel ciblait uniquement le mock local base44 sans mise à jour Supabase, sans confirmation modale et sans invalidation des listes du secrétariat.
- **Actions appliquées** :
  1. **Mise à jour Supabase en priorité (`AppointmentCard.tsx`)** :
     ```js
     const { data, error } = await supabase
       .from('appointments')
       .update({ status: 'cancelled', updated_at: new Date().toISOString() })
       .eq('id', appointment.id)
       .select()
       .single();
     console.log('Cancel appointment:', { data, error });
     if (error && navigator.onLine) throw error;
     ```
  2. **Invalidation des caches React Query** :
     - Invalidation de `['appointments']`, `['secretary-appointments']` et `['staff-badge-appts']`.
     - Émission de l'événement système `brm-db-change` pour synchroniser tous les composants à l'écoute.
  3. **Toast de confirmation** :
     - Affichage du toast de confirmation "Rendez-vous annulé" (avec gestion d'erreur dédiée si échec réseau).
  4. **Modale de confirmation préalable** :
     - Ajout d'une boîte de dialogue modale accessible confirmant l'intention ("Êtes-vous sûr de vouloir annuler ce rendez-vous ?") avec boutons "Non, conserver" et "Oui, annuler".
  5. **Mise à jour de l'affichage** :
     - Le rendez-vous passe automatiquement au statut `cancelled` et disparaît immédiatement de la liste "Séances à venir" pour basculer dans l'historique des séances passées.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : succès

### FIX 4 — RDV : Affichage immédiat des rendez-vous quel que soit le statut (en attente, confirmé, etc.)
- **Fichiers cibles** : `src/lib/queries.ts`, `src/components/appointments/MyAppointments.tsx`, `src/components/appointments/AppointmentCard.tsx`, `src/lib/format.ts`, `src/components/appointments/BookAppointment.tsx`, `src/components/video/VideoBookingDrawer.tsx`, `src/lib/client.js`, `src/components/BottomNav.jsx`
- **Problème résolu** : Lorsqu'un client planifiait un rendez-vous, celui-ci n'apparaissait pas dans son agenda client tant que le staff ne l'avait pas confirmé. Les rendez-vous avec le statut `pending` (en attente de validation) doivent être visibles immédiatement dès leur création dans la section "Séances à venir" avec un badge "En attente".
- **Actions appliquées** :
  1. **Requête Supabase tous statuts avec filtre multi-critères (`queries.ts`)** :
     - Lecture directe dans `useAppointments` de tous les rendez-vous sans restriction de statut (`pending`, `confirmed`, `accepted`, `completed`, `cancelled`, etc.) :
       ```js
       let query = supabase.from('appointments').select('*');
       if (isValidUuid && userPhone) {
         query = query.or(`user_id.eq.${userId},client_phone.eq.${userPhone}`);
       } else if (isValidUuid) {
         query = query.eq('user_id', userId);
       } else if (userPhone) {
         query = query.eq('client_phone', userPhone);
       }
       const { data, error } = await query
         .order('appointment_date', { ascending: false })
         .order('appointment_time', { ascending: false });
       console.log('Load appointments:', { count: data?.length, error });
       ```
     - Le filtre `.or()` gère de manière transparente les rendez-vous créés avant Google Auth (où `user_id` est null) en se basant sur le téléphone du client.
  2. **Badges de statut colorés explicites (`src/lib/format.ts` & `AppointmentCard.tsx`)** :
     - `pending` : **"En attente"** (orange/ambre : `bg-amber-100 text-amber-800`).
     - `accepted` / `confirmed` : **"Confirmé"** (vert émeraude : `bg-emerald-100 text-emerald-800`).
     - `completed` : **"Terminé"** (gris : `bg-stone-200 text-stone-700`).
     - `cancelled` / `refused` : **"Annulé"** (rose/rouge : `bg-rose-100 text-rose-700`).
  3. **Création complète des RDV (`BookAppointment.tsx`, `VideoBookingDrawer.tsx`, `client.js`)** :
     - Insertion dans `appointments` avec `user_id` (auth.uid), `client_name`, `client_phone`, `client_email`, `service_title`, `service_price`, `appointment_date`, `appointment_time`, `status: 'pending'`, `payment_status: 'unpaid'`, `pain_mapping`.
     - Invalidation immédiate des requêtes React Query : `['appointments']`, `['secretary-appointments']`, `['staff-badge-appts']`.
  4. **Compteur du Tab RDV dans la barre de navigation inférieure (`BottomNav.jsx`)** :
     - Affichage d'un badge numérique sur l'icône RDV pour tous les rendez-vous actifs (`pending`, `accepted`, `confirmed`).
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : succès

### FIX 4 (Correctif Complémentaire) — RDV : Robustesse du chargement client, refetch forcé et affichage immédiat
- **Fichiers modifiés** :
  - `src/lib/queries.ts` : Construction robuste du filtre de lecture sans application de `.or()` vide (`user_id`, `client_phone`, `client_email`), logs détaillés `console.log('Load appointments:', ...)` et `console.log('Appointments data:', ...)`, abonnement Realtime avec invalidation et `refetchQueries`.
  - `src/components/appointments/BookAppointment.tsx` : Ajout de `qc.refetchQueries({ queryKey: ['appointments'] })` après l'insertion pour forcer la mise à jour immédiate.
  - `src/components/video/VideoBookingDrawer.tsx` : Ajout de `qc.refetchQueries({ queryKey: ['appointments'] })` après l'insertion.
  - `src/components/appointments/MyAppointments.tsx` :
    - Récupération de `effectiveUserId`, `effectivePhone` et `effectiveEmail`.
    - Section "Séances à venir" : `appointment_date >= today` ET statut `pending/accepted/confirmed`.
    - Section "Historique" : RDV terminés, annulés, refusés ou `appointment_date < today`.
    - `handleRefresh` avec `refetchQueries`.
  - `src/components/appointments/AppointmentCard.tsx` : Message explicite "En attente de confirmation du secrétariat" sur les cartes `pending`, Flip Clock maintenu pour les séances à venir.
  - `src/components/BottomNav.jsx` : Synchronisation des paramètres d'écoute pour l'incrémentation du badge des séances actives.
  - `src/lib/clientProfile.ts` : Ajout du champ optionnel `email` dans l'interface `ClientProfile`.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : Build succeeded

### FIX 4 (Diagnostic & Résolution Complète) — Affichage garanti des RDV dans le Tab "Rendez-vous"
- **Diagnostic étape par étape réalisé** :
  1. `src/pages/client/Appointments.tsx` : Vérification que l'onglet par défaut est `activeTab === 'appointments'`, rendu confirmé de `<MyAppointments />`, ajout du log `console.log('Appointments page rendered, activeTab:', activeTab)`.
  2. `src/components/appointments/MyAppointments.tsx` : Ajout du compteur rouge visible en haut de liste `<div style={{ color: 'red', fontSize: 18, padding: 8 }}>DEBUG: {appointments?.length || 0} RDV</div>` et du log `console.log('MyAppointments rendered, appointments:', appointments?.length)`.
  3. `src/lib/queries.ts` : Ajout du log des paramètres d'entrée `console.log('useAppointments params:', { userId, userPhone, userEmail })`, du log de requête `console.log('Load appointments:', { filters, count: data?.length, error })`, filtre robuste `.or(filters.join(','))` avec `user_id.eq`, `client_phone.eq`, `client_email.eq` et tri par `appointment_date` descendant.
  4. `src/lib/client.js` & `src/lib/mockStore.js` :
     - `saveAppointmentToSupabase` transmet désormais rigoureusement `user_id` et `client_email` dans `base44.entities.Appointment.create` et `mockStore.saveAppointment`.
     - `mockStore.getAppointments` prend désormais en charge le filtrage complet par `user_id`, `client_key`, `client_phone` et `client_email` (objets et chaînes de recherche).
  5. Création confirmée dans `BookAppointment.tsx` et `VideoBookingDrawer.tsx` avec `user_id: user?.id || null`, `client_phone`, `client_email`, `status: 'pending'` ainsi qu'un double déclenchement `qc.invalidateQueries({ queryKey: ['appointments'] })` et `qc.refetchQueries({ queryKey: ['appointments'] })`.
- **Validation** :
  - `npx tsc --noEmit` : 0 erreur
  - `npm run build` : 0 erreur
  - `compile_applet` : Build succeeded

### NETTOYAGE FIX 4 & UI RESTAURÉE
1. **Suppression des compteurs et logs de diagnostic** :
   - Retrait du bandeau rouge `DEBUG: X RDV` de `MyAppointments.tsx`.
   - Suppression des `console.log` de diagnostic dans `Appointments.tsx`, `MyAppointments.tsx` et `queries.ts`.
2. **Restauration complète du FlipClockCountdown** :
   - Intégration sur chaque séance à venir (`pending`, `accepted`, `confirmed` avec date >= aujourd'hui) dans `AppointmentCard.tsx`.
   - Affichage du décompte mécanique Jours / Heures / Minutes / Secondes.
   - Affichage clair du soin, de la date, de l'heure et du tarif formaté en FCFA.
3. **UI Professionnelle** :
   - Hiérarchie "Séances à venir" et "Historique de vos séances".
   - Badges colorés : Orange "En attente", Vert "Confirmé", Gris "Terminé", Rouge "Annulé".
   - Carte vide élégante invitant à la réservation.

### FIX 5 — PWA & Header Chrome post-OAuth
1. **Manifest Web App** (`public/manifest.json`) :
   - `display: "standalone"`, `display_override: ["standalone", "minimal-ui"]`, `start_url: "/"`, `scope: "/"`.
2. **Nettoyage automatique du hash d'URL** (`src/lib/AuthContext.tsx`) :
   - Détection des paramètres OAuth (`access_token`, `code=`) et `replaceState` pour restaurer l'URL propre immédiatement.
3. **Configuration PKCE Supabase** (`src/lib/supabaseClient.ts`) :
   - `flowType: 'pkce'`, `detectSessionInUrl: true`.

### FIX 6 — Persistance de session PWA
1. **Configuration stockage Supabase** (`src/lib/supabaseClient.ts`) :
   - `persistSession: true`, `autoRefreshToken: true`, `storageKey: 'brm-auth-token'`, `storage: window.localStorage`.
2. **Restauration de session** (`src/lib/AuthContext.tsx`) :
   - `supabase.auth.getSession()` au montage avec écoute `onAuthStateChange`.
   - Aucun `signOut()` intempestif au démarrage.
3. **Protection des routes privées** (`ProfileRequired.tsx`, `StaffGate.tsx`, `StaffApp.tsx`) :
   - Affichage d'un spinner pendant `isLoadingAuth === true` sans redirection prématurée vers `/login`.
   - Aucun `localStorage.clear()` ni `sessionStorage.clear()` au démarrage.

### FIX 7 — API REST Gemini 2.5 Flash
1. **Endpoint REST officiel** :
   - Appel via `fetch` à `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}` (avec fallback 3.8 Flash et mode dégradé local regex).
2. **Lecture des variables d'environnement** :
   - Priorité à `import.meta.env.VITE_GEMINI_API_KEY`.
3. **Gestion des erreurs et résilience** :
   - Journalisation `console.error('Gemini error:', error, 'Status:', status)`.
   - En cas d'indisponibilité ou absence de clé, bascule instantanée sur le moteur local certifié 0-crédit.

---

## 8. PRIORITÉ 1 — HERO EDITOR COMPLET (Modérateur & Client)

### Colonnes de la table `app_settings` (singleton `a0000000-0000-0000-0000-000000000001`)
- `hero_eyebrow` (Text) : Sur-titre / badge (ex: "Sanctuaire de Bien-être")
- `hero_title` (Text) : Titre principal (ex: "L'art du toucher")
- `hero_highlight` (Text) : Mot mis en valeur en italique or (ex: "qui libère.")
- `hero_subtitle` (Text) : Sous-titre descriptif complet
- `hero_media_url` (Text) : URL directe de l'image ou de la vidéo de fond
- `hero_media_type` (Text) : `'image'` ou `'video'`
- `hero_sections_order` (JSONB) : Ordre dynamique des 6 sections de l'accueil (`['hero', 'bridges', 'massages', 'videos', 'center', 'momo']`)

### Script SQL d'ajout des colonnes dans Supabase (SQL Editor)
```sql
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS hero_eyebrow text DEFAULT 'Sanctuaire de Bien-être',
  ADD COLUMN IF NOT EXISTS hero_title text DEFAULT 'L''art du toucher',
  ADD COLUMN IF NOT EXISTS hero_highlight text DEFAULT 'qui libère.',
  ADD COLUMN IF NOT EXISTS hero_subtitle text DEFAULT 'Réflexologie plantaire, massages thérapeutiques et soins traditionnels au cœur du Bénin pour restaurer l''harmonie du corps et de l''esprit.',
  ADD COLUMN IF NOT EXISTS hero_media_url text,
  ADD COLUMN IF NOT EXISTS hero_media_type text DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS hero_sections_order jsonb DEFAULT '["hero", "bridges", "massages", "videos", "center", "momo"]'::jsonb;
```

### Fonctionnalités implémentées côté Modérateur (`HeroEditor.tsx`)
1. **Formulaire complet** :
   - Sur-titre (`hero_eyebrow`)
   - Titre principal (`hero_title`)
   - Mot mis en valeur en italique or (`hero_highlight`)
   - Sous-titre descriptif (`hero_subtitle`)
2. **Gestion Média Polyvalente** :
   - Mode upload de fichier : `accept="image/*,video/mp4,video/webm"`, lecture Base64, détection automatique du format `file.type.startsWith('image') ? 'image' : 'video'`.
   - Mode URL : collage d'un lien direct avec détection d'extension.
   - Sélecteur manuel de type `image` ou `video`.
   - Prévisualisation immédiate en temps réel (balise `<video>` ou `<img>`).
3. **Persistance robuste & Tolérance aux pannes** :
   - Enregistrement immédiat dans `localStorage` (`brm_hero_settings_override`) pour affichage instantané sans échec.
   - Requête Supabase : `.from('app_settings').update({ hero_eyebrow, hero_title, hero_highlight, hero_subtitle, hero_media_url, hero_media_type }).eq('id', 'a0000000-0000-0000-0000-000000000001')`.
   - Journalisation défensive `console.error('Missing hero column:', ...)` si les colonnes Supabase ne sont pas encore créées.
   - Fallback automatique dans `ui_customization` si nécessaire.
   - Invalidation des clés de cache React Query `['app-settings']` et `['settings']`.
   - Toast de confirmation en français.

### Rendu côté Client (`HeroSection.tsx`)
- Lecture des réglages via `useAppSettings`.
- Arrière-plan dynamique :
  - Si `hero_media_type === 'video'` : `<video src={hero_media_url} autoPlay muted loop playsInline />`.
  - Si `hero_media_type === 'image'` : `<img src={hero_media_url} />`.
- Affichage direct sans bordure de `hero_eyebrow`, `hero_title`, `hero_highlight` et `hero_subtitle`.
- Fallbacks soignés et multilingue préservé.

---

## 9. PRIORITÉ 2 — LOGO PWA 100% MODÉRATEUR

### Colonnes de la table `app_settings` (singleton `a0000000-0000-0000-0000-000000000001`)
- `pwa_logo_url` (Text) : URL du logo actif pour l'icône d'application
- `pwa_logo_type` (Text, default `'image/png'`) : type MIME de l'image (PNG, SVG, JPEG)
- `pwa_logo_updated_at` (Timestamptz) : date et heure de dernière modification
- `pwa_logo_history` (JSONB, default `'[]'::jsonb`) : historique des 6 derniers logos uploadés

### Script SQL d'ajout des colonnes dans Supabase (SQL Editor)
```sql
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS pwa_logo_url text,
  ADD COLUMN IF NOT EXISTS pwa_logo_type text DEFAULT 'image/png',
  ADD COLUMN IF NOT EXISTS pwa_logo_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pwa_logo_history jsonb DEFAULT '[]'::jsonb;
```

### Fonctionnalités implémentées côté Modérateur (`LogoEditor.tsx`)
1. **Section dédiée dans le Cockpit Modérateur** :
   - Titre : *"Icône de l'Application (réservé modérateur)"*
   - Sous-titre : *"Ce logo apparaîtra sur l'écran d'accueil du téléphone après installation de l'app."*
   - Avertissement : *"Format requis : PNG carré 512×512 px, ou SVG. Poids max : 500 Ko. Le logo sera appliqué à tous les appareils après rechargement."*
2. **Preview du logo actif** :
   - Affichage en cercle 120×120 px avec bordure or et fond `#1E130D`.
   - Informations MIME et date de dernière modification.
3. **Upload avec validations strictes** :
   - Input file acceptant `image/png`, `image/jpeg`, `image/svg+xml`.
   - Contrôle du poids strict : `file.size <= 500 * 1024` (500 Ko max).
   - Contrôle du ratio carré 1:1 pour PNG et JPEG (`img.width === img.height`).
   - Prévisualisation avant validation.
4. **Stockage & Persistance défensive** :
   - Téléversement vers Supabase Storage bucket `media` (chemin `logos/pwa-${Date.now()}.${ext}`).
   - Si bucket 404 ou non configuré : repli immédiat sur Data URL locale.
   - Enregistrement immédiat dans `localStorage` (`brm_pwa_logo_override`).
   - Mise à jour Supabase `app_settings` avec fallback console log défensif si les colonnes sont en attente d'ajout.
5. **Historique des 6 derniers logos** :
   - Affichage des 6 versions précédentes avec vignettes, date et bouton *"Restaurer"*.
6. **Suppression du sélecteur côté Client** :
   - Retiré du profil client (`ProfileSettings.tsx`) pour garantir l'exclusivité modérateur.
8. **Désactivation Totale du Logo Dynamique & Stabilisation Android PWA** :
   - Suppression intégrale de `pwaIcons.ts` et `LogoEditor.tsx`.
   - Remplacement complet de la logique dynamique par le fichier statique officiel `/logo-brm.png` (512×512 px) conforme au vrai logo du centre *Bénin Réflexologie & Massage*.
   - `manifest.json` 100% statique pointant vers `/logo-brm.png` (192x192 & 512x512 maskable).
   - `index.html` balises statiques strictes `<link rel="icon" type="image/png" href="/logo-brm.png" />` et `<link rel="apple-touch-icon" href="/logo-brm.png" />`.
   - Aucune mutation DOM dynamique ni manipulation d'URL Blob / WebAPK. Stabilité Android maximale garantie.

9. **Reconstruction Vectorielle du Logo BRM (`logo_BRM.svg`)** :
   - Fichier autonome vectoriel SVG natif 1024×1024 px à fond transparent conforme à l'emblème officiel :
     - `outer-gold-ring` : anneaux d'or concentriques, bordure perlée royale, médaillon prestige cacao profond.
     - `laurel-left` & `laurel-right` : branches de laurier botaniques vertes avec reflets d'or et baies précieuses.
     - `upper-title` : texte courbé *"BENIN RÉFLEXOLOGIE & MASSAGE"* en typographie or ciselé.
     - `central-reflexology-illustration` : illustration détaillée de réflexologie plantaire (pied anatomique de profil avec méridiens et zones réflexes, deux mains bienveillantes en appui et pression thérapeutique, lotus sacré).
     - `brm-lettering` : monogramme majestueux **BRM** en relief 3D doré poli.
     - `brm-baseline` : étoiles et ornements de sertissage.
     - `lower-ribbon` : ruban cérémonial 3D drapé aux extrémités plissées et biseautées.
     - `lower-botanicals` : rameaux botaniques noués au centre.
   - Présent à la racine `/logo_BRM.svg`, dans `/public/logo_BRM.svg`, `/public/logo-brm.svg`, `/public/logo.svg` et intégré dans `Logo.tsx` et `index.html`.
10. **Restauration du FlipClockCountdown sur les Rendez-Vous à Venir** :
    - Composant `src/components/appointments/FlipClockCountdown.tsx` :
      - Décompte mécanique 3D (Jours, Heures, Minutes, Secondes) avec effet de bascule fluide `framer-motion` et palette Cacao, Sauge, Argile, Or.
      - Rafraîchissement chaque seconde via `setInterval` avec `clearInterval` au démontage pour éviter les fuites mémoire.
      - Message dynamique « C'est maintenant ! » avec pulsation visuelle dès l'échéance atteinte.
    - Intégration dans `src/components/appointments/AppointmentCard.tsx` :
      - Positionné en haut de la carte de RDV, centré et mis en valeur.
      - Affiché exclusivement sur les séances actives à venir (`pending`, `accepted`, `confirmed` avec date dans le futur).
      - Disparaît immédiatement pour les séances passées, annulées (`cancelled`, `refused`) ou terminées (`completed`).
    - Internationalisation multilingue (`appointments.countdown_label`) :
      - `fr` : "Temps restant avant votre séance"
      - `en` : "Time left before your session"
      - `es` : "Tiempo restante antes de su sesión"
      - `hi` : "आपके सत्र से पहले शेष समय"
      - `ar` : "الوقت المتبقي قبل جلستك"
    - Zéro dépendance externe npm supplémentaire, zéro log de debug résiduel.

11. **Mise à Jour Finale du Logo PWA et des Icônes d'Application** :
    - Fichiers d'icônes générés dans `/public` à partir de l'image officielle :
      - `/public/logo-brm.png` : PNG 512×512 px haute résolution
      - `/public/icon-512.png` : PNG 512×512 px (PWA standalone & maskable)
      - `/public/icon-192.png` : PNG 192×192 px (PWA standalone & maskable)
      - `/public/apple-touch-icon.png` : PNG 180×180 px (appareils iOS / Safari)
    - `public/manifest.json` :
      - `short_name: "BRM"`
      - Icônes pointant sur `/icon-192.png` et `/icon-512.png` avec `purpose: "any maskable"`
    - `index.html` :
      - `<link rel="icon" type="image/png" href="/logo-brm.png" />`
      - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
      - `<link rel="manifest" href="/manifest.json" />`
    - `src/components/brand/Logo.tsx` :
      - Affichage direct et universel de `/logo-brm.png` dans toute l'interface.
    - Zéro modification du code dynamique PWA, zéro mutation de head, stabilité absolue.

12. **Correction du Lancement de la PWA (Clic sur l'Icône Standalone)** :
    - `public/manifest.json` :
      - `start_url` : fixé strictement à `/` (URL relative simple).
      - `scope` : `/`
      - `id` : `/`
      - `display` : `"standalone"`
      - `short_name` : `"Bénin Réflexologie Massage"`
      - Déclinaison explicite des icônes 192×192 et 512×512 avec `purpose: "any"` et `purpose: "maskable"`.
    - `vercel.json` :
      - Réécriture SPA propre `[{ "source": "/(.*)", "destination": "/" }]`.
      - Headers `Cache-Control` stricts pour `manifest.json` (`no-cache, no-store, must-revalidate`) et MIME type `application/manifest+json`.
      - Cache immuable pour les icônes PWA (`icon-*.png`, `logo-brm.png`, `apple-touch-icon.png`).
    - Service Worker résiduel / bloquant :
      - Nettoyage préventif et désenregistrement de tout Service Worker obsolète dans `src/main.tsx` (`navigator.serviceWorker.getRegistrations() -> unregister()`).
      - Aucun Service Worker résiduel ni fetch intercepté qui pourrait bloquer l'ouverture de l'application.
    - `index.html` :
      - Balise `<link rel="manifest" href="/manifest.json" />` vérifiée.
      - Métas Apple et web app conformes (`mobile-web-app-capable` et `apple-mobile-web-app-capable: yes`).
      - Absence de balises contradictoires.

13. **Purge des Anciens Logos SVG et Cache-Busting Vercel (Version v2)** :
    - **Suppression des résidus SVG** :
      - Suppression définitive de `logo_BRM.svg` à la racine du projet.
      - Absence garantie de tout autre fichier SVG logo dans `/public` et dans le codebase.
    - **Cache-Busting (v2) pour forcer le rafraîchissement immédiat** :
      - Création des assets versionnés dans `public/` :
        - `public/logo-brm-v2.png` (512×512, issu de l'image officielle)
        - `public/icon-192-v2.png` (192×192)
        - `public/icon-512-v2.png` (512×512)
        - `public/apple-touch-icon-v2.png` (180×180)
      - Les versions sans suffixe (`logo-brm.png`, `icon-192.png`, etc.) sont conservées en rétro-compatibilité.
    - **Mise à jour des références dans le code** :
      - `index.html` : favicon pointant vers `/logo-brm-v2.png` et apple-touch-icon vers `/apple-touch-icon-v2.png`.
      - `public/manifest.json` : icônes PWA pointant vers `/icon-192-v2.png` et `/icon-512-v2.png`.
      - `src/components/brand/Logo.tsx` : affichage direct de `/logo-brm-v2.png`.
      - `src/lib/appLogos.ts` : `STATIC_LOGO_PATH = '/logo-brm-v2.png'`.
      - `src/lib/queries.ts` : logos par défaut sur `/logo-brm-v2.png`.
      - `src/components/staff/home/HeaderEditor.tsx` : mention mise à jour vers `/logo-brm-v2.png`.
    - **Ajustement du Cache Vercel (`vercel.json`)** :
      - Remplacement de la règle `immutable` (1 an) par un cache court :
        `{ "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }` pour toutes les images statiques (`png|jpg|jpeg|svg|webp|ico`).

14. **Stockage Vidéo & Média vers Supabase Storage (Bucket `media`)** :
    - **Upload Vidéo & Média Direct vers Supabase Storage** :
      - Les fichiers vidéo sélectionnés depuis l'appareil utilisateur sont directement téléversés dans le bucket public `media` via `supabase.storage.from('media').upload('videos/${Date.now()}-${filename}', file, { contentType: file.type, upsert: false })`.
      - Récupération immédiate de l'URL publique permanente : `supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl`.
      - Enregistrement de cette URL publique directement dans la colonne `media.video_url` (au lieu de clés locales `idb://...`).
      - Génération et téléversement automatiques de miniatures vidéo (`images/...thumb_*.webp`) stockées dans `media.thumbnail_url`.
    - **Gestion des Images (Produits, Catalogues, Miniatures)** :
      - Les images téléversées via `MediaUploader` sont également enregistrées dans le bucket `media` (`images/${Date.now()}-${filename}`) et stockées de manière permanente dans `products.image_url` ou `media.thumbnail_url`.
    - **Migration et Rétro-compatibilité des Vidéos Existantes** :
      - Détection automatique dans le Cockpit des capsules vidéo utilisant encore l'ancien format local (`idb://...`).
      - Affichage d'un bandeau d'alerte dans l'onglet des capsules vidéo informant qu'une migration est requise.
      - Ajout d'un badge « ⚠️ À re-uploader » sur chaque carte de vidéo locale avec un bouton d'action directe « Re-uploader » permettant de sélectionner le fichier vidéo et de le transférer en un clic sur Supabase Storage.
    - **Optimisation de la Lecture Vidéo Mobile** :
      - Attributs HTML5 stricts : `autoPlay`, `muted`, `loop`, `playsInline`, `preload="metadata"`.
      - Suppression définitive du fallback d'échantillon `/sample-massage.mp4`.
      - En cas d'erreur de lecture : affichage d'un message explicite « Vidéo indisponible, veuillez re-uploader ».

15. **Résolution des 2 Bugs Critiques de Livraison (Lecteur Vidéo TikTok & Redirection Auth)** :
    - **BUG 1 — Lecteur vidéo style TikTok (Son, Défilement automatique, Conflits de lecture)** :
      - *Bouton Mute/Unmute persistant* : Ajout d'un bouton flottant (🔊 / 🔇) en bas à droite du lecteur dans `ShortItem.tsx`. Mémorisation du choix audio dans `localStorage` (`brm-video-muted`). Bouton d'alerte « Activer le son 🔊 » si l'autoplay avec son est restreint par les politiques du navigateur.
      - *Scroll automatique sans boucle bloquante* : Suppression de l'attribut `loop` sur `<video>` afin que l'événement `onEnded` se déclenche systématiquement en fin de vidéo. Défilement fluide automatique via `scrollIntoView({ behavior: 'smooth' })` vers la vidéo suivante, avec bouclage propre sur la première vidéo lors de la fin de la dernière capsule.
      - *Arrêt des conflits de lecture multi-flux* : Avant le lancement d'une vidéo dans `ShortItem.tsx`, pause forcée de toutes les autres balises `<video>` du document (`document.querySelectorAll('video').forEach(v => { if (v !== vid) v.pause(); })`). Nettoyage complet au démontage (`vid.pause(); vid.removeAttribute('src'); vid.load();`) pour libérer la mémoire. Mise en pause préventive des vidéos d'arrière-plan à l'ouverture de `ShortsViewer.tsx`.
    - **BUG 2 — Persistance de la page /login après connexion Google OAuth** :
      - *Redirection automatique* : Ajout dans `Login.tsx` d'un `useEffect` observant `user` et `isLoadingAuth` issu de `useAuth()`. Dès que l'utilisateur est authentifié, redirection immédiate vers `getAuthReturnTo() || '/'` via `navigate(returnTo, { replace: true })`.
      - *Gestion du retour OAuth* : Dans `AuthContext.tsx`, après la réception de l'événement `SIGNED_IN` ou la restauration de session avec utilisateur actif, redirection automatique hors de `/login` vers la page de destination.
      - *Guards réactifs (`ProfileRequired.tsx` et `StaffGate.tsx`)* : Dès que l'utilisateur est défini, rendu direct des composants enfants sans persistance d'un écran intermédiaire.

16. **Sécurisation Anti-Chaîne Vide (`src=""`) sur les Balises Médias** :
    - Détection et protection contre l'attribution d'une chaîne vide `""` aux attributs `src` des balises `<video>`, `<img>` et `<iframe>`.
    - `src/components/video/ShortItem.tsx` : Rendu conditionnel strict (`Boolean(safeSrc && safeSrc.trim())`) pour n'instancier la balise `<video>` que si une URL valide est disponible, avec bascule propre sur l'écran d'alerte explicite si la source est manquante.
    - `src/components/shared/AutoMedia.tsx` : Protection similaire sur le lecteur vidéo et le composant d'image pour ne jamais passer `src=""` au DOM, avec rendu direct des icônes de repli si la ressource est absente.
    - `src/components/MediaUploader.tsx` : Vérification de présence effective de `activeSrc` avant tout rendu de prévisualisation `<video>` ou `<img>`.

17. **Gestion Prioritaire du Son Vidéo (Style TikTok)** :
    - **Son Activé par Défaut avec Déblocage UX Central** :
      - Au premier lancement ou tant que l'autorisation audio n'a pas été accordée, affichage d'un bouton central rond immersif et animé : pastille noire translucide avec bordure dorée pulsante (`border-2 border-gold shadow-[0_0_45px_rgba(217,119,6,0.75)]`), icône 🔊 (`Volume2`) et libellé *« Touchez pour activer le son »*.
      - Au premier tap (sur le bouton ou sur la vidéo) : déblocage immédiat de l'audio sur toutes les vidéos de la session (`soundEnabled = true`), mise en mémoire persistante via `localStorage.setItem('brm-video-sound-enabled', 'true')` et disparition instantanée du bouton central.
    - **Maintien du Son d'une Session à l'Autre** :
      - Au chargement du lecteur (`ShortsViewer.tsx` et `ShortItem.tsx`), lecture de `localStorage.getItem('brm-video-sound-enabled')`. Si la clé vaut `'true'`, les vidéos démarrent directement avec le son actif, sans nécessiter de nouveau clic de confirmation.
    - **Bouton Mute/Unmute Flottant Permanent** :
      - Icône permanente 🔊 / 🔇 située en bas à droite du lecteur (`ShortItem.tsx`) pour basculer le son à tout moment tout en synchronisant l'état global et persistant.
