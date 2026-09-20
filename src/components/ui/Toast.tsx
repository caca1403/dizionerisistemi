import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="sera-toast" role="status"><CheckCircle2 size={17}/><span>{message}</span></div>;
}
