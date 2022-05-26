import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  MongoClient,
  Db,
  Collection,
  Timestamp,
} from "mongodb";
import { ethers } from "ethers";
import {
  Addresses,
  Transactions,
  TransactionStatus,
  transactionStatusToStr,
} from "./schemas";

const {
  AXON_FAUCET_LISTEN_ADDRESS,
  AXON_FAUCET_LISTEN_PORT,

  AXON_FAUCET_RPC_URL,
  AXON_FAUCET_CHAIN_ID,

  AXON_FAUCET_REQUIRED_CONFIRMATIONS,
  AXON_FAUCET_CLAIM_VALUE,

  AXON_FAUCET_MONGODB_URL,
  AXON_FAUCET_MONGODB_DB,

  AXON_FAUCET_MONGODB_TRANSACTIONS_COLLECTION,

  AXON_FAUCET_MONGODB_ADDRESSES_COLLECTION,
} = process.env;

function consolePretty(msg: string, body: unknown) {
  console.dir({ msg, body }, { depth: null, color: true });
}

function stringNumSum(numbers: string[]): bigint {
  return numbers.length === 0 ? BigInt(0)
    : numbers.map((v) => BigInt(v)).reduce((a, b) => a + b);
}

function assertNumber(str: string, name: string): number {
  const res = Number(str);

  if (Number.isNaN(res)) {
    console.error(`Invalid ${name}: ${str}`);
    process.exit();
  }

  return res;
}

function assertBigInt(str: string, name: string): bigint {
  try {
    return BigInt(str);
  } catch {
    console.error(`Invalid ${name}: ${str}`);
    process.exit();
  }

  return null;
}

function getPopNOperation(n: number, name: string) {
  return {
    $slice: [
      `$${name}`,
      {
        $subtract: [
          n,
          { $size: `$${name}` },
        ],
      },
    ],
  };
}

const PORT = assertNumber(AXON_FAUCET_LISTEN_PORT, "AXON_FAUCET_LISTEN_PORT");
const CHAIN_ID = assertNumber(AXON_FAUCET_CHAIN_ID, "AXON_FAUCET_CHAIN_ID");
const REQUIRED_CONFIRMATIONS = assertNumber(
  AXON_FAUCET_REQUIRED_CONFIRMATIONS,
  "AXON_FAUCET_REQUIRED_CONFIRMATIONS",
);
const CLAIM_VALUE = assertBigInt(
  AXON_FAUCET_CLAIM_VALUE,
  "AXON_FAUCET_CLAIM_VALUE",
);

const DB_CLIENT = new MongoClient(AXON_FAUCET_MONGODB_URL);
const CONNECTING_DB = DB_CLIENT.connect();

let DB: Db;
let TRANSACTIONS: Collection<Transactions>;
let ADDRESSES: Collection<Addresses>;

const APP = express();
APP.use(express.json());
APP.use(cors());

const PROVIDER = new ethers.providers.JsonRpcProvider(
  AXON_FAUCET_RPC_URL,
  CHAIN_ID,
);

APP.get("/createTestData", async (req, res) => {
  await Promise.all([
    ADDRESSES.insertMany([
      {
        private_key: "0x0000000000000000000000000000000000000000000000000000000000000000",
        balance: "1000000000000000000",
        pending_amount: [],
        is_processing: false,
      },
      {
        private_key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        balance: "1000000000000000000",
        pending_amount: [],
        is_processing: false,
      },
      {
        private_key: "0x0000000000000000000000000000000000000000000000000000000000000002",
        balance: "1000000000000000000",
        pending_amount: [],
        is_processing: false,
      },
    ]),
    TRANSACTIONS.insertMany([
      {
        from: "0x0000000000000000000000000000000000000000",
        to: "0x0000000000000000000000000000000000000000",
        value: "1000000000000000000",
        gas: "100",
        nonce: "0",
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        time: Timestamp.fromNumber(Date.now()),
        status: TransactionStatus.Pending,
      },
      {
        from: "0x0000000000000000000000000000000000000000",
        to: "0x0000000000000000000000000000000000000000",
        value: "1000000000000000000",
        gas: "100",
        nonce: "0",
        hash: "0x0000000000000000000000000000000000000000000000000000000000000001",
        time: Timestamp.fromNumber(Date.now()),
        status: TransactionStatus.Confirmed,
      },
      {
        from: "0x0000000000000000000000000000000000000000",
        to: "0x0000000000000000000000000000000000000000",
        value: "1000000000000000000",
        gas: "100",
        nonce: "0",
        hash: "0x0000000000000000000000000000000000000000000000000000000000000002",
        time: Timestamp.fromNumber(Date.now()),
        status: TransactionStatus.Failed,
      },
    ]),
  ]);

  res.send("Test data created");
});

