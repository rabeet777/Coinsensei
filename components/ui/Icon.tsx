// Google Material Symbols wrapper
interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}

export default function Icon({ name, filled = false, className = '', size = 24 }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: size,
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      {name}
    </span>
  );
}
