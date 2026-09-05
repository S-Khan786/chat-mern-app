const AuthHero = ({ eyebrow, title, blurb }) => (
  <div className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,#152a35_0%,#0d1b24_60%,#0a141c_100%)] p-10 lg:flex">
    <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,128,108,.24),transparent_70%)]" />
    <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(85,216,189,.18),transparent_70%)]" />

    <div className="relative">
      <div className="brand-mark mb-8 h-11 w-11 rounded-2xl text-lg">C</div>
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-violet-300">{eyebrow}</p>
      <h2 className="font-display mt-3 max-w-sm text-3xl font-bold leading-tight text-white">{title}</h2>
      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">{blurb}</p>
    </div>

    {/* Abstract conversation graphic — deliberately illustrative, not a stock photo */}
    <svg
      viewBox="0 0 360 260"
      fill="none"
      className="relative mx-auto w-full max-w-sm"
      aria-hidden="true"
    >
      <rect x="18" y="18" width="210" height="86" rx="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
      <rect x="40" y="42" width="130" height="10" rx="5" fill="rgba(255,255,255,0.22)" />
      <rect x="40" y="60" width="90" height="10" rx="5" fill="rgba(255,255,255,0.12)" />
      <rect x="120" y="130" width="222" height="96" rx="24" fill="url(#authGrad)" />
      <rect x="146" y="156" width="150" height="10" rx="5" fill="rgba(36,16,20,0.55)" />
      <rect x="146" y="176" width="104" height="10" rx="5" fill="rgba(36,16,20,0.32)" />
      <circle cx="300" cy="70" r="26" fill="rgba(85,216,189,0.22)" stroke="rgba(85,216,189,0.4)" />
      <circle cx="46" cy="176" r="16" fill="rgba(255,173,155,0.3)" stroke="rgba(255,173,155,0.45)" />
      <defs>
        <linearGradient id="authGrad" x1="120" y1="130" x2="342" y2="226" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffad9b" />
          <stop offset="1" stopColor="#df5e69" />
        </linearGradient>
      </defs>
    </svg>

    <div className="relative flex items-center gap-6 text-xs text-slate-500">
      <span>Group chats</span>
      <span className="h-1 w-1 rounded-full bg-slate-600" />
      <span>Live typing</span>
      <span className="h-1 w-1 rounded-full bg-slate-600" />
      <span>Read receipts</span>
    </div>
  </div>
);

export default AuthHero;
