export type DanceStyle =
  | 'Éveil à la danse'
  | 'Danse classique'
  | 'Jazz'
  | 'Contemporain'
  | 'Hip-hop'
  | 'Break'
  | 'Ragga'
  | 'Girly'
  | 'Pomdance'
  | 'Line Dance'
  | 'Pole Dance';

export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';

export type AgeGroup = '3-5 ans' | '6-8 ans' | '9-11 ans' | '12-14 ans' | '15-17 ans' | 'Adultes' | 'Tous âges';

export type Level = 'Éveil' | 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';

export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export type RegistrationStatus = 'pending' | 'validated' | 'rejected' | 'waitlist';

export type AttireCategory = 'Tenue' | 'Chaussures' | 'Accessoire' | 'Costume de spectacle';

export interface AttireItem {
  id: string;
  name: string;           // Ex: "Justaucorps"
  description: string;    // Ex: "Justaucorps lilas, sans manche"
  category: AttireCategory;
  mandatory: boolean;
  color?: string;         // couleur requise
  brand?: string;         // marque recommandée
  notes?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialties: DanceStyle[];
  bio?: string;
  color: string;
}

export interface Course {
  id: string;
  name: string;
  style: DanceStyle;
  level: Level;
  ageGroup: AgeGroup;
  teacherId: string;
  substituteTeacherId?: string; // remplaçant désigné en cas d'absence
  room: string;
  dayOfWeek: DayOfWeek;
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  capacity: number;
  price: number;       // tarif mensuel ou à la séance en €
  priceLabel: string;  // Ex: "/ mois", "/ trimestre", "/ séance"
  attire: AttireItem[];
  description?: string;
  active: boolean;
}

export interface CourseException {
  id: string;
  courseId: string;
  originalDate: string; // YYYY-MM-DD
  isCancelled: boolean;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
}

export interface ProSession {
  id: string;
  title: string;
  coachName: string;
  coachBio?: string;
  style: DanceStyle;
  level: Level;
  ageGroup: AgeGroup;
  date: string;       // YYYY-MM-DD
  startTime: string;
  endTime: string;
  room: string;
  capacity: number;
  price: number;
  registrationOpenDate: string;  // YYYY-MM-DD
  registrationCloseDate: string; // YYYY-MM-DD
  description?: string;
  status: 'draft' | 'open' | 'closed' | 'completed' | 'cancelled';
}

export interface SpectacleCostume {
  id: string;
  groupName: string;    // Ex: "Groupe Jazz ados"
  courseId?: string;
  description: string;  // description du costume
  color?: string;
  price?: number;       // coût du costume
  deadline?: string;    // date limite pour avoir le costume
  notes?: string;
}

export interface Spectacle {
  id: string;
  title: string;
  date: string;         // YYYY-MM-DD
  venue: string;
  description?: string;
  costumes: SpectacleCostume[];
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email?: string;
  phone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail: string;
  parentPhone: string;
}

export interface Registration {
  id: string;
  sessionId: string;
  studentId: string;
  registrationDate: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  notes?: string;
}

export interface Room {
  id: string;
  name: string;       // "Grande Salle"
  venue: string;      // "Studio ADK — Pin (BE)"
  city: string;
  capacity: number;
}

export interface ScheduleChangeRequest {
  id: string;
  requestingTeacherId: string;
  courseId: string;
  proposedDay: DayOfWeek;
  proposedStartTime: string;
  proposedEndTime: string;
  proposedRoom: string;
  conflictingCourseId: string;
  conflictingTeacherId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  requestNote?: string;
  responseNote?: string;
}

export interface RepresentationSession {
  id: string;
  title: string;
  teacherId: string;
  courseIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  description?: string;
  status: 'draft' | 'confirmed' | 'cancelled';
}

// Inscription à un cours régulier (hebdomadaire)
export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;   // YYYY-MM-DD
  status: 'active' | 'pending' | 'cancelled';
}

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface UserAccount {
  id: string;
  email: string;
  password: string;       // stocké en clair (démo sans backend)
  role: UserRole;
  displayName: string;
  studentIds: string[];   // enfants/membres liés (pour les parents)
  teacherId?: string;     // lié à un prof (pour les teachers)
}
