export interface Officer {
  name: string;
  position: string;
  phone: string;
}

export type CenterCategory = 'safe' | 'moderate safe' | 'danger';

export interface VotingCenter {
  id: string;
  unionId: string;
  name: string;
  location: string;
  googleMapLink?: string;
  imageUrl?: string;
  presidingOfficer?: Officer;
  assistantPresidingOfficer?: Officer;
  policeOfficer?: Officer;
  category?: CenterCategory;
  comment?: string;
  maleVoters?: number;
  femaleVoters?: number;
}

export type AreaType = 'Union' | 'Pourashava';

export interface Union {
  id: string;
  upazillaId: string;
  name: string;
  type?: AreaType;
}

export type PersonCategory = 'admin' | 'police' | 'defence' | 'health' | 'emergency' | 'other';

export interface ImportantPerson {
  id: string;
  name: string;
  designation: string;
  phone: string;
  category: PersonCategory;
  ranking: number;
}

// New Interface for District Level Persons
export interface ZillaPerson {
  id: string;
  zilla: string; // e.g., 'বরগুনা'
  name: string;
  designation: string;
  phone: string;
  category: PersonCategory;
  ranking: number;
}

export interface Markha {
  id: string;
  name: string;      // Symbol Name (e.g., Boat, Sheaf of Paddy)
  partyName: string; // e.g., Party A
  nomineeName: string;
  imageUrl: string;
}

export interface Upazilla {
  id: string;
  name: string;
  zilla?: string; // Added Zilla (District)
  username: string;
  mongoDbUrl: string;
  port: string;
  password?: string;
  imgbbKey?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UPAZILLA_ADMIN = 'UPAZILLA_ADMIN',
}

export interface UserSession {
  username: string;
  role: UserRole;
  upazillaId?: string;
}