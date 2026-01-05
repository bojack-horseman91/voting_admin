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
}

export type AreaType = 'Union' | 'Pourashava';

export interface Union {
  id: string;
  upazillaId: string;
  name: string;
  type?: AreaType;
}

export type PersonCategory = 'admin' | 'police' | 'defence';

export interface ImportantPerson {
  id: string;
  name: string;
  designation: string;
  phone: string;
  category: PersonCategory;
  ranking: number;
}

export interface Upazilla {
  id: string;
  name: string;
  username: string;
  mongoDbUrl: string;
  port: string;
  password?: string;
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