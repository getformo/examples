import TransactionComp from "../_components/TransactionComp";
import { Hash } from "viem";
import { isZeroAddress } from "~~/utils/scaffold-eth/common";

type PageProps = {
  params: Promise<{ txHash?: Hash }>;
};

export function generateStaticParams() {
  // An workaround to enable static exports in Next.js, generating single dummy page.
  return [{ txHash: "0x0000000000000000000000000000000000000000" }];
}
const TransactionPage = async ({ params }: PageProps) => {
  const { txHash } = await params;

  if (isZeroAddress(txHash as Hash)) return null;

  return <TransactionComp txHash={txHash as Hash} />;
};

export default TransactionPage;
