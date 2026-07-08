# Cours détaillés sur les normes ISO
## ISO/IEC 27001 & ISO 9001 — avec exemples appliqués à Marsa Maroc (Port de Mohammedia)

> Support pédagogique structuré (Cours → Chapitre → Sous-chapitre) pour la plateforme e-learning adaptative.
> Contenu reformulé à des fins d'apprentissage (ne reproduit pas le texte officiel protégé des normes).

---
---

# COURS 1 — ISO/IEC 27001 : Management de la sécurité de l'information

**Norme :** ISO/IEC 27001:2022 · **Niveau :** Intermédiaire

### Pourquoi ce cours ?
Un port pétrolier comme Mohammedia ne manipule pas seulement des hydrocarbures : il manipule aussi une énorme quantité d'**informations sensibles** — plannings d'accostage des navires, quantités de produits stockés, données douanières, contrats commerciaux, systèmes de pilotage des pompes et des vannes. Si ces informations sont volées, modifiées ou rendues indisponibles, les conséquences peuvent être graves : arrêt d'exploitation, accident industriel, pertes financières, atteinte à la réputation. ISO 27001 apporte une méthode organisée pour protéger ces informations. Ce cours t'explique cette méthode, clause par clause.

---

## Chapitre 0 — Fondamentaux de la sécurité de l'information
`chapitreHLS : Introduction`

### 0.1 — Donnée vs information
Une **donnée** est un élément brut, sans contexte : le nombre « 45 000 » tout seul ne veut rien dire. Une **information** est une donnée mise en contexte qui acquiert un sens et une valeur : « le tank T3 contient 45 000 m³ de gasoil » est une information exploitable — et sensible. La sécurité de l'information ne protège pas les octets pour eux-mêmes, elle protège **la valeur et le sens** que ces données représentent pour l'organisation.

*Exemple Marsa Maroc :* la liste brute des navires est une donnée ; reliée aux horaires, aux cargaisons et aux clients, elle devient une information stratégique qu'un concurrent ou un pirate aimerait obtenir.

### 0.2 — Le triangle DIC (le cœur de tout)
Toute la sécurité repose sur trois propriétés à préserver simultanément :

- **Disponibilité** — l'information doit être accessible au bon moment. Si le système qui gère les accostages tombe en panne, le port s'arrête. On garantit la disponibilité par des sauvegardes, des serveurs redondants, des onduleurs.
- **Intégrité** — l'information ne doit pas être modifiée de façon non autorisée. Si quelqu'un altère la quantité de produit enregistrée dans une cuve, on peut provoquer un débordement. On protège l'intégrité par des contrôles d'accès, des journaux, des signatures.
- **Confidentialité** — seules les personnes autorisées accèdent à l'information. Les contrats clients ne doivent pas fuiter. On assure la confidentialité par le chiffrement, les mots de passe, la classification des documents.

*À retenir :* un incident de sécurité, c'est toujours l'atteinte à au moins l'un de ces trois piliers.

### 0.3 — Vulnérabilité, menace, attaque, risque
Ces quatre mots sont souvent confondus. Distinction claire :

- une **vulnérabilité** est une faiblesse (un mot de passe faible, une porte non verrouillée, un logiciel non mis à jour) ;
- une **menace** est un danger potentiel qui pourrait exploiter cette faiblesse (un pirate, un employé négligent, un incendie) ;
- une **attaque** est la concrétisation de la menace (le pirate entre effectivement dans le système) ;
- le **risque** est la combinaison de la probabilité qu'une menace exploite une vulnérabilité et de la gravité des conséquences.

*Exemple Marsa Maroc :* un poste informatique du quai laissé déverrouillé (vulnérabilité) peut être utilisé par un visiteur mal intentionné (menace) qui copie des données (attaque). Le risque est élevé si ce poste donne accès au système de gestion des cargaisons.

### 0.4 — Qu'est-ce qu'un SMSI ?
Le **Système de Management de la Sécurité de l'Information** est l'ensemble organisé des politiques, procédures, rôles et mesures techniques qui permettent de gérer la sécurité **de façon systématique et continue**, et non au coup par coup. Le SMSI suit la logique **PDCA** (Planifier – Faire – Vérifier – Agir), une roue d'amélioration continue : on planifie les protections, on les met en œuvre, on vérifie qu'elles marchent, puis on corrige et on recommence. ISO 27001 est la norme qui décrit comment construire ce SMSI.

