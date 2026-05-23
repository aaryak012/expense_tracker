import { useRef, useState, useEffect } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export default function Card3D({ children, className = '', intensity = 15, glare = true }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransform({ rotateX, rotateY, scale: 1.02 });
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden cursor-pointer ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transition: transform.scale === 1 ? 'transform 0.5s ease' : 'transform 0.1s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none rounded-inherit z-10"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 60%)`,
            transition: 'opacity 0.3s ease',
            borderRadius: 'inherit',
          }}
        />
      )}
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subvalue?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: string;
  glowColor: string;
}

export function StatCard({ title, value, subvalue, icon, trend, color, glowColor }: StatCardProps) {
  return (
    <Card3D className="rounded-2xl">
      <div
        className="rounded-2xl p-6 border border-white/8 relative"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 0 40px ${glowColor}10`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-xl"
            style={{ background: `${color}20`, border: `1px solid ${color}30` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                trend.value >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}
            >
              <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-slate-400 text-sm">{title}</div>
        {subvalue && <div className="text-xs text-slate-500 mt-1">{subvalue}</div>}
        {/* 3D depth line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
        />
      </div>
    </Card3D>
  );
}
