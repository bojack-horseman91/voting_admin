export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UPAZILLA_ADMIN = 'UPAZILLA_ADMIN',
  GUEST = 'GUEST'
}

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
  googleMapLink: string;
  imageUrl?: string;
  presidingOfficer: Officer;
  assistantPresidingOfficer: Officer;
  policeOfficer: Officer;
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
  password: string; // In a real app, this would be hashed
  mongoDbUrl: string;
  port: string;
}

export interface UserSession {
  role: UserRole;
  upazillaId?: string; // If logged in as upazilla admin
  username: string;
}