---

## Chapitre 1 — Contexte de l'organisation
`chapitreHLS : 4`

### 1.1 — Comprendre l'organisation et son contexte
Avant de protéger quoi que ce soit, il faut comprendre **qui l'on est et dans quel environnement on évolue**. L'organisation identifie ses enjeux internes (son organisation, ses systèmes informatiques, sa culture, ses compétences) et externes (la réglementation, les menaces cyber du secteur portuaire, les attentes de l'État, la concurrence). Cette compréhension conditionne tout le reste : on ne protège pas de la même façon une petite PME et un port stratégique national.

*Exemple Marsa Maroc :* le contexte inclut le fait d'être une entreprise publique gérant une infrastructure critique, soumise à des exigences de sûreté (code ISPS), manipulant des produits dangereux — autant de facteurs qui élèvent le niveau d'exigence en sécurité de l'information.

### 1.2 — Comprendre les besoins des parties intéressées
Une **partie intéressée** est toute personne ou entité qui a un intérêt dans la sécurité de l'information de l'organisation : clients (armateurs, importateurs), autorités (douane, ministère, ANRT), employés, fournisseurs, partenaires. Chacune a des attentes : la douane veut des données fiables, les clients veulent la confidentialité de leurs contrats, l'État veut la continuité du service public. Le SMSI doit tenir compte de toutes ces exigences.

### 1.3 — Déterminer le périmètre du SMSI
On ne peut pas tout sécuriser d'un coup. L'organisation définit donc **clairement les limites** de son SMSI : quels sites (le port de Mohammedia ?), quels systèmes (la gestion des cargaisons, la messagerie, les automates de pompage ?), quels processus sont couverts. Un périmètre bien défini évite les zones d'ombre et rend le système gérable et auditable.

---

## Chapitre 2 — Leadership
`chapitreHLS : 5`

### 2.1 — Engagement de la direction
La sécurité de l'information n'est pas qu'une affaire de techniciens : c'est d'abord une **décision de direction**. La norme insiste : la direction doit s'impliquer activement, pas seulement signer un document puis déléguer. Elle doit allouer des moyens (budget, personnel), montrer l'exemple, et intégrer la sécurité dans la stratégie. Sans engagement réel du sommet, un SMSI reste théorique et échoue aux audits.

*Exemple Marsa Maroc :* la direction du port qui inscrit la cybersécurité à l'ordre du jour de ses comités et qui débloque un budget pour la protection des systèmes montre un engagement concret.

### 2.2 — La politique de sécurité de l'information
C'est le **document fondateur** du SMSI : un texte de haut niveau, validé par la direction, qui fixe les grandes orientations et les engagements de l'organisation en matière de sécurité. Il donne le cap que déclineront ensuite les procédures détaillées. La politique doit être communiquée à tous et accessible aux parties intéressées pertinentes.

### 2.3 — Rôles, responsabilités et autorités
Pour que la sécurité fonctionne, chacun doit savoir **qui fait quoi**. La direction attribue clairement les responsabilités : qui est le responsable de la sécurité des systèmes (RSSI), qui gère les accès, qui traite les incidents, qui approuve les exceptions. Des responsabilités floues créent des trous de sécurité (« je croyais que c'était toi qui t'en occupais »).

---

## Chapitre 3 — Planification
`chapitreHLS : 6`

### 3.1 — Appréciation des risques (le cœur d'ISO 27001)
C'est l'étape la plus importante. L'organisation doit **identifier, analyser et évaluer** les risques qui pèsent sur ses informations. Concrètement : on liste les actifs (systèmes, données), on identifie les menaces et vulnérabilités de chacun, on estime la probabilité et la gravité, puis on classe les risques du plus critique au plus mineur. C'est cette analyse qui déterminera où concentrer les efforts.

*Exemple Marsa Maroc :* le risque « intrusion dans le système de pilotage des pompes » sera classé très critique (gravité maximale : accident possible), tandis que « perte de l'annuaire téléphonique interne » sera mineur.

### 3.2 — Traitement des risques
Une fois les risques évalués, pour chacun on choisit une **option de traitement** :
- **Réduire** le risque (ajouter une mesure de sécurité) — le cas le plus fréquent ;
- **Accepter** le risque (s'il est faible et coûteux à traiter) ;
- **Éviter** le risque (supprimer l'activité qui le génère) ;
- **Transférer** le risque (assurance, sous-traitance).

On sélectionne alors les mesures de sécurité appropriées (celles de l'Annexe A).

### 3.3 — La Déclaration d'Applicabilité (SoA — Statement of Applicability)
C'est un document central d'ISO 27001. Il **liste toutes les mesures de l'Annexe A**, indique lesquelles sont retenues, lesquelles sont exclues, et **justifie chaque choix**. La SoA est la carte d'identité du SMSI : elle montre à l'auditeur exactement comment l'organisation a décidé de se protéger et pourquoi.

### 3.4 — Objectifs de sécurité
L'organisation fixe des **objectifs mesurables** (par exemple : « réduire de 50 % les incidents liés aux mots de passe en un an »). Des objectifs chiffrés permettent de piloter la sécurité et de mesurer les progrès, plutôt que de rester dans le vague.

---

## Chapitre 4 — Support
`chapitreHLS : 7`

### 4.1 — Ressources et compétences
Un SMSI a besoin de **moyens** : des personnes, du temps, des outils, du budget. L'organisation doit aussi s'assurer que les personnes impliquées sont **compétentes** (formation, certification, expérience). Un responsable sécurité mal formé est lui-même une vulnérabilité.

### 4.2 — Sensibilisation et communication
La majorité des incidents viennent d'**erreurs humaines** (cliquer sur un lien piégé, choisir un mot de passe faible). D'où l'importance de **sensibiliser** tout le personnel : campagnes, formations, rappels. La communication interne et externe sur la sécurité doit aussi être organisée (qui communique quoi, à qui, quand).

*Exemple Marsa Maroc :* former les agents du port à reconnaître un email de phishing réduit fortement le risque d'intrusion.

### 4.3 — Informations documentées
Le SMSI doit être **documenté** (politiques, procédures, enregistrements) et ces documents doivent être **maîtrisés** : versionnés, protégés, accessibles aux bonnes personnes, mis à jour. La documentation prouve que le système existe vraiment et fonctionne — c'est essentiel pour l'audit de certification.

---

## Chapitre 5 — Fonctionnement
`chapitreHLS : 8`

### 5.1 — Planification et maîtrise opérationnelles
C'est la phase « Faire » du PDCA : on **met réellement en œuvre** les processus et mesures prévus. La planification théorique devient action concrète sur le terrain. L'organisation maîtrise ses opérations pour s'assurer que les protections fonctionnent comme prévu au quotidien.

### 5.2 — Appréciation et traitement des risques en pratique
Les risques ne sont pas figés : de nouvelles menaces apparaissent, le système évolue. L'organisation doit donc **réaliser régulièrement** ses appréciations de risques et appliquer ses plans de traitement, pas seulement une fois pour l'audit. La sécurité est un processus vivant.

---

## Chapitre 6 — Évaluation des performances
`chapitreHLS : 9`

### 6.1 — Surveillance, mesure, analyse
On ne peut améliorer que ce que l'on mesure. L'organisation suit des **indicateurs** (nombre d'incidents, temps de réponse, taux de mises à jour appliquées) pour évaluer si le SMSI est efficace. Ces mesures nourrissent les décisions d'amélioration.

### 6.2 — Audit interne
Périodiquement, l'organisation **vérifie elle-même** que son SMSI est conforme à la norme et fonctionne réellement. L'audit interne détecte les écarts avant l'audit de certification externe. C'est un examen honnête et méthodique de son propre système.

### 6.3 — Revue de direction
La direction **réexamine** régulièrement le SMSI à la lumière des résultats (audits, incidents, indicateurs) et prend des décisions : allouer plus de moyens, changer une priorité, corriger un défaut. Cela referme la boucle : le leadership reste impliqué dans la durée.

---

## Chapitre 7 — Amélioration
`chapitreHLS : 10`

### 7.1 — Non-conformités et actions correctives
Quand un **écart** est détecté (une mesure ne marche pas, un incident survient), l'organisation le corrige **et** agit sur sa **cause profonde** pour qu'il ne se reproduise pas. Traiter le symptôme ne suffit pas : il faut comprendre pourquoi c'est arrivé.

*Exemple Marsa Maroc :* si un employé a été victime de phishing, l'action corrective n'est pas seulement de nettoyer son poste, mais de renforcer la formation de toute l'équipe.

### 7.2 — Amélioration continue
Le SMSI n'est jamais « fini ». Dans la logique PDCA, l'organisation cherche **en permanence** à l'améliorer : nouvelles menaces, nouvelles technologies, retours d'expérience. C'est un progrès constant, pas un état atteint une fois pour toutes.

---

## Chapitre 8 — L'Annexe A : les 93 mesures de sécurité
`chapitreHLS : Annexe A`

L'Annexe A d'ISO 27001:2022 est un **catalogue de 93 mesures** de sécurité, regroupées en 4 grandes familles (thèmes). L'organisation y pioche les mesures pertinentes selon son analyse de risques (via la SoA).

### 8.1 — A.5 Mesures organisationnelles (37 mesures)
Ce sont les mesures liées à l'**organisation et à la gouvernance** : politiques de sécurité, définition des rôles, gestion des accès, relations avec les fournisseurs, gestion des incidents, classification de l'information, continuité d'activité. C'est la plus grande famille.

*Exemple Marsa Maroc :* définir une politique de contrôle des accès aux systèmes portuaires, encadrer contractuellement les prestataires informatiques.

### 8.2 — A.6 Mesures liées aux personnes (8 mesures)
Elles concernent le **facteur humain** tout au long du cycle de vie de l'emploi : vérifications avant embauche, sensibilisation et formation, procédures disciplinaires, gestion du télétravail, engagements de confidentialité. L'humain étant le maillon le plus fragile, ces mesures sont cruciales.

### 8.3 — A.7 Mesures physiques (14 mesures)
Elles protègent les **lieux et le matériel** : périmètres de sécurité, contrôle des accès physiques (badges, portails), surveillance (caméras), protection contre les menaces environnementales (incendie, inondation), sécurité du câblage, mise au rebut sécurisée du matériel.

*Exemple Marsa Maroc :* badges d'accès à la salle serveurs, vidéosurveillance des zones sensibles du port, protection des câbles reliant les automates.

### 8.4 — A.8 Mesures technologiques (34 mesures)
Ce sont les mesures **techniques et informatiques** : protection contre les malwares (antivirus), sauvegardes, chiffrement (cryptographie), sécurité des réseaux, gestion des vulnérabilités et des correctifs, journalisation, contrôle d'accès logique, développement sécurisé des applications. C'est la famille la plus « IT ».

*Exemple Marsa Maroc :* chiffrer les échanges de données avec la douane, sauvegarder quotidiennement le système de gestion des cargaisons, segmenter le réseau pour isoler les automates industriels.

---
---

# COURS 2 — ISO 9001 : Management de la qualité

**Norme :** ISO 9001:2015 · **Niveau :** Débutant / Intermédiaire

### Pourquoi ce cours ?
Un port rend un **service** : accueillir des navires, décharger/charger des cargaisons, stocker, livrer, le tout vite, en sécurité et sans erreur. La qualité de ce service détermine la satisfaction des clients (armateurs, importateurs) et la réputation du port. ISO 9001 apporte une méthode pour rendre ce service **fiable, constant et sans cesse amélioré**. Elle partage la structure (clauses 4 à 10) et la logique PDCA d'ISO 27001 : apprendre l'une facilite l'autre.

---

## Chapitre 0 — Fondamentaux de la qualité
`chapitreHLS : Introduction`

### 0.1 — Qu'est-ce que la qualité ?
La **qualité** est l'aptitude d'un produit ou service à **répondre aux besoins et attentes** des clients, de manière **constante**. Un service de qualité n'est pas un service parfait une fois, c'est un service fiable **à chaque fois**. La régularité est au cœur de la notion.

*Exemple Marsa Maroc :* décharger un navire dans les délais annoncés, sans erreur de cargaison, à chaque escale — voilà la qualité de service.

### 0.2 — Les 7 principes du management de la qualité
ISO 9001 repose sur sept principes fondateurs :
1. **Orientation client** — tout part des besoins du client.
2. **Leadership** — la direction donne le cap et l'exemple.
3. **Implication du personnel** — un personnel compétent et motivé est essentiel.
4. **Approche processus** — gérer l'activité comme des processus reliés.
5. **Amélioration** — progresser en permanence.
6. **Décision fondée sur des preuves** — décider sur des données, pas des impressions.
7. **Management des relations avec les parties intéressées** — bien gérer fournisseurs et partenaires.

### 0.3 — Le cycle PDCA
Comme ISO 27001, la norme s'organise autour de la roue de Deming : **Planifier** (fixer objectifs et processus), **Faire** (mettre en œuvre), **Vérifier** (mesurer les résultats), **Agir** (corriger et améliorer). Cette boucle tourne en continu et structure les clauses 4 à 10.

### 0.4 — L'approche par les risques
Depuis la version 2015, ISO 9001 demande d'**anticiper les risques et opportunités** qui pourraient affecter la qualité — au lieu de seulement réagir aux problèmes après coup. On réfléchit en amont à ce qui pourrait mal tourner et on met en place des protections.

---

## Chapitre 1 — Contexte de l'organisation
`chapitreHLS : 4`

### 1.1 — Comprendre l'organisation et son contexte
L'organisation identifie les facteurs **internes** (culture, ressources, savoir-faire) et **externes** (marché, réglementation, concurrence, technologie) qui influencent sa capacité à fournir un service de qualité. Un système qualité déconnecté de la réalité de l'entreprise échoue.

*Exemple Marsa Maroc :* le contexte inclut la concurrence d'autres ports, les exigences des armateurs internationaux, la réglementation douanière marocaine.

### 1.2 — Besoins des parties intéressées
On identifie les attentes des **parties prenantes** : clients (rapidité, fiabilité), employés (conditions de travail), autorités (conformité réglementaire), fournisseurs, actionnaire (l'État). Le système qualité doit équilibrer ces attentes.

### 1.3 — Périmètre du SMQ
L'organisation définit **ce que couvre** son système de management de la qualité : quels sites, quelles activités, quels services. Un périmètre clair rend le système gérable et crédible.

### 1.4 — Le SMQ et ses processus (approche processus)
Plutôt que de voir l'entreprise comme des services isolés, on la voit comme un **enchaînement de processus** reliés : chaque processus reçoit des entrées, les transforme, produit des sorties qui alimentent le suivant. On identifie ces processus, leurs interactions, leurs responsables et leurs indicateurs.

*Exemple Marsa Maroc :* le processus « accostage » alimente le processus « déchargement », qui alimente « stockage », puis « livraison ». Les voir comme une chaîne permet de repérer où se créent les retards ou les erreurs.

---

## Chapitre 2 — Leadership
`chapitreHLS : 5`

### 2.1 — Engagement de la direction
La qualité est portée par le sommet. La direction est **responsable de l'efficacité** du système qualité : elle doit s'impliquer, fixer la politique, allouer les moyens, et faire de la satisfaction client une priorité partagée. Une direction absente condamne la démarche qualité.

### 2.2 — La politique qualité
C'est le document qui exprime les **engagements qualité** de l'organisation, aligné sur sa stratégie. Il sert de référence à tous et oriente les objectifs. Il doit être communiqué et compris à tous les niveaux.

### 2.3 — Rôles et responsabilités
La direction attribue clairement **qui est responsable de quoi** dans le système qualité : responsable qualité, pilotes de processus, etc. Chacun connaît son rôle dans la satisfaction du client.

---

## Chapitre 3 — Planification
`chapitreHLS : 6`

### 3.1 — Risques et opportunités
L'organisation identifie ce qui pourrait **empêcher d'atteindre** ses objectifs qualité (risques) et ce qui pourrait **aider** (opportunités), puis planifie des actions pour maîtriser les uns et saisir les autres.

*Exemple Marsa Maroc :* risque = panne d'un portique de déchargement provoquant des retards ; opportunité = nouvelle technologie de suivi des conteneurs améliorant le service.

### 3.2 — Objectifs qualité
On fixe des objectifs **mesurables et cohérents** avec la politique qualité (par exemple : « réduire de 20 % le temps moyen de déchargement »), et on planifie les actions, ressources et échéances pour les atteindre.

### 3.3 — Planification des changements
Quand un changement est nécessaire (nouvel équipement, nouvelle procédure), il doit être conduit de façon **maîtrisée** pour ne pas dégrader la qualité pendant la transition. On anticipe les conséquences avant d'agir.

---

## Chapitre 4 — Support
`chapitreHLS : 7`

### 4.1 — Ressources
L'organisation fournit les **moyens nécessaires** : personnel, infrastructure (quais, engins, systèmes informatiques), environnement de travail, moyens de mesure. Sans ressources adaptées, la qualité visée reste inatteignable.

### 4.2 — Compétences et sensibilisation
Le personnel doit être **compétent** (formation, expérience) et **conscient** de sa contribution à la qualité et à la satisfaction client. Un opérateur qui comprend l'impact de son travail fait moins d'erreurs.

### 4.3 — Communication et informations documentées
La **communication** interne et externe est organisée (qui communique quoi). Les **informations documentées** (procédures, enregistrements) sont maîtrisées : bonnes versions, accessibles, protégées, à jour.

---

## Chapitre 5 — Réalisation des activités opérationnelles
`chapitreHLS : 8`

Cette clause (la plus volumineuse) correspond au « Faire » : c'est la **production réelle** du service.

### 5.1 — Planification et maîtrise opérationnelles
On planifie et on contrôle les processus qui réalisent le service, dans des conditions maîtrisées (critères, ressources, contrôles).

### 5.2 — Exigences relatives aux produits et services
Avant de s'engager, l'organisation **détermine et revoit** les exigences du client : que veut-il exactement, peut-on le fournir ? On évite de promettre ce qu'on ne peut pas livrer.

*Exemple Marsa Maroc :* vérifier, avant d'accepter un navire, qu'on dispose du quai adapté, de la capacité de stockage et des moyens de déchargement requis.

### 5.3 — Conception et développement
Quand l'organisation **conçoit** un nouveau service, ce processus doit être maîtrisé (étapes, revues, validations). Cette section peut être exclue si l'organisation ne conçoit rien (elle applique seulement des services existants).

### 5.4 — Maîtrise des prestataires externes
Les **fournisseurs et sous-traitants** influent sur la qualité finale. L'organisation les évalue, les sélectionne et contrôle leurs prestations.

*Exemple Marsa Maroc :* évaluer un prestataire de maintenance des engins de levage, car sa défaillance affecterait directement le service portuaire.

### 5.5 — Production et prestation de service
Le service est réalisé dans des **conditions maîtrisées** : procédures claires, personnel qualifié, équipements vérifiés, traçabilité. C'est le moment où la qualité se joue concrètement.

---

## Chapitre 6 — Évaluation des performances
`chapitreHLS : 9`

### 6.1 — Surveillance, mesure et satisfaction client
L'organisation **suit ses performances** (indicateurs de délai, d'erreurs, de conformité) et **mesure la satisfaction** des clients (enquêtes, réclamations). Le client est le juge ultime de la qualité.

### 6.2 — Audit interne
Périodiquement, l'organisation **vérifie elle-même** que son système qualité est conforme et efficace, pour détecter les écarts avant l'audit externe.

### 6.3 — Revue de direction
La direction **analyse les résultats** (indicateurs, audits, satisfaction, réclamations) et décide des améliorations et des ressources à allouer. La boucle se referme au niveau du sommet.

---

## Chapitre 7 — Amélioration
`chapitreHLS : 10`

### 7.1 — Non-conformités et actions correctives
Face à un **écart** (produit non conforme, réclamation client), l'organisation le traite **et** agit sur sa **cause** pour éviter la récurrence. Le processus d'action corrective est un pilier de la norme.

*Exemple Marsa Maroc :* après une erreur d'affectation de cargaison, on ne se contente pas de corriger l'erreur — on revoit la procédure pour qu'elle ne se reproduise plus.

### 7.2 — Amélioration continue
L'organisation cherche **en permanence** à améliorer l'efficacité de son système qualité et la satisfaction de ses clients. C'est l'esprit même de la norme : ne jamais se contenter de l'existant.

---
---

## Annexe pédagogique — Comment utiliser ce cours dans la plateforme

Chaque **Cours** ci-dessus se mappe sur ta table `Cours`. Chaque **Chapitre** (avec son `chapitreHLS`) sur ta table `Chapitre`. Chaque **sous-section** numérotée sur ta table `SousChapitre`. Le champ `chapitreHLS` relie une lacune détectée dans un quiz à la clause exacte à réviser, ce qui alimente ton **moteur adaptatif**.

Les deux normes partageant la structure des clauses 4 à 10, ce gabarit se réutilise pour ajouter facilement **ISO 14001** (environnement) ou **ISO 45001** (santé-sécurité au travail).

*Contenu reformulé à des fins pédagogiques ; ne reproduit pas le texte officiel protégé des normes ISO.*
