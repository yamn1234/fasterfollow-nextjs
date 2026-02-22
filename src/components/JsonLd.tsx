import { useEffect } from 'react';

interface OrganizationSchema {
  type: 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone?: string;
    contactType: string;
    availableLanguage: string[];
  };
}

interface ProductSchema {
  type: 'Product';
  name: string;
  description: string;
  image?: string;
  brand?: string;
  sku?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface ArticleSchema {
  type: 'Article' | 'BlogPosting';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  publisher?: string;
  url: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList';
  items: BreadcrumbItem[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchema {
  type: 'FAQPage';
  items: FAQItem[];
}

interface WebSiteSchema {
  type: 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    query: string;
  };
}

type SchemaData = 
  | OrganizationSchema 
  | ProductSchema 
  | ArticleSchema 
  | BreadcrumbSchema 
  | FAQSchema
  | WebSiteSchema;

interface JsonLdProps {
  data: SchemaData | SchemaData[];
}

const BASE_URL = 'https://fasterfollow.net';
const SITE_NAME = 'فاستر فولو';
const DEFAULT_LOGO = 'https://storage.googleapis.com/gpt-engineer-file-uploads/VkyjaS5ujxUlvnMyASXBvxQSAzZ2/uploads/1767909148798-IMG_0001.webp';

const buildSchema = (data: SchemaData): object => {
  switch (data.type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name,
        url: data.url,
        logo: data.logo || DEFAULT_LOGO,
        description: data.description,
        sameAs: data.sameAs || [],
        ...(data.contactPoint && {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: data.contactPoint.telephone,
            contactType: data.contactPoint.contactType,
            availableLanguage: data.contactPoint.availableLanguage,
          },
        }),
      };

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.image,
        brand: data.brand ? { '@type': 'Brand', name: data.brand } : undefined,
        sku: data.sku,
        url: data.url,
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: data.priceCurrency || 'USD',
          availability: `https://schema.org/${data.availability || 'InStock'}`,
          url: data.url,
        },
        ...(data.aggregateRating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: data.aggregateRating.ratingValue,
            reviewCount: data.aggregateRating.reviewCount,
          },
        }),
      };

    case 'Article':
    case 'BlogPosting':
      return {
        '@context': 'https://schema.org',
        '@type': data.type,
        headline: data.headline,
        description: data.description,
        image: data.image,
        datePublished: data.datePublished,
        dateModified: data.dateModified || data.datePublished,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        publisher: {
          '@type': 'Organization',
          name: data.publisher || SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_LOGO,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url,
        },
      };

    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
        })),
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      };

    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: data.name,
        url: data.url,
        ...(data.potentialAction && {
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${data.url}/services?search={${data.potentialAction.query}}`,
            },
            'query-input': `required name=${data.potentialAction.query}`,
          },
        }),
      };

    default:
      return {};
  }
};

export const JsonLd = ({ data }: JsonLdProps) => {
  useEffect(() => {
    // Remove existing JSON-LD scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-seo]');
    existingScripts.forEach((script) => script.remove());

    // Build and inject new JSON-LD
    const schemas = Array.isArray(data) ? data : [data];
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'true');
      script.setAttribute('data-index', index.toString());
      script.textContent = JSON.stringify(buildSchema(schema));
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"][data-seo]');
      scripts.forEach((script) => script.remove());
    };
  }, [data]);

  return null;
};

// Pre-built schemas for common use cases
export const getOrganizationSchema = (): OrganizationSchema => ({
  type: 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: DEFAULT_LOGO,
  description: 'أفضل موقع لزيادة المتابعين والتفاعل على السوشيال ميديا',
  sameAs: [
    'https://twitter.com/fasterfollow',
    'https://instagram.com/fasterfollow',
  ],
  contactPoint: {
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'English'],
  },
});

export const getWebSiteSchema = (): WebSiteSchema => ({
  type: 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    query: 'search_term',
  },
});

export default JsonLd;
