import type { Teacher, Course, ProSession, Student, Registration, CourseException, Spectacle, CourseEnrollment, UserAccount, Room, ScheduleChangeRequest, RepresentationSession } from '../types';

export const teachers: Teacher[] = [
  { id: 't1', firstName: 'Anne', lastName: '', email: 'anne@annedkdanse.be', phone: '+32 477 74 59 73', specialties: ['Danse classique', 'Jazz', 'Contemporain'], bio: 'Directrice artistique & fondatrice de l\'école.', color: '#7C3AED' },
  { id: 't2', firstName: 'Daisy', lastName: '', email: 'daisy@annedkdanse.be', phone: '', specialties: ['Jazz', 'Contemporain'], bio: '', color: '#DB2777' },
  { id: 't3', firstName: 'Maurine', lastName: '', email: 'maurine@annedkdanse.be', phone: '', specialties: ['Éveil à la danse', 'Danse classique'], bio: '', color: '#D97706' },
  { id: 't4', firstName: 'Janis', lastName: '', email: 'janis@annedkdanse.be', phone: '', specialties: ['Hip-hop', 'Break'], bio: '', color: '#059669' },
  { id: 't5', firstName: 'Margaux', lastName: '', email: 'margaux@annedkdanse.be', phone: '', specialties: ['Girly', 'Pomdance', 'Ragga'], bio: '', color: '#0891B2' },
  { id: 't6', firstName: 'Zoé', lastName: '', email: 'zoe@annedkdanse.be', phone: '', specialties: ['Danse classique', 'Contemporain'], bio: '', color: '#65A30D' },
  { id: 't7', firstName: 'Jade', lastName: '', email: 'jade@annedkdanse.be', phone: '', specialties: ['Jazz', 'Girly'], bio: '', color: '#DC2626' },
  { id: 't8', firstName: 'Maya', lastName: '', email: 'maya@annedkdanse.be', phone: '', specialties: ['Hip-hop', 'Ragga'], bio: '', color: '#7C3AED' },
  { id: 't9', firstName: 'Nina', lastName: '', email: 'nina@annedkdanse.be', phone: '', specialties: ['Éveil à la danse', 'Danse classique'], bio: '', color: '#D97706' },
  { id: 't10', firstName: 'Charlotte', lastName: '', email: 'charlotte@annedkdanse.be', phone: '', specialties: ['Contemporain', 'Jazz'], bio: '', color: '#2563EB' },
  { id: 't11', firstName: 'Alain', lastName: '', email: 'alain@annedkdanse.be', phone: '', specialties: ['Line Dance', 'Hip-hop'], bio: '', color: '#059669' },
  { id: 't12', firstName: 'Andrew', lastName: '', email: 'andrew@annedkdanse.be', phone: '', specialties: ['Break', 'Hip-hop'], bio: '', color: '#DC2626' },
  { id: 't13', firstName: 'Pauline', lastName: '', email: 'pauline@annedkdanse.be', phone: '', specialties: ['Pole Dance', 'Contemporain'], bio: '', color: '#DB2777' },
  { id: 't14', firstName: 'Loreen', lastName: '', email: 'loreen@annedkdanse.be', phone: '', specialties: ['Girly', 'Jazz'], bio: '', color: '#0891B2' },
  { id: 't15', firstName: 'Jeanne', lastName: '', email: 'jeanne@annedkdanse.be', phone: '', specialties: ['Danse classique', 'Éveil à la danse'], bio: '', color: '#65A30D' },
  { id: 't16', firstName: 'Nono', lastName: '', email: 'nono@annedkdanse.be', phone: '', specialties: ['Hip-hop', 'Break', 'Ragga'], bio: '', color: '#7C3AED' },
  { id: 't17', firstName: 'Manon', lastName: '', email: 'manon@annedkdanse.be', phone: '', specialties: ['Jazz', 'Pomdance'], bio: '', color: '#D97706' },
  { id: 't18', firstName: 'Maeva', lastName: '', email: 'maeva@annedkdanse.be', phone: '', specialties: ['Contemporain', 'Danse classique'], bio: '', color: '#2563EB' },
  { id: 't19', firstName: 'Florence', lastName: '', email: 'florence@annedkdanse.be', phone: '', specialties: ['Éveil à la danse', 'Girly'], bio: '', color: '#DB2777' },
];

