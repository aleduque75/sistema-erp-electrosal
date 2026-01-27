export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}
