import Script from "next/script";

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === 'production' 
    ? 'https://dynavest.xyz' 
    : 'http://localhost:3000';

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DynaVest",
    description: "AI-powered DeFi investment platform making sophisticated DeFi strategies accessible to everyone",
    url: baseUrl,
    logo: "https://framerusercontent.com/images/7deg2TItLWZigrN1ZkirE44PXak.png",
    foundingDate: "2024",
    industry: "Financial Technology",
    sameAs: [
      "https://x.com/dynavest_ai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      url: baseUrl
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DynaVest",
    description: "AI-powered DeFi investment platform",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/strategies?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DynaVest",
    description: "AI-powered DeFi investment platform making sophisticated DeFi strategies accessible to everyone",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    url: baseUrl,
    provider: {
      "@type": "Organization",
      name: "DynaVest Team"
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free"
    },
    featureList: [
      "AI-Powered Chat Interface",
      "Multi-Chain Support (Arbitrum, Base, BSC, Celo, Polygon, Flow)",
      "Risk Management",
      "Smart Wallet Integration",
      "Diverse DeFi Strategies",
      "Real-time Portfolio Tracking",
      "Strategy Automation"
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is DynaVest?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DynaVest is an AI-powered DeFi investment platform that serves as your personal DeFAI Agent, designed to execute, optimize, and adapt DeFi strategies based on your unique risk profile."
        }
      },
      {
        "@type": "Question",
        name: "Which blockchains does DynaVest support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DynaVest supports multiple blockchains including Arbitrum, Base, BSC, Celo, Polygon, and Flow, allowing you to deploy strategies across different networks."
        }
      },
      {
        "@type": "Question",
        name: "What DeFi strategies are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DynaVest offers various DeFi strategies including AAVE lending, Morpho supply, Uniswap liquidity provision, liquid staking, and automated multi-strategy portfolios."
        }
      },
      {
        "@type": "Question",
        name: "Is DynaVest secure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DynaVest integrates with trusted protocols like Privy and ZeroDev for smart wallet management, and all strategies interact with audited DeFi protocols. However, DeFi investments carry inherent risks."
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  );
}