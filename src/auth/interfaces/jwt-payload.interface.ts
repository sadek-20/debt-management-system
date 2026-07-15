export interface JwtPayload {
  sub: string;
  phone: string;
  role: string;
  businessId: string;
  type: 'access' | 'refresh';
}
