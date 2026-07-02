 export enum UserRole {
    Admin = "admin",
    Manager = "manager",
  };

export interface UserDetails {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
}


export interface AuthUser {
  id: number;
  email: string;
  role: string;
}
