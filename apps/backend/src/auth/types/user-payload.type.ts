export interface UserPayload {
  sub: string; // userId
  orgId: string; // organizationId
  email: string;
  iat?: number;
  exp?: number;
}
