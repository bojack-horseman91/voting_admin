export interface Officer {
  name: string;
  position: string;
  phone: string;
}

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
}

export interface Union {
  id: string;
  upazillaId: string;
  name: string;
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