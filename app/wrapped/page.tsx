import { redirect } from 'next/navigation';

export default function WrappedPage() {
  redirect('/home');
}
