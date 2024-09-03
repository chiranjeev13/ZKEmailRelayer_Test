import { buildPoseidon } from "circomlibjs";
import axios from "axios";
import SimpleWallet_abi from "./swallet.json" assert { type: "json" };
import RecoveryController_abi from "./recoverycontroller.json" assert { type: "json" };

import { readContract, writeContract } from "viem/actions";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
// {
//     "safeEmailRecoveryModule": "0x65838a66E46e9c5391abfc4bCe2f922196070568"
// }
// SimpleWallet implementation deployed at: 0x74Cd45F69d0eE2aBad147bbD882f33b72992D872

let SimpleWallet = `0xf22d55bfFA001cb87c7bF3E74136FeAeb60989bA`;
let RecoveryController = `0x7586b7be20ca15b3194A28Cf344f3E3fba2694FE`;

const pvtkey = ``;
const account = privateKeyToAccount(pvtkey);
const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(`https://base-sepolia-rpc.publicnode.com`),
});
const pwallet = createPublicClient({
  chain: baseSepolia,
  transport: http(`https://base-sepolia-rpc.publicnode.com`),
});

export function bytesToHex(bytes) {
  return [...bytes]
    .reverse()
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export async function genAccountCode() {
  const poseidon = await buildPoseidon();
  const accountCodeBytes = poseidon.F.random();
  return bytesToHex(accountCodeBytes);
}

async function getAccountSalt() {
  const acc_code = await genAccountCode();
  //   const res = await axios.post("https://auth.prove.email/api/getAccountSalt", {
  //     account_code: acc_code,
  //     email_addr: "chiranjeevmishra13@gmail.com",
  //   });
  //   console.log("Account Salt", res.data);
  //   console.log()
  return acc_code;
}

async function postRecoveryRequest() {
  const accountcode = await getAccountSalt();
  console.log(accountcode);
  //requestGuardian
  let res = await axios.post("https://auth.prove.email/api/getAccountSalt", {
    account_code: accountcode,
    email_addr: "chiranjeevytube@gmail.com",
  });
  console.log("Account Salt", res.data);
  const salt = res.data;
  const addr = await pwallet.readContract({
    abi: RecoveryController_abi.abi,
    address: RecoveryController,
    functionName: "computeEmailAuthAddress",
    args: [SimpleWallet, salt],
  });
  console.log("guardian addr", addr);

  const xres = await wallet.writeContract({
    abi: RecoveryController_abi.abi,
    address: RecoveryController,
    functionName: "requestGuardian",
    args: [addr],
  });

  console.log(xres)
  //   await writeContract({
  //     abi:abi,
  //     address:`0xf22d55bfFA001cb87c7bF3E74136FeAeb60989bA`,
  //     functionName: "requestGuardian",
  //     args:[]
  //   })
  res = await axios.post("https://auth.prove.email/api/acceptanceRequest", {
    controller_eth_addr: RecoveryController,
    guardian_email_addr: `chiranjeevytube@gmail.com`,
    account_code: accountcode,
    template_idx: 0,
    subject: `Accept guardian request for ${SimpleWallet}`,
  });
  console.log(res.data);
}

async function requestStatus(requestID) {
  const res = await axios.post("https://auth.prove.email/api/requestStatus", {
    request_id: requestID,
  });
  console.log(res.data);
}

//getAccountSalt();
postRecoveryRequest();
//requestStatus(3510072497);
