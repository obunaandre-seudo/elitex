'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

async function loadCart() {
  return (await api.get('/cart')).data.items as any[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: loadCart });
  const subtotal = (cart ?? []).reduce((sum, item) => sum + (Number(item.product.sellingPrice) + Number(item.variant?.priceDelta ?? 0)) * item.quantity, 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const address = {
      fullName: String(form.get('fullName') || ''),
      line1: String(form.get('line1') || ''),
      line2: String(form.get('line2') || ''),
      city: String(form.get('city') || ''),
      state: String(form.get('state') || ''),
      postalCode: String(form.get('postalCode') || ''),
      country: String(form.get('country') || ''),
      phone: String(form.get('phone') || ''),
    };
    const paymentProvider = String(form.get('paymentProvider') || 'STRIPE');
    try {
      const addrRes = await api.post('/addresses', address).catch(() => null);
      const addressId = addrRes?.data?.address?.id;
      const { data } = await api.post('/orders', { addressId, paymentProvider });
      if (data.paymentSession?.redirectUrl) {
        window.location.href = data.paymentSession.redirectUrl;
        return;
      }
      router.push('/orders/' + data.order.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not place your order.');
    }
  }

  return (
    <main className='mx-auto max-w-2xl px-6 py-16'>
      <h1 className='font-display text-4xl text-ivory'>Checkout</h1>
      <p className='mt-2 text-slate'>Total: {subtotal}</p>
      <form onSubmit={submit} className='mt-8 space-y-3'>
        <input className='input-elite w-full' name='fullName' placeholder='Full name' />
        <input className='input-elite w-full' name='line1' placeholder='Address line 1' />
        <input className='input-elite w-full' name='line2' placeholder='Address line 2' />
        <input className='input-elite w-full' name='city' placeholder='City' />
        <input className='input-elite w-full' name='state' placeholder='State' />
        <input className='input-elite w-full' name='postalCode' placeholder='Postal code' />
        <input className='input-elite w-full' name='country' placeholder='Country' />
        <input className='input-elite w-full' name='phone' placeholder='Phone' />
        <select className='input-elite w-full' name='paymentProvider' defaultValue='STRIPE'>
          <option value='STRIPE'>Card (Stripe)</option>
          <option value='PAYPAL'>PayPal</option>
          <option value='PAYSTACK'>Paystack</option>
          <option value='FLUTTERWAVE'>Flutterwave</option>
        </select>
        <button type='submit' className='btn-gold w-full'>Place Order</button>
      </form>
    </main>
  );
}
