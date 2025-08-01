import { TokenTransaction, TxValidationParams } from "../types/types";

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export function isValidTokenTransaction(
    tx: TokenTransaction,
    {
        expectedHash,
        expectedTo,
        expectedTokenContract,
        expectedValueInWei,
    }: TxValidationParams
): boolean {
    return (
        tx.hash.toLowerCase() === expectedHash.toLowerCase() &&
        tx.to.toLowerCase() === expectedTo.toLowerCase() &&
        tx.contractAddress.toLowerCase() === expectedTokenContract.toLowerCase() &&
        tx.value === expectedValueInWei
    );
}


/*
 Example use
 const transactions: TokenTransaction[] = [/* paste JSON array here ];

const expectedParams: TxValidationParams = {
  expectedHash: "0xa2b64119d7301acce0c70c1e367d16f79a20b7d4297be1026b014e41a51c9384",
  expectedTo: "0x53f78a071d04224b8e254e243fffc6d9f2f3fa23",
  expectedFrom: "0x9399f9bc69f92e025a99d2a794e4db0c42b56751",
  expectedTokenContract: "0x55d398326f99059ff775485246999027b3197955",
  expectedValueInWei: "10000000000000000000", // 10 USDT
};

const match = transactions.find((tx) =>
  isValidTokenTransaction(tx, expectedParams)
);

if (match) {
  console.log("✅ Payment confirmed:", match.hash);
} else {
  console.log("❌ No matching valid transaction found.");
}


*/