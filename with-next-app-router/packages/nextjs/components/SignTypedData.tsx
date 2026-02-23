import * as React from "react";
import { recoverTypedDataAddress } from "viem";
import { useSignTypedData } from "wagmi";

export function SignTypedData() {
  const [recoveredAddress, setRecoveredAddress] = React.useState<string>();
  const [messageContent, setMessageContent] = React.useState("");

  // Memoize the domain object
  const domain = React.useMemo(
    () =>
      ({
        name: "Example DApp",
        version: "1",
        chainId: 84532,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      } as const),
    [],
  );

  // Memoize the types object
  const types = React.useMemo(
    () =>
      ({
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "content", type: "string" },
        ],
      } as const),
    [],
  );

  const message = React.useMemo(
    () => ({
      from: {
        name: "Alice",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      content: messageContent,
    }),
    [messageContent],
  );

  const { data: signature, error, status, signTypedData } = useSignTypedData();

  React.useEffect(() => {
    const recoverAddress = async () => {
      if (signature && message.content) {
        try {
          const recovered = await recoverTypedDataAddress({
            domain,
            types,
            message,
            signature,
            primaryType: "Mail",
          });
          setRecoveredAddress(recovered);
        } catch (err) {
          console.error("Error recovering address:", err);
        }
      }
    };

    recoverAddress();
  }, [signature, message.content, domain, types, message]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const content = formData.get("content") as string;
    if (content) {
      setMessageContent(content);
      try {
        await signTypedData({
          domain,
          types,
          primaryType: "Mail",
          message: {
            ...message,
            content,
          },
        });
      } catch (err) {
        console.error("Error signing typed data:", err);
      }
    }
  };

  const isPending = status === "pending";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="content" className="font-medium">
          Enter a message to sign typed data
        </label>
        <textarea
          id="content"
          name="content"
          placeholder="Hello Bob!"
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Check Wallet" : "Sign Typed Data"}
      </button>

      {signature && (
        <div className="mt-4 space-y-2">
          <div className="break-all">
            <span className="font-medium">Recovered Address:</span> {recoveredAddress}
          </div>
          <div className="break-all">
            <span className="font-medium">Signature:</span> {signature}
          </div>
        </div>
      )}

      {error && <div className="p-4 mt-4 text-red-700 bg-red-100 rounded-md">{error.message}</div>}
    </form>
  );
}
