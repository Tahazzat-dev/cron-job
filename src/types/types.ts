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

export interface TDomain {
  status: 'enabled' | 'disabled';
  url: string;
};
export interface IDomain extends TDomain {
  _id:string
};

export interface TManualDomain extends TDomain {
  executeInMs?: number; 
}
export interface IManualDomain extends TDomain {
  executeInMs?: number; 
  _id:string;
}

export interface IUserDataToInsert {
    name: string;
    email:string;
    password: string;
    username: string;
    mobile: string;
    domain: string;
    defaultDomains: TDomain[];
    subscription: string | undefined;
    packageExpiresAt:Date;
}