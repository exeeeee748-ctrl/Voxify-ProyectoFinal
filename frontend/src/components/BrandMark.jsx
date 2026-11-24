import React from 'react';

export function BrandMark({ playing = true, compact = false }) {
  return (
    <div className="brand-lockup">
      <div className="brand-icon" aria-hidden="true">
        <span className={`eq-bar ${playing ? '' : 'paused'}`} />
        <span className={`eq-bar ${playing ? '' : 'paused'}`} />
        <span className={`eq-bar ${playing ? '' : 'paused'}`} />
        <span className={`eq-bar ${playing ? '' : 'paused'}`} />
        <span className={`eq-bar ${playing ? '' : 'paused'}`} />
      </div>
      <div>
        <div className="brand-title">VOXIFY</div>
        {!compact && <div className="brand-subtitle">Kitten TTS 2 · Voz Neural</div>}
      </div>
    </div>
  );
}

export function ProviderIcon({ providerId, size = 22 }) {
  const id = (providerId || '').toLowerCase();

  if (id === 'twitch') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.2 2L2 5.9V20.5H7.2V23L9.9 20.5H13.9L22 12.6V2H4.2ZM20 11.7L16.6 15.1H12.2L9.3 17.9V15.1H5.5V4H20V11.7Z"
          fill="#C084FC"
        />
        <rect x="15.2" y="6.8" width="2" height="5.4" rx="0.6" fill="#E9D5FF" />
        <rect x="10.4" y="6.8" width="2" height="5.4" rx="0.6" fill="#E9D5FF" />
      </svg>
    );
  }

  if (id === 'microsoft') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="8.7" height="8.7" rx="1.2" fill="#F25022" />
        <rect x="12.8" y="2.5" width="8.7" height="8.7" rx="1.2" fill="#7FBA00" />
        <rect x="2.5" y="12.8" width="8.7" height="8.7" rx="1.2" fill="#00A4EF" />
        <rect x="12.8" y="12.8" width="8.7" height="8.7" rx="1.2" fill="#FFB900" />
      </svg>
    );
  }

  if (id === 'tiktok') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15.2 2.2h2.7c.2 1.9 1.4 3.3 3.3 3.6v2.7c-1.3 0-2.5-.4-3.3-1.1v6.3c0 3.1-2.5 5.5-5.6 5.5S6.7 16.7 6.7 13.7 9.2 8.2 12.3 8.2c.3 0 .6 0 .9.1V11c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5V2.2z"
          fill="#25F4EE"
          opacity="0.9"
        />
        <path
          d="M14.4 1.5h2.7c.2 1.9 1.4 3.3 3.3 3.6v2.7c-1.3 0-2.5-.4-3.3-1.1v6.3c0 3.1-2.5 5.5-5.6 5.5S5.9 16 5.9 13s2.5-5.5 5.6-5.5c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5V1.5z"
          fill="#FE2C55"
          opacity="0.85"
        />
        <path
          d="M13.7 0.8h2.7c.2 1.9 1.4 3.3 3.3 3.6v2.7c-1.3 0-2.5-.4-3.3-1.1v6.3c0 3.1-2.5 5.5-5.6 5.5S5.2 15.3 5.2 12.3 7.7 6.8 10.8 6.8c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5V0.8z"
          fill="#FFFFFF"
          opacity="0.92"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#22D3EE" strokeWidth="2" />
      <path d="M9 12H15M12 9V15" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
