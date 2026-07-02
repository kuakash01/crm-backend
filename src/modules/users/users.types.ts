
export type CreateUserDto = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number;
  reports_to: number;
};