// import mongoose from "mongoose";
// import {  TokenTransaction, TxValidationParams } from "../types/types";

// export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// export function isValidTokenTransaction(
//   tx: TokenTransaction,
//   {
//     expectedHash,
//     expectedTo,
//     expectedTokenContract,
//     expectedValueInWei,
//   }: TxValidationParams
// ): boolean {
//   return (
//     tx.hash.toLowerCase() === expectedHash.toLowerCase() &&
//     tx.to.toLowerCase() === expectedTo.toLowerCase() &&
//     tx.contractAddress.toLowerCase() === expectedTokenContract.toLowerCase() &&
//     tx.value === expectedValueInWei
//   );
// }


// const COOKIE_EXPIRY = 15 * 24 * 60 * 60 * 1000;

// export const setRefreshCookie = (res: any, token: string) => {
//   res.cookie('refreshToken', token, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'strict',
//     maxAge: COOKIE_EXPIRY,
//   });
// };

// export function isTimestampOlderThan24Hours(timestampInSeconds: number): boolean {
//   const currentTimestamp = Math.floor(Date.now() / 1000);
//   const oneDayInSeconds = 24 * 60 * 60;
//   const differenceInSeconds = currentTimestamp - timestampInSeconds;
//   return differenceInSeconds > oneDayInSeconds;
// }


// export const isValidMongoId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id)


// export function calculateExpirationDate(validityInDays: number): Date {
//   const millisecondsPerDay = 24 * 60 * 60 * 1000;
//   const totalDurationMs = validityInDays * millisecondsPerDay;
//   const now = new Date();

//   return new Date(now.getTime() + totalDurationMs);
// }