APP.get("/importMnemonic", async (req, res) => {
  const { mnemonic: mnemonicRaw, count: countRaw, path: pathRaw } = req.query;

  const count = Number(countRaw);
  const mnemonic = String(mnemonicRaw);
  const { defaultPath } = ethers.utils;
  const path = pathRaw ? String(pathRaw)
    : defaultPath.substring(0, defaultPath.length - 1);
  if (Number.isNaN(count) || !ethers.utils.isValidMnemonic(mnemonic)) {
    res.sendStatus(400);
    return;
  }

  const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);

  const preparing = Array.from(Array(count).keys(), async (i) => {
    const subNode = hdNode.derivePath(`${path}${i}`);
    const balance = await PROVIDER.getBalance(subNode.address);

    return {
      address: subNode.address,
      private_key: subNode.privateKey,
      balance: balance.toString(),
    };
  });

  const addresses = await Promise.all(preparing);

  consolePretty("[Import mnemonic]", addresses.map(({ address, balance }) => ({
    address,
    balance,
  })));

  await ADDRESSES.deleteMany({});
  await ADDRESSES.insertMany(addresses.map(({ private_key, balance }) => ({
    private_key,
    balance,
    is_processing: false,
    pending_amount: [],
  })));

  res.send("Mnemonic imported");
});

async function clearDirtyAddresses() {
  const possibleAddresses = await ADDRESSES.find(
    { is_processing: false, pending_amount: { $ne: [] } },
  ).project({ private_key: 1 }).toArray();

  let updated = 0;

  const clearing = possibleAddresses.map(async ({ private_key }) => {
    const { value: existed } = await ADDRESSES.findOneAndUpdate(
      { private_key, is_processing: false, pending_amount: { $ne: [] } },
      { $set: { is_processing: true } },
    );
    if (!existed) {
      return;
    }

    const { balance, pending_amount } = existed;

    const final_balance = BigInt(balance) + stringNumSum(pending_amount);

    await ADDRESSES.updateOne(
      { private_key },
      [{
        $set: {
          is_processing: false,
          balance: final_balance.toString(),
          pending_amount: getPopNOperation(pending_amount.length, "pending_amount"),
        },
      }],
    );
    updated += 1;
  });

  await Promise.all(clearing);

  if (updated !== 0) {
    console.log(`[Addresses] Dirty addresses Cleared: ${updated}`);
  }
}

APP.get("/totalBalance", async (req, res) => {
  const addresses = await ADDRESSES.find({}).project({
    balance: 1,
    pending_amount: 1,
  }).toArray();

  const result = stringNumSum(
    addresses.map(
      ({ balance, pending_amount }) => [balance, pending_amount].flat(),
    ).flat(),
  ).toString();

  console.log(`[Total balance] ${result}`);

  res.send(result);
  res.end();

  await clearDirtyAddresses();
});

function parseNumberOr(str: string, or: number): number {
  const res = Number(str);
  if (Number.isNaN(res)) {
    return or;
  }

  return res;
}