export const courses: Course[] = [
  // ===== STUDIO ADK — PIN =====
  { id: 'c1',  name: 'Éveil (3-4 ans)',                         style: 'Éveil à la danse', level: 'Éveil',         ageGroup: '3-5 ans',   teacherId: 't3',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '16:00', endTime: '17:00', capacity: 12, price: 55, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c2',  name: 'Initiation (4-5 ans)',                    style: 'Éveil à la danse', level: 'Éveil',         ageGroup: '3-5 ans',   teacherId: 't9',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '15:00', endTime: '16:00', capacity: 12, price: 55, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c3',  name: 'Éveil & Initiation (3-5 ans)',            style: 'Éveil à la danse', level: 'Éveil',         ageGroup: '3-5 ans',   teacherId: 't15', room: 'room1', dayOfWeek: 'Samedi',   startTime: '09:00', endTime: '10:00', capacity: 12, price: 55, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c4',  name: 'Hip-hop 1 (6-8 ans)',                     style: 'Hip-hop',          level: 'Débutant',      ageGroup: '6-8 ans',   teacherId: 't4',  room: 'room1', dayOfWeek: 'Mardi',    startTime: '17:00', endTime: '18:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c5',  name: 'Hip-hop 2 (9-11 ans)',                    style: 'Hip-hop',          level: 'Débutant',      ageGroup: '9-11 ans',  teacherId: 't16', room: 'room1', dayOfWeek: 'Samedi',   startTime: '10:00', endTime: '11:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c6',  name: 'Hip-hop 3 (11-13 ans)',                   style: 'Hip-hop',          level: 'Intermédiaire', ageGroup: '12-14 ans', teacherId: 't4',  room: 'room1', dayOfWeek: 'Mardi',    startTime: '18:00', endTime: '19:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c7',  name: 'Hip-hop 4 (àpd 14 ans) — Déb./Moyen',    style: 'Hip-hop',          level: 'Débutant',      ageGroup: '15-17 ans', teacherId: 't8',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '19:00', endTime: '20:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c8',  name: 'Hip-hop 5 (àpd 14 ans) — Intermédiaire', style: 'Hip-hop',          level: 'Intermédiaire', ageGroup: '15-17 ans', teacherId: 't8',  room: 'room1', dayOfWeek: 'Samedi',   startTime: '14:00', endTime: '15:30', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c9',  name: 'Hip-hop 6 (àpd 14 ans) — Avancé',        style: 'Hip-hop',          level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't12', room: 'room1', dayOfWeek: 'Samedi',   startTime: '11:00', endTime: '12:00', capacity: 12, price: 75, priceLabel: '/ mois', attire: [], description: 'COMPLET — Sous confirmation des profs', active: true },
  { id: 'c10', name: 'Jazz 1 (6-9 ans)',                        style: 'Jazz',             level: 'Débutant',      ageGroup: '6-8 ans',   teacherId: 't7',  room: 'room1', dayOfWeek: 'Jeudi',    startTime: '18:00', endTime: '19:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c11', name: 'Jazz 2 (10-13 ans)',                      style: 'Jazz',             level: 'Intermédiaire', ageGroup: '9-11 ans',  teacherId: 't7',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '14:00', endTime: '15:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c12', name: 'Jazz-Contempo 3 (àpd 14 ans) — Interm.', style: 'Jazz',             level: 'Intermédiaire', ageGroup: '15-17 ans', teacherId: 't2',  room: 'room1', dayOfWeek: 'Lundi',    startTime: '18:00', endTime: '19:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c13', name: 'Jazz-Contempo 4 (àpd 14 ans) — Avancé',  style: 'Contemporain',     level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't2',  room: 'room1', dayOfWeek: 'Lundi',    startTime: '20:00', endTime: '21:00', capacity: 12, price: 75, priceLabel: '/ mois', attire: [], description: 'Presque complet', active: true },
  { id: 'c14', name: 'Classique 1 (6-8 ans)',                   style: 'Danse classique',  level: 'Débutant',      ageGroup: '6-8 ans',   teacherId: 't6',  room: 'room1', dayOfWeek: 'Lundi',    startTime: '17:00', endTime: '18:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c15', name: 'Classique 2 (9-12 ans)',                  style: 'Danse classique',  level: 'Intermédiaire', ageGroup: '9-11 ans',  teacherId: 't6',  room: 'room1', dayOfWeek: 'Jeudi',    startTime: '18:00', endTime: '19:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c16', name: 'Classique 3 (àpd 13 ans)',                style: 'Danse classique',  level: 'Avancé',        ageGroup: '15-17 ans', teacherId: 't1',  room: 'room1', dayOfWeek: 'Lundi',    startTime: '19:00', endTime: '20:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c17', name: 'Pointes (àpd 10 ans)',                    style: 'Danse classique',  level: 'Avancé',        ageGroup: '9-11 ans',  teacherId: 't1',  room: 'room1', dayOfWeek: 'Vendredi', startTime: '17:00', endTime: '18:00', capacity: 12, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 — Cours de classique obligatoire en plus', active: true },
  { id: 'c18', name: 'Ragga 1 (9-13 ans)',                      style: 'Ragga',            level: 'Débutant',      ageGroup: '9-11 ans',  teacherId: 't5',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '17:00', endTime: '18:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], description: 'Presque complet', active: true },
  { id: 'c19', name: 'Ragga 2 (àpd 14 ans) — Déb./Interm.',    style: 'Ragga',            level: 'Débutant',      ageGroup: '15-17 ans', teacherId: 't5',  room: 'room1', dayOfWeek: 'Mercredi', startTime: '18:00', endTime: '19:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], description: 'Presque complet', active: true },
  { id: 'c20', name: 'Ragga 3 (àpd 14 ans) — Avancé',          style: 'Ragga',            level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't5',  room: 'room1', dayOfWeek: 'Jeudi',    startTime: '20:00', endTime: '21:00', capacity: 12, price: 75, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente', active: true },
  { id: 'c21', name: 'Girly 2 (àpd 12 ans)',                    style: 'Girly',            level: 'Intermédiaire', ageGroup: '12-14 ans', teacherId: 't14', room: 'room1', dayOfWeek: 'Samedi',   startTime: '15:30', endTime: '17:00', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c22', name: 'Break 1 (àpd 8 ans)',                     style: 'Break',            level: 'Débutant',      ageGroup: '9-11 ans',  teacherId: 't12', room: 'room1', dayOfWeek: 'Vendredi', startTime: '15:00', endTime: '16:00', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 — Jour et heure à préciser', active: true },
  { id: 'c23', name: 'Break 2 — Intermédiaire / Avancé',        style: 'Break',            level: 'Intermédiaire', ageGroup: 'Tous âges', teacherId: 't12', room: 'room1', dayOfWeek: 'Vendredi', startTime: '16:00', endTime: '17:00', capacity: 12, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 — Jour et heure à préciser', active: true },
  { id: 'c24', name: 'Pomdance (àpd 12 ans) — Déb./Interm.',   style: 'Pomdance',         level: 'Débutant',      ageGroup: '12-14 ans', teacherId: 't17', room: 'room1', dayOfWeek: 'Jeudi',    startTime: '19:00', endTime: '20:00', capacity: 15, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c25', name: 'Atelier Chorégraphique Maeva (àpd 12 ans)', style: 'Contemporain',   level: 'Tous niveaux',  ageGroup: '12-14 ans', teacherId: 't18', room: 'room1', dayOfWeek: 'Dimanche', startTime: '14:00', endTime: '16:00', capacity: 15, price: 20, priceLabel: '/ séance', attire: [], description: '1 dimanche par mois', active: true },
  { id: 'c26', name: 'Adultes Hip-hop / Ragga',                  style: 'Hip-hop',          level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't16', room: 'room1', dayOfWeek: 'Mercredi', startTime: '20:00', endTime: '21:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente — Semaines paires', active: true },
  { id: 'c27', name: 'Adultes Jazz / Contemporain',              style: 'Jazz',             level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't10', room: 'room1', dayOfWeek: 'Mercredi', startTime: '20:00', endTime: '21:00', capacity: 15, price: 70, priceLabel: '/ mois', attire: [], description: 'Presque complet — Semaines impaires', active: true },
  { id: 'c28', name: 'Line Dance',                               style: 'Line Dance',       level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't11', room: 'room1', dayOfWeek: 'Lundi',    startTime: '20:00', endTime: '21:00', capacity: 20, price: 65, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c29', name: 'Pole Dance (àpd 17 ans)',                  style: 'Pole Dance',       level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't13', room: 'room1', dayOfWeek: 'Vendredi', startTime: '19:00', endTime: '21:00', capacity: 10, price: 80, priceLabel: '/ mois', attire: [], description: 'COMPLET — Liste d\'attente — 1 sem/2 — Dès le 17/10', active: true },
  { id: 'c30', name: 'Cours Séniors',                            style: 'Line Dance',       level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't11', room: 'room1', dayOfWeek: 'Lundi',    startTime: '10:00', endTime: '11:00', capacity: 20, price: 55, priceLabel: '/ mois', attire: [], active: true },
  { id: 'c31', name: 'Compagnie Moove',                          style: 'Contemporain',     level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't1',  room: 'room1', dayOfWeek: 'Samedi',   startTime: '12:00', endTime: '13:00', capacity: 10, price: 80, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c32', name: 'Compagnie Unity',                          style: 'Hip-hop',          level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't16', room: 'room1', dayOfWeek: 'Samedi',   startTime: '12:00', endTime: '13:00', capacity: 10, price: 80, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 (alternance avec Compagnie Moove)', active: true },
  { id: 'c33', name: 'Compagnie Team (Jazz/Contempo)',            style: 'Jazz',             level: 'Avancé',        ageGroup: 'Adultes',   teacherId: 't1',  room: 'room1', dayOfWeek: 'Samedi',   startTime: '13:00', endTime: '15:00', capacity: 10, price: 80, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c34', name: 'Workshops',                                style: 'Contemporain',     level: 'Tous niveaux',  ageGroup: 'Tous âges', teacherId: 't1',  room: 'room1', dayOfWeek: 'Dimanche', startTime: '10:00', endTime: '12:00', capacity: 25, price: 30, priceLabel: '/ séance', attire: [], description: 'Selon planning du chorégraphe', active: true },

  // ===== FLORENVILLE — Complexe Sportif =====
  { id: 'c35', name: 'Pole Dance Florenville',                   style: 'Pole Dance',       level: 'Tous niveaux',  ageGroup: 'Adultes',   teacherId: 't13', room: 'room4', dayOfWeek: 'Vendredi', startTime: '20:15', endTime: '22:15', capacity: 10, price: 75, priceLabel: '/ mois', attire: [], description: '1 vendredi sur 2', active: true },

  // ===== ROX — ROUVROY =====
  { id: 'c36', name: 'Hip-hop & Break (àpd 6 ans) — ROX',       style: 'Hip-hop',          level: 'Débutant',      ageGroup: '6-8 ans',   teacherId: 't4',  room: 'room2', dayOfWeek: 'Jeudi',    startTime: '18:00', endTime: '19:30', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c37', name: 'Hip-hop (àpd 12 ans) — ROX',              style: 'Hip-hop',          level: 'Intermédiaire', ageGroup: '12-14 ans', teacherId: 't8',  room: 'room2', dayOfWeek: 'Samedi',   startTime: '14:00', endTime: '16:00', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 — Presque complet', active: true },
  { id: 'c38', name: 'Jazz / Contemporain (àpd 12 ans) — ROX',  style: 'Jazz',             level: 'Intermédiaire', ageGroup: '12-14 ans', teacherId: 't10', room: 'room2', dayOfWeek: 'Samedi',   startTime: '16:00', endTime: '18:00', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2 — Presque complet', active: true },
  { id: 'c39', name: 'Ragga (àpd 12 ans) — ROX',                style: 'Ragga',            level: 'Tous niveaux',  ageGroup: '12-14 ans', teacherId: 't5',  room: 'room2', dayOfWeek: 'Samedi',   startTime: '13:30', endTime: '15:30', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c40', name: 'Girly (àpd 12 ans) — ROX',                style: 'Girly',            level: 'Tous niveaux',  ageGroup: '12-14 ans', teacherId: 't14', room: 'room2', dayOfWeek: 'Samedi',   startTime: '15:30', endTime: '17:30', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },

  // ===== BERTRIX — Complexe Sportif =====
  { id: 'c41', name: 'Hip-hop & Breakdance (àpd 6 ans) — Bertrix', style: 'Hip-hop',       level: 'Débutant',      ageGroup: '6-8 ans',   teacherId: 't12', room: 'room3', dayOfWeek: 'Jeudi',    startTime: '18:00', endTime: '19:30', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], description: '1 semaine sur 2', active: true },
  { id: 'c42', name: 'Hip-hop / Ragga (àpd 10 ans) — Bertrix',  style: 'Hip-hop',          level: 'Tous niveaux',  ageGroup: '9-11 ans',  teacherId: 't8',  room: 'room3', dayOfWeek: 'Jeudi',    startTime: '17:00', endTime: '18:00', capacity: 15, price: 45, priceLabel: '/ mois', attire: [], active: true },
];

export const courseExceptions: CourseException[] = [];

export const proSessions: ProSession[] = [
  {
    id: 'ps1',
    title: 'Masterclass Contemporary - Marie Chen',
    coachName: 'Marie Chen',
    coachBio: 'Danseuse professionnelle, ancienne danseuse du Ballet National de Paris.',
    style: 'Contemporain',
    level: 'Avancé',
    ageGroup: '15-17 ans',
    date: '2026-06-20',
    startTime: '10:00',
    endTime: '13:00',
    room: 'Grande Salle',
    capacity: 20,
    price: 45,
    registrationOpenDate: '2026-05-01',
    registrationCloseDate: '2026-05-20',
    description: 'Stage intensif de 3h explorant les techniques contemporaines avancées.',
    status: 'open',
  },
  {
    id: 'ps2',
    title: 'Stage Hip-hop - DJ Kozmos',
    coachName: 'DJ Kozmos',
    coachBio: 'Champion de France de Hip-hop 2023, formateur international.',
    style: 'Hip-hop',
    level: 'Tous niveaux',
    ageGroup: 'Tous âges',
    date: '2026-07-12',
    startTime: '14:00',
    endTime: '17:00',
    room: 'Grande Salle',
    capacity: 30,
    price: 35,
    registrationOpenDate: '2026-05-20',
    registrationCloseDate: '2026-06-12',
    description: 'Stage hip-hop tous niveaux. Locking, popping, freestyle au programme.',
    status: 'open',
  },
  {
    id: 'ps3',
    title: 'Masterclass Classique - Elena Sorokina',
    coachName: 'Elena Sorokina',
    coachBio: 'Étoile du Bolchoï, 15 ans de carrière internationale.',
    style: 'Danse classique',
    level: 'Avancé',
    ageGroup: 'Adultes',
    date: '2026-04-05',
    startTime: '09:00',
    endTime: '12:00',
    room: 'Salle B',
    capacity: 15,
    price: 60,
    registrationOpenDate: '2026-02-20',
    registrationCloseDate: '2026-03-05',
    description: 'Stage classique niveau avancé avec l\'Étoile du Bolchoï.',
    status: 'completed',
  },
];

export const spectacles: Spectacle[] = [
  {
    id: 'sp1',
    title: 'Gala de fin d\'année 2026',
    date: '2026-06-14',
    venue: 'Centre Culturel de la Ville',
    description: 'Grand spectacle annuel réunissant tous les groupes de l\'école.',
    costumes: [
      {
        id: 'sc1',
        groupName: 'Éveil 3-4 ans',
        courseId: 'c1',
        description: 'Tutu blanc court avec paillettes argentées, justaucorps blanc',
        color: 'Blanc / Argent',
        price: 35,
        deadline: '2026-05-01',
        notes: 'Le tutu est fourni par l\'école. Les parents achètent les collants blancs.',
      },
      {
        id: 'sc2',
        groupName: 'Classique 1 (6-8 ans)',
        courseId: 'c14',
        description: 'Tutu rose classique, justaucorps rose, chaussons roses',
        color: 'Rose',
        price: 45,
        deadline: '2026-05-01',
        notes: 'Commande groupée possible via l\'école. Voir Anne pour les tailles.',
      },
      {
        id: 'sc3',
        groupName: 'Hip-hop 1 (6-8 ans)',
        courseId: 'c4',
        description: 'Survêtement coordonné noir & rouge (haut + bas), casquette noire ADK',
        color: 'Noir / Rouge',
        price: 55,
        deadline: '2026-05-15',
        notes: 'Commande groupée obligatoire, délai ferme.',
      },
      {
        id: 'sc4',
        groupName: 'Jazz-Contempo 3 (14+ ans)',
        courseId: 'c12',
        description: 'Body doré avec résille, short noir court, bottines noires',
        color: 'Doré / Noir',
        price: 65,
        deadline: '2026-05-15',
      },
      {
        id: 'sc5',
        groupName: 'Girly 2 (àpd 12 ans)',
        courseId: 'c21',
        description: 'Short pailleté rose, crop-top rose, bottines à talon rose',
        color: 'Rose pailleté',
        price: 60,
        deadline: '2026-05-20',
      },
    ],
  },
  {
    id: 'sp2',
    title: 'Showcase de Noël 2026',
    date: '2026-12-20',
    venue: 'Salle des fêtes Communale',
    description: 'Spectacle de Noël, ambiance festive. Tous les groupes participent.',
    costumes: [
      {
        id: 'sc6',
        groupName: 'Tous les groupes',
        description: 'Accessoire de Noël au choix : bonnet rouge, couronne, etc. + tenue habituelle de cours',
        color: 'Rouge / Vert / Or',
        price: 10,
        deadline: '2026-12-01',
        notes: 'Accessoire à charge des élèves, tenue de cours habituelle.',
      },
    ],
  },
];

export const students: Student[] = [
  {
    id: 's1', firstName: 'Léa', lastName: 'Dupont', birthDate: '2010-03-15',
    parentFirstName: 'Marie', parentLastName: 'Dupont',
    parentEmail: 'marie.dupont@email.com', parentPhone: '+32 478 11 22 33',
  },
  {
    id: 's2', firstName: 'Emma', lastName: 'Leroy', birthDate: '2009-07-22',
    parentFirstName: 'Pierre', parentLastName: 'Leroy',
    parentEmail: 'pierre.leroy@email.com', parentPhone: '+32 479 44 55 66',
  },
  {
    id: 's3', firstName: 'Camille', lastName: 'Moreau', birthDate: '2008-11-08',
    parentFirstName: 'Julie', parentLastName: 'Moreau',
    parentEmail: 'julie.moreau@email.com', parentPhone: '+32 476 77 88 99',
  },
  {
    id: 's4', firstName: 'Hugo', lastName: 'Simon', birthDate: '2007-04-30',
    email: 'hugo.simon@email.com',
    parentFirstName: 'Thomas', parentLastName: 'Simon',
    parentEmail: 'thomas.simon@email.com', parentPhone: '+32 475 00 11 22',
  },
  {
    id: 's5', firstName: 'Chloé', lastName: 'Bernard', birthDate: '2011-09-14',
    parentFirstName: 'Sophie', parentLastName: 'Bernard',
    parentEmail: 'sophie.bernard@email.com', parentPhone: '+32 473 33 44 55',
  },
];

export const registrations: Registration[] = [
  { id: 'r1', sessionId: 'ps1', studentId: 's1', registrationDate: '2026-05-02', status: 'validated', paymentStatus: 'paid', paymentDate: '2026-05-03' },
  { id: 'r2', sessionId: 'ps1', studentId: 's3', registrationDate: '2026-05-05', status: 'pending', paymentStatus: 'pending' },
  { id: 'r3', sessionId: 'ps1', studentId: 's4', registrationDate: '2026-05-07', status: 'validated', paymentStatus: 'paid', paymentDate: '2026-05-08' },
  { id: 'r4', sessionId: 'ps2', studentId: 's2', registrationDate: '2026-05-22', status: 'pending', paymentStatus: 'pending' },
  { id: 'r5', sessionId: 'ps3', studentId: 's5', registrationDate: '2026-02-25', status: 'validated', paymentStatus: 'paid', paymentDate: '2026-02-26' },
];

// Inscriptions aux cours réguliers hebdomadaires
export const courseEnrollments: CourseEnrollment[] = [
  { id: 'ce1', courseId: 'c14', studentId: 's1', enrolledAt: '2026-09-01', status: 'active' }, // Léa → Classique 1
  { id: 'ce2', courseId: 'c12', studentId: 's1', enrolledAt: '2026-09-01', status: 'active' }, // Léa → Jazz-Contempo 3
  { id: 'ce3', courseId: 'c6',  studentId: 's2', enrolledAt: '2026-09-01', status: 'active' }, // Emma → Hip-hop 3
  { id: 'ce4', courseId: 'c21', studentId: 's2', enrolledAt: '2026-09-01', status: 'active' }, // Emma → Girly 2
  { id: 'ce5', courseId: 'c13', studentId: 's3', enrolledAt: '2026-09-01', status: 'active' }, // Camille → Jazz-Contempo 4
  { id: 'ce6', courseId: 'c28', studentId: 's4', enrolledAt: '2026-09-01', status: 'active' }, // Hugo → Line Dance
  { id: 'ce7', courseId: 'c22', studentId: 's5', enrolledAt: '2026-09-01', status: 'active' }, // Chloé → Break 1
];

// Comptes utilisateurs (mot de passe en clair - démo sans backend)
export const userAccounts: UserAccount[] = [
  // Administrateur
  {
    id: 'u0',
    email: 'admin@annedkdanse.be',
    password: 'admin2026',
    role: 'admin',
    displayName: 'Administrateur',
    studentIds: [],
  },
  // Professeurs (accès admin)
  {
    id: 'u1',
    email: 'anne@annedkdanse.be',
    password: 'anne2026',
    role: 'teacher',
    displayName: 'Anne',
    studentIds: [],
    teacherId: 't1',
  },
  {
    id: 'u2',
    email: 'daisy@annedkdanse.be',
    password: 'daisy2026',
    role: 'teacher',
    displayName: 'Daisy',
    studentIds: [],
    teacherId: 't2',
  },
  // Parents
  {
    id: 'u3',
    email: 'marie.dupont@email.com',
    password: 'dupont2026',
    role: 'parent',
    displayName: 'Marie Dupont',
    studentIds: ['s1'],   // Léa
  },
  {
    id: 'u4',
    email: 'pierre.leroy@email.com',
    password: 'leroy2026',
    role: 'parent',
    displayName: 'Pierre Leroy',
    studentIds: ['s2'],   // Emma
  },
  {
    id: 'u5',
    email: 'julie.moreau@email.com',
    password: 'moreau2026',
    role: 'parent',
    displayName: 'Julie Moreau',
    studentIds: ['s3'],   // Camille
  },
  {
    id: 'u6',
    email: 'thomas.simon@email.com',
    password: 'simon2026',
    role: 'parent',
    displayName: 'Thomas Simon',
    studentIds: ['s4'],   // Hugo
  },
  {
    id: 'u7',
    email: 'sophie.bernard@email.com',
    password: 'bernard2026',
    role: 'parent',
    displayName: 'Sophie Bernard',
    studentIds: ['s5'],   // Chloé
  },
];

// ===== SALLES DE DANSE =====
export const rooms: Room[] = [
  {
    id: 'room1',
    name: 'Grande Salle',
    venue: 'Studio ADK',
    city: 'Pin (BE)',
    capacity: 30,
  },
  {
    id: 'room2',
    name: 'Grande Salle',
    venue: 'ROX',
    city: 'Rouvroy (BE)',
    capacity: 25,
  },
  {
    id: 'room3',
    name: 'Salle de danse',
    venue: 'Complexe Sportif',
    city: 'Bertrix (BE)',
    capacity: 20,
  },
  {
    id: 'room4',
    name: 'Salle de danse',
    venue: 'Complexe Sportif',
    city: 'Florenville (BE)',
    capacity: 20,
  },
];

export const scheduleChangeRequests: ScheduleChangeRequest[] = [];

export const representationSessions: RepresentationSession[] = [
  {
    id: 'rs1',
    title: 'Répétition générale Gala',
    teacherId: 't1',
    courseIds: ['c14', 'c12'],
    date: '2026-06-07',
    startTime: '10:00',
    endTime: '13:00',
    room: 'room1',
    description: 'Répétition générale avant le gala de fin d\'année.',
    status: 'confirmed',
  },
];
