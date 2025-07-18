import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import PositionTableRow from "./PositionTableRow";
import { useAssets } from "@/contexts/AssetsContext";
import { useChainId } from "wagmi";

export default function StrategiesTableComponent() {
  const chainId = useChainId();
  const [sortKey, setSortKey] = useState<"amount" | null>("amount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { positionsQuery } = useAssets();
  const { data: positions, isError, error } = positionsQuery;

  const sortedData = positions
    ? [...positions]
        .filter(
          (position) =>
            position.status === "true" && position.chainId === chainId
        )
        .sort((a, b) => {
          if (!sortKey) return 0;
          return sortDirection === "asc"
            ? a[sortKey] - b[sortKey]
            : b[sortKey] - a[sortKey];
        })
    : [];

  const handleSort = () => {
    if (sortKey === "amount") {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey("amount");
      setSortDirection("desc");
    }
  };

  useEffect(() => {
    if (isError) {
      toast.error("Error fetching positions");
    }
  }, [isError, error]);

  return (
    <div className="mx-4 w-[calc(100%-2rem)]">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-sm font-semibold text-gray-500">
            <th className="w-[20%] text-left px-6 font-medium">Strategy</th>
            <th className="w-[20%] text-right px-4 font-medium">Asset</th>
            <th
              className="w-[20%] text-right px-4 font-medium cursor-pointer"
              onClick={handleSort}
            >
              <div className="flex items-center justify-end">
                Amount
                {sortKey === "amount" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="w-[20%] text-right px-4 font-medium">Profit</th>
            <th className="w-[20%] text-right px-6 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((position, index) => (
            <PositionTableRow
              key={`${position.strategy}-${position.tokenName}-${index}`}
              position={position}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
