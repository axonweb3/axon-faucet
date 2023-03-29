import useSWR from 'swr';
import { fetcher, formatValue, getAbbreviation } from '@/lib/utils';
import BeatLoader from 'react-spinners/BeatLoader';
import Button from 'react-bootstrap/Button';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ITransaction } from '@/models/transaction';
import Badge from '@/components/badge';
import { TransactionStatus } from '@/lib/constants';
import React from 'react';

export default function Home() {
  const [address, setAddress] = React.useState('');
  const [claiming, setClaiming] = React.useState(false);
  const { data: totalBalanceData } = useSWR('/api/total-balance', fetcher);
  const { data: txsData, mutate } = useSWR('/api/transactions', fetcher);
  const { transactions = [] } = txsData ?? {};

  const handleClaim = React.useCallback(async () => {
    if (claiming || !address) {
      return;
    }
    setClaiming(true);
    await fetch('/api/claim', {
      method: 'POST',
      body: JSON.stringify({ account: address }),
    });
    mutate();
    setAddress('');
    setClaiming(false);
  }, [address, claiming, mutate]);

  return (
    <>
      <Head>
        <title>Axon Faucet</title>
      </Head>
      <main>
        <div className="px-2 h-16 w-scrren bg-white shadow-sm border-b border-gray-100">
          <Link href="https://axonweb3.io">
            <Image width={128} height={64} src="/logo.webp" alt="Axon Logo" />
          </Link>
        </div>
        <div
          className="flex flex-col justify-center items-center bg-cover w-full sm:min-h-[30vh]"
          style={{ backgroundImage: `url(/background.webp)` }}
        >
          <div className="flex flex-col justify-center items-center pt-10">
            <Image
              className="mb-6"
              src="/favicon.svg"
              height={200}
              width={200}
              alt="Axon"
            />
            <h1 className="mb-20 font-alfarn-2 text-5xl tracking-wide text-gray-800 text-center">
              Axon Faucet
            </h1>
          </div>
          <div className="flex mb-10 w-full justify-center px-6 max-w-screen-sm">
            <input
              className="h-10 w-full outline-none px-3 rounded-tl-lg rounded-bl-lg"
              placeholder="Enter your Axon address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button
              className={`flex flex-col w-24 h-10 justify-center items-center px-3 border-2 border-white bg-axon-theme hover:bg-opacity-70 ${
                claiming ? 'cursor-not-allowed bg-opacity-70' : 'cursor-pointer'
              }`}
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <BeatLoader color="#1E2430" size={10} />
              ) : (
                <span className="text-gray-800 font-semibold">Claim</span>
              )}
            </Button>
          </div>
          <div className="mb-16">
            <span>
              There are{' '}
              {totalBalanceData ? formatValue(totalBalanceData.total) : '-.--'}{' '}
              Token(s) left in Axon Faucet
            </span>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 mt-10 max-w-screen-md">
          <h2 className="text-3xl text-gray-800 font-semibold mb-6">Claims</h2>
          <div>
            {transactions.map((tx: ITransaction) => {
              const date = new Date(tx.time);
              return (
                <div className="relative " key={tx._id}>
                  <div className="absolute -bottom-1 -left-1 bg-axon-theme border border-gray-400 w-full h-full -z-10" />
                  <div className="flex flex-col p-6 mb-8 bg-white border border-gray-400 z-30">
                    <div className="flex flex-col sm:flex-row justify-between pb-2 border-b border-gray-200">
                      <span>{getAbbreviation(tx.from, 12, 20)}</span>
                      <span className="text-gray-600">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex flex-row justify-between pt-2">
                      <span>TO: {getAbbreviation(tx.to, 12, 10)}</span>
                      <span>
                        {formatValue(parseInt(tx.value, 10))} Token(s)
                      </span>
                    </div>
                    <div className="mt-4">
                      <Badge
                        status={tx.status}
                        text={TransactionStatus[tx.status]}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
