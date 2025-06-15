export interface UserPayload {
  _id: string;
  role: string;
  email:string;
}
export interface TokenPayload {
  id: string;
  role?: 'admin' | 'user';
}