export type CreateRoleDto = {
  name: string;
  description?: string;
};

export type UpdateRoleDto = {
  name?: string;
  description?: string;
};