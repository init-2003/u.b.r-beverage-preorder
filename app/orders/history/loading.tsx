import AccountLayout from '@/components/AccountLayout';
import { WineLoading } from '@/components/WineLoading';

export default function OrdersHistoryLoading() {
  return (
    <AccountLayout activeItemOverride="orders">
      <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
        <WineLoading size="md" />
      </div>
    </AccountLayout>
  );
}
