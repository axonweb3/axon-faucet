import useSWR from 'swr';
import { fetcher, formatValue, getAbbreviation } from '@/lib/utils';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ITransaction } from '@/models/transaction';
import Badge, { BadgeType } from '@/components/badge';
import { TransactionStatus } from '@/lib/constants';

export default function Home() {
  const { data, error, isLoading } = useSWR('/api/transactions', fetcher);
  const { transactions = [] } = data ?? {};

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
          className="flex flex-col justify-center items-center bg-cover w-full sm:min-h-[60vh]"
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
            <h1 className="font-alfarn-2 text-7xl tracking-wide text-gray-800 text-center">
              Axon Faucet
            </h1>
          </div>
          <div className="flex mt-20 mb-12 w-full justify-center">
            <input
              className="h-10 w-8/12 sm:w-5/12 2xl:w-2/12 outline-none px-3 rounded-tl-lg rounded-bl-lg"
              placeholder="Enter your Axon address"
            />
            <div className="flex flex-col justify-center px-3 border-2 border-white bg-axon-theme hover:bg-opacity-70 cursor-pointer">
              <span>Claim</span>
            </div>
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
