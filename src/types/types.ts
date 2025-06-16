export interface UserPayload {
  _id: string;
  role: string;
  email:string;
}
export interface TokenPayload {
  id: string;
  role?: 'admin' | 'user';
}


export type UserRole = 'admin' | 'user';
export type SubscriptionType = 'silver' | 'gold' | 'diamond' | 'trial';

export type TDomain = {
  status: 'enabled' | 'disabled';
  url: string;
};