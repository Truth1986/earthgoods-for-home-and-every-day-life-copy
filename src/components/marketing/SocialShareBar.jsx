import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link2, Check, Share2 } from "lucide-react";

const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 4l11.733 16H20L8.267 4zm0 16 6.535-6.535M20 4l-6.535 6.535"/>
  </svg>
);

const PinterestIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.566 0-2.387-1.715-4.057-4.163-4.057-2.836 0-4.5 2.127-4.5 4.326 0 .856.33 1.774.741 2.276a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.522 0 10-4.477 10-10S17.522 2 12 2z"/>
  </svg>
);

export default function SocialShareBar({ url, title, description, imageUrl, compact = false }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = encodeURIComponent(url || window.location.href);
  const shareTitle = encodeURIComponent(title || document.title);
  const shareDesc = encodeURIComponent(description || '');

  const links = [
    {
      label: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      label: 'X (Twitter)',
      color: 'bg-stone-800 hover:bg-stone-900',
      icon: <TwitterIcon />,
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    },
    {
      label: 'Pinterest',
      color: 'bg-red-600 hover:bg-red-700',
      icon: <PinterestIcon />,
      href: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareDesc}${imageUrl ? `&media=${encodeURIComponent(imageUrl)}` : ''}`,
    },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500 flex items-center gap-1">
          <Share2 className="w-4 h-4" /> Share:
        </span>
        {links.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className={`w-8 h-8 rounded-full ${l.color} text-white flex items-center justify-center transition-transform hover:scale-110`}
            title={`Share on ${l.label}`}>
            {l.icon}
          </a>
        ))}
        <button onClick={copyLink}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-transform hover:scale-110"
          title="Copy link">
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-stone-50 to-emerald-50 rounded-2xl p-6 border border-stone-200">
      <p className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
        <Share2 className="w-4 h-4 text-emerald-600" />
        Share with your community
      </p>
      <div className="flex flex-wrap gap-3">
        {links.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${l.color} text-white text-sm font-medium transition-transform hover:scale-105`}>
            {l.icon}
            {l.label}
          </a>
        ))}
        <button onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-stone-700 text-sm font-medium hover:border-emerald-300 transition-all">
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}