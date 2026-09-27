export const SITE_URL = 'https://kingdragonhub.com';
export const SITE_NAME = 'KING DRAGON HUB';
export const SITE_LOGO_URL = `${SITE_URL}/logo.png`;

export interface ImageObjectSchema {
  '@type': 'ImageObject';
  '@id'?: string;
  url: string;
  contentUrl?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface OrganizationSchema {
  '@context'?: string;
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
  logo: ImageObjectSchema;
  image?: string;
  description?: string;
  sameAs?: string[];
}

export const getSiteLogoSchema = (): ImageObjectSchema => ({
  '@type': 'ImageObject',
  '@id': `${SITE_URL}/#logo`,
  url: SITE_LOGO_URL,
  contentUrl: SITE_LOGO_URL,
  caption: `${SITE_NAME} Logo`,
  width: 539,
  height: 539,
});

export const getOrganizationSchema = (): OrganizationSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: getSiteLogoSchema(),
  image: SITE_LOGO_URL,
  description: 'Tri thức thực chiến về AI, STEM và Công nghệ Giáo dục.',
  sameAs: [
    'https://github.com/quanpl86',
    'https://www.facebook.com/plquan.86/',
    'https://www.linkedin.com/in/long-qu%C3%A2n-phan-6a9388125/',
    'https://www.youtube.com/@Qu%C3%A2nPhanLong',
  ],
});

export const getPublisherSchema = (): {
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
  logo: ImageObjectSchema;
} => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: getSiteLogoSchema(),
});
