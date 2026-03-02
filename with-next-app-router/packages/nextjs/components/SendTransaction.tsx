import { Attribution } from "ox/erc8021";
import * as React from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";

export function SendTransaction() {
  const { address } = useAccount();
  const { data: hash, error, isPending, sendTransaction } = useSendTransaction();
  const [builderCode, setBuilderCode] = React.useState("test_builder");
  const dataSuffix = React.useMemo(
    () => (builderCode ? Attribution.toDataSuffix({ codes: [builderCode] }) : undefined),
    [builderCode],
  );

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (address) {
      // useSendTransaction has no dataSuffix param; for this test tx the only calldata
      // is the ERC-8021 suffix, so passing it as data is correct and indexers will parse it.
      sendTransaction({
        to: "0x000000000000000000000000000000000000dEaD",
        value: BigInt(0),
        ...(dataSuffix ? { data: dataSuffix } : {}),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="builderCode" className="font-medium">
          Send Test Transaction (with Builder Code)
        </label>
        <input
          id="builderCode"
          name="builderCode"
          type="text"
          placeholder="test_builder"
          value={builderCode}
          onChange={e => setBuilderCode(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
        <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
          <p className="font-medium">ERC-8021 Builder Code: &quot;{builderCode}&quot;</p>
          <p className="mt-1 break-all text-xs font-mono">dataSuffix: {dataSuffix ?? "—"}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !address}
        className="px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? "Check Wallet" : "Send Test Transaction"}
      </button>

      {hash && (
        <div className="mt-4 space-y-2">
          <div className="break-all">
            <span className="font-medium">Transaction Hash:</span> {hash}
          </div>
          {isConfirming && <div className="text-yellow-600">Waiting for confirmation...</div>}
          {isConfirmed && <div className="text-green-600">Transaction confirmed!</div>}
        </div>
      )}

      {error && <div className="p-4 mt-4 text-red-700 bg-red-100 rounded-md">{error.message}</div>}
    </form>
  );
}
