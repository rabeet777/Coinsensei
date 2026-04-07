import Icon from '@/components/ui/Icon';
import { TRUST_ITEMS } from '@/lib/constants';

export default function TrustStrip() {
  return (
    <div className="bg-[--color-surface-mid] border-y border-[--color-border] py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon name={item.icon} filled size={20} />
              </div>
              <div>
                <div className="font-[family-name:var(--font-manrope)] font-bold text-sm text-[--color-text-pri] leading-tight">
                  {item.title}
                </div>
                <div className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
