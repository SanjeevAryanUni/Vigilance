export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-2 border-t-cyan-400 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs font-semibold tracking-widest text-cyan-400 uppercase">
            VIGILANCE
          </span>
          <span className="text-[11px] font-mono text-slate-500 animate-pulse">
            Loading WebGIS Telemetry Pipeline...
          </span>
        </div>
      </div>
    </div>
  );
}
