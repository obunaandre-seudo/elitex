import { Suspense } from 'react';
import PaystackReturnClient from './PaystackReturnClient';

export default function PaystackReturnPage() {
  return (
    <main className='mx-auto max-w-2xl px-6 py-24 text-center'>
      <h1 className='font-display text-3xl text-ivory'>Paystack Payment</h1>
      <Suspense fallback={<p className='mt-4 text-slate'>Verifying payment...</p>}>
        <PaystackReturnClient />
      </Suspense>
    </main>
  );
}