const GET_TRANSACTIONS_STATUS = {
  Pending: [0],
  Confirmed: [1],
  Normal: [0, 1],
  Failed: [2],
  All: [0, 1, 2],
  undefined: [0, 1, 2],
};

APP.get("/transactions", async (req, res) => {
  const { page: pageStr, limit: limitStr, status: statusStr } = req.query;
  const status = GET_TRANSACTIONS_STATUS[String(statusStr)];
  if (!status) {
    res.sendStatus(400);
    return;
  }
  const page = parseNumberOr(String(pageStr), 0);
  const limit = parseNumberOr(String(limitStr), 10);

  const transactionsResult = await TRANSACTIONS
    .find({ status: { $in: status } })
    .skip(page * limit)
    .limit(limit)
    .project({
      from: 1,
      to: 1,
      value: 1,
      gas: 1,
      nonce: 1,
      hash: 1,
      time: 1,
      status: 1,
    })
    .sort({ time: -1 })
    .toArray();
  const transactions = transactionsResult.map(({
    from,
    to,
    value,
    gas,
    nonce,
    hash,
    time,
    status: statusRees,
  }) => ({
    from,
    to,
    value,
    gas,
    nonce,
    hash,
    time: time.toNumber(),
    status: transactionStatusToStr(statusRees),
  }));

  consolePretty(
    "[Get transactions]",
    {
      page,
      limit,
      status,
      transactions,
    },
  );

  res.send(transactions);
});

APP.post("/claim", async (req, res) => {
  const { account: accountRaw } = req.body;
  const account = String(accountRaw);

  console.log(`[Claim] To account: ${account}`);

  const addressCursor = ADDRESSES.find({}).sort({ private_key: 1 });

  let choosed;
  // eslint-disable-next-line no-await-in-loop
  while (await addressCursor.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    const { private_key, balance, pending_amount } = await addressCursor.next();
    if (BigInt(balance) + stringNumSum(pending_amount) >= CLAIM_VALUE) {
      choosed = private_key;
      break;
    }
  }
  await addressCursor.close();

  const signer = new ethers.Wallet(choosed, PROVIDER);
  const from = signer.address;

  await ADDRESSES.updateOne(
    { private_key: choosed },
    { $push: { pending_amount: (-CLAIM_VALUE).toString() } },
  );

  const txResponse = await signer.sendTransaction({
    to: account,
    value: CLAIM_VALUE,
  });

  const {
    to,
    value: valueNum,
    nonce: nonceNum,
    hash,
  } = txResponse;

  const value = valueNum.toString();
  const nonce = nonceNum.toString();

  const receipt = await txResponse.wait(1);

  const { gasUsed } = receipt;
  const gas = gasUsed.toString();

  const result = {
    from,
    to,
    value,
    nonce,
    hash,
    gas,
  };
  consolePretty("[Claim] Transaction mined", result);

  res.send(result);
  res.end();

  await Promise.all([
    txResponse.wait(REQUIRED_CONFIRMATIONS),
    TRANSACTIONS.insertOne({
      from,
      to,
      value,
      gas,
      nonce,
      hash,
      time: Timestamp.fromNumber(Date.now()),
      status: TransactionStatus.Pending,
    }),
  ]);

  await TRANSACTIONS.updateOne(
    { hash },
    { $set: { status: TransactionStatus.Confirmed } },
  );
  consolePretty("[Claim] Transaction confirmed", result);
});

CONNECTING_DB
  .then(() => {
    DB = DB_CLIENT.db(AXON_FAUCET_MONGODB_DB);

    TRANSACTIONS = DB.collection(AXON_FAUCET_MONGODB_TRANSACTIONS_COLLECTION);
    ADDRESSES = DB.collection(AXON_FAUCET_MONGODB_ADDRESSES_COLLECTION);

    APP.listen(PORT, AXON_FAUCET_LISTEN_ADDRESS, () => {
      console.log(`Example app listening on ${AXON_FAUCET_LISTEN_ADDRESS}:${PORT}`);
    });
  });
