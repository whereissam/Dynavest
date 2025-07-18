import Image from "next/image";
import { useChainId } from "wagmi";

import { useTransaction, type GetTransactionResponse } from "./useTransaction";
import { getStrategyMetadata } from "@/utils/strategies";
import { Strategy } from "@/types/strategies";
import { getChain } from "@/constants/chains";

const initialTransactions: GetTransactionResponse[] = [];

export default function TransactionsTableComponent() {
  const { transactions: txs } = useTransaction();
  const chainId = useChainId();
  const { data: transactions = initialTransactions } = txs;
  const chain = getChain(chainId);

  const filteredTransactions = transactions.filter(
    (transaction) => transaction.chain_id === chainId
  );

  return (
    <div className="mx-4 w-[calc(100%-2rem)] h-[410px] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="w-full">
          <div className="flex text-sm font-semibold text-gray-500">
            <div className="w-[20%] text-left px-6 font-medium">Date</div>
            <div className="w-[30%] text-left px-4 font-medium">Strategy</div>
            <div className="w-[20%] text-left px-4 font-medium">Type</div>
            <div className="w-[30%] text-left px-6 font-medium">Amount</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="w-[100%] flex-1 overflow-y-auto px-3 py-1">
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              onClick={() =>
                window.open(
                  ` ${chain?.blockExplorers.default.url}/tx/${transaction.hash}`,
                  "_blank"
                )
              }
              key={`${transaction.transaction_id}`}
              className="bg-white rounded-xl shadow-[0_0_0_0.2px_#3d84ff,_0px_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1.5px_#3d84ff,_0px_4px_12px_rgba(0,0,0,0.15)] transition-all cursor-pointer"
            >
              <div className="flex justify-center items-center w-full">
                {/* Date */}
                <div className="w-[20%] p-4">
                  <div className="font-medium text-md">
                    {transaction.created_at}
                  </div>
                </div>

                {/* Strategy */}
                <div className="w-[30%] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={
                          getStrategyMetadata(
                            transaction.strategy as Strategy,
                            transaction.chain_id
                          ).protocol.icon
                        }
                        alt={"crypto-icons/protocol/aave.svg"}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-bold">{transaction.strategy}</div>
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div className="w-[20%] p-4">
                  <div className="font-medium text-md">Lending</div>
                </div>

                {/* Amount */}
                <div className="w-[30%] p-4">
                  <div className="font-medium text-md">
                    {transaction.amount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
