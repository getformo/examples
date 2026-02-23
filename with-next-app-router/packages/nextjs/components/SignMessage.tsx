import * as React from "react";
import { recoverMessageAddress } from "viem";
import { useSignMessage } from "wagmi";

export function SignMessage() {
  const [recoveredAddress, setRecoveredAddress] = React.useState<string>();
  const [message, setMessage] = React.useState<string>("");
  const { data: signature, error, status, signMessage } = useSignMessage();

  React.useEffect(() => {
    const recoverAddress = async () => {
      if (signature && message) {
        try {
          const recovered = await recoverMessageAddress({
            message: message,
            signature: signature,
          });
          setRecoveredAddress(recovered);
        } catch (err) {
          console.error("Error recovering address:", err);
        }
      }
    };

    recoverAddress();
  }, [signature, message]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const messageText = formData.get("message") as string;
    if (messageText) {
      setMessage(messageText);
      try {
        await signMessage({ message: messageText });
      } catch (err) {
        console.error("Error signing message:", err);
      }
    }
  };

  const isPending = status === "pending";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="font-medium">
          Enter a message to sign
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="The quick brown fox…"
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Check Wallet" : "Sign Message"}
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
