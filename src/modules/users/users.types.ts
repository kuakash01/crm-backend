
export type CreateUserDto = {
  fullName: string;
  email: string;
  phone?: string;
  roleId: number;
  reportsTo: number;
};