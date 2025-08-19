import mongoose from "mongoose";

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
  title:string;
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
    status:"pending";
    mobile: string;
    domain: string;
}


// types for schedular
type DomainType = 'default' | 'manual';

type TDomainType = {
    url: string;
    _id: string;
    status: string;
}

export interface IAddDomainToQueueOptions {
    userId: string;
    domain: TDomainType;
    type: DomainType;
    intervalInMs: number;
}


// BSCScan api token validation
export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  status: "success"|"fail" | "pending";
  amount: number;
  transactionHash:string;
  packageId:mongoose.Types.ObjectId;
}

export interface TokenTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  methodId: string;
  functionName: string;
  confirmations: string;
}

export interface TxValidationParams {
  expectedHash: string;
  expectedTo: string;
  expectedTokenContract: string;
  expectedValueInWei: string;
}




// payments
export interface IPayment {
  userId: mongoose.Types.ObjectId;
  amount: number;
  packageId: mongoose.Types.ObjectId;
  processExpiresAt:Date;
}


