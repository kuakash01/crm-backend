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


