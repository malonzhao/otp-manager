export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
