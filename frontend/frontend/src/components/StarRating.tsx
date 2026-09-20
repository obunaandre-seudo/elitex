import { Star } from 'lucide-react';

export default function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(value) ? 'fill-gold text-gold' : 'fill-transparent text-slate/40'}
        />
      ))}
      {count !== undefined && <span className="ml-1 text-xs text-slate">({count.toLocaleString()})</span>}
    </div>
  );
}
