import { redirect } from 'next/navigation';

export default async function OrderPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ docNo: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { docNo } = await params;
  const sParams = await searchParams;
  const internalToken = sParams?.internal_token;
  const tokenQuery = internalToken
    ? `?internal_token=${encodeURIComponent(Array.isArray(internalToken) ? internalToken[0] : internalToken)}`
    : '';

  redirect(`/orders/${encodeURIComponent(docNo)}/view-purchase-order${tokenQuery}`);
}
