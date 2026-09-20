'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function PaystackReturnClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref') || '';
    if (!reference) {
      setMessage('Missing payment reference.');
      return;
    }

    let active = true;
    api.post('/payments/paystack/verify', { reference }).then(({ data }) => {
      if (!active) return;
      setMessage('Payment confirmed. Redirecting...');
      toast.success('Payment verified.');
      router.replace('/orders/' + data.order.id);
    }).catch((err) => {
      if (!active) return;
      setMessage(err.response?.data?.error || 'Unable to verify payment.');
      toast.error(err.response?.data?.error || 'Unable to verify payment.');
    });

    return () => { active = false; };
  }, [params, router]);

  return <p className='mt-4 text-slate'>{message}</p>;
}
