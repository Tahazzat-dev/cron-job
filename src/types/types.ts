// import mongoose from "mongoose";

// export interface UserPayload {
//   _id: string;
//   role: string;
//   email: string;
// }
// export interface TokenPayload {
//   id: string;
//   role?: 'admin' | 'user';
// }


// export type UserRole = 'admin' | 'user';

// export interface TDomain {
//   status: 'enabled' | 'disabled';
//   url: string;
// };
// export interface IDomain extends TDomain {
//   _id: string
// };


// export interface IUserDataToInsert {
//   name: string;
//   email: string;
//   password: string;
//   username: string;
//   status: "pending";
//   mobile: string;
// }


// // types for schedular
// type DomainType = 'default' | 'manual';

// type TDomainType = {
//   url: string;
//   _id: string;
//   status: string;
// }


// // BSCScan api token validation
// export interface ITransaction {
//   userId: mongoose.Types.ObjectId;
//   status: "success" | "fail" | "pending";
//   amount: number;
//   transactionHash: string;
// }

// // payments
// export interface IPayment {
//   userId: mongoose.Types.ObjectId;
//   amount: number;
//   packageId: mongoose.Types.ObjectId;
//   processExpiresAt: Date;
// }


// // ===== job types from worker ===
// export type IJobType = { userId: string; domain: TDomain; type: DomainType }