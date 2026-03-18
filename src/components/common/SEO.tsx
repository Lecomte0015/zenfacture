import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({
  title = 'ZenFacture - Facturation simplifiée pour PME suisses',
  description = 'Solution de facturation moderne et conforme aux normes suisses. QR-facture, TVA, multi-devises, gestion clients et bien plus.',
  keywords = 'facturation, suisse, QR-facture, QR-bill, TVA, PME, devis, invoice, facture',
  image = '/og-image.png',
  url = 'https://zenfacture.ch',
  type = 'website'
}: SEOProps) => {
  const siteTitle = title.includes('ZenFacture') ? title : `${title} | ZenFacture`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_CH" />
      <meta property="og:locale:alternate" content="de_CH" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="French, German, English" />
      <meta name="author" content="ZenFacture" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
