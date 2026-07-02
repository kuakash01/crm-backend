declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: string;
      organizationId: number;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export { };