# 🌍 Earthsimpleliving.com - Simple Living Marketplace

A modern, sustainable marketplace for homesteaders, nature lovers, and anyone seeking affordable essentials for self-sufficient living.

## 🎯 Project Overview

Earth Goods  marketplace that connects:
- **Sellers**: Local producers of homesteading supplies, eco-friendly products, and handmade goods
- **Buyers**: People interested in sustainable living, homesteading, and self-sufficiency

### Key Features

✨ **Product Management**
- Easy product discovery and filtering
- Product images and detailed descriptions
- Wishlist functionality
- New product notifications

🛒 **Shopping Experience**
- Secure checkout with Stripe
- Multiple payment methods
- Order tracking in real-time
- Abandoned cart recovery

💬 **Community**
- Recipe sharing platform
- Community discussions
- Seller ratings and reviews
- Newsletter for updates

📊 **Business Tools**
- Analytics dashboard
- Inventory management
- Order management
- Revenue tracking
- Supplier entitlements

## 🚀 Live Deployment

**Status**: Ready to deploy
- Build: ✅ Tested and optimized
- SEO: ✅ Configured with meta tags and robots.txt
- Security: ✅ Headers configured
- Performance: ✅ Production-ready

### Deploy to Vercel (Recommended - 2 minutes)

```bash
# Option 1: Via Vercel UI (Easiest)
1. Go to https://vercel.com/new
2. Import this GitHub repository
3. Click "Deploy"
4. Done! Get instant URL

# Option 2: CLI
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
# Via Netlify UI
1. Go to https://app.netlify.com/start
2. Connect GitHub
3. Select this repo
4. Build settings auto-detected
5. Deploy
```

## 🔧 Development Setup

### Prerequisites
- Node.js 20.x or 22.x
- npm 11.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/earthgoods-for-home-and-every-day-life-copy.git
cd earthgoods-for-home-and-every-day-life-copy

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Run all checks
npm run lint && npm run typecheck && npm run build
```

## 📁 Project Structure

```
earthgoods/
├── src/
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Checkout.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── CustomerDashboard.jsx
│   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── ui/            # UI library components
│   │   ├── ProductCard.jsx
│   │   ├── CartDrawer.jsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and config
│   ├── api/               # API client setup
│   └── main.jsx           # App entry point
├── base44/
│   └── functions/         # Serverless functions
│       ├── createCheckoutSession/
│       ├── orderConfirmation/
│       └── ...
├── public/                # Static assets
├── dist/                  # Production build (generated)
├── index.html             # SEO-optimized HTML
├── vite.config.js         # Vite configuration
├── netlify.toml           # Netlify configuration
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies and scripts
```

## 🌐 Environment Variables

Create `.env.local` for development:

```env
# Base44 API Configuration
VITE_BASE44_APP_BASE_URL=https://your-base44-instance.com

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_live_your_key_here

# App Configuration
VITE_APP_TITLE=Earth Goods
VITE_APP_DESCRIPTION=Simple Living Marketplace
```

Set these in your hosting platform's dashboard for production.

## 📦 Technology Stack

- **Frontend**: React 18 + Vite
- **UI Framework**: Radix UI + Tailwind CSS
- **Styling**: Tailwind CSS + Class Variance Authority
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack React Query
- **Routing**: React Router
- **Payment**: Stripe
- **Backend**: Base44 Platform
- **Functions**: Deno based serverless

## 🔐 Security

- ✅ Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- ✅ HTTPS enforced
- ✅ Secure checkout with Stripe
- ✅ User authentication via Base44
- ✅ Environment variables protected
- ✅ Referrer policy: strict-origin-when-cross-origin

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Contrast ratios meeting WCAG standards
- Mobile responsive design

## 📱 Responsive Design

- Mobile-first approach
- Tested on all screen sizes
- Touch-friendly UI
- Optimized images

## 🔍 SEO Optimization

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ robots.txt for search engines
- ✅ Sitemap support
- ✅ Semantic HTML

**Submit to search engines after deployment:**
1. Google Search Console: https://search.google.com/search-console
2. Bing Webmaster Tools: https://www.bing.com/webmasters

## 📊 Analytics & Monitoring

The built-in analytics dashboard provides:
- Sales trends
- Customer demographics
- Best sellers report
- Supplier revenue breakdown
- Dropship metrics

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is built on Base44. See LICENSE file for details.

## 🆘 Support & Documentation

- [Base44 Documentation](https://base44.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Stripe Documentation](https://stripe.com/docs)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Seller verification system
- [ ] Advanced analytics
- [ ] Subscription products
- [ ] Multi-language support
- [ ] Advanced search with filters
- [ ] Seller profiles with reviews

## 📮 Contact & Community

- Website: [earthgoods.marketplace](https://earthgoods.marketplace)
- Email: hello@earthgoods.com
- Discord: [Join our community](https://discord.gg/earthgoods)

---

**Built with ❤️ for sustainable living and community-driven commerce**
