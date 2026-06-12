import { redirect } from 'next/navigation';

/** Root: la home pubblica è l'hub di selezione tornei. */
export default function HomePage() {
  redirect('/hub');
}
