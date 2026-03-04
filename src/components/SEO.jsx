import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SEO = ({ 
  title,
  description = 'Shop quality products at great prices. Fast shipping, secure checkout, and excellent customer service.',
  keywords = 'ecommerce, online shopping, products, deals, shop',
  canonicalPath,
  ogType = 'website',
  ogImage,
  structuredData,
}) => {
  const { settings } = useSettings();
  const siteName = settings.siteName || 'EStore';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Your Trusted Online Shopping Destination`;

  useEffect(() => {
    document.title = fullTitle;
    
    const setMetaTag = (name, content, property = false) => {
      if (!content) return;
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', siteName, true);
    if (ogImage) {
      const absoluteImage = ogImage.startsWith('http') || ogImage.startsWith('data:') ? ogImage : `${window.location.origin}${ogImage}`;
      setMetaTag('og:image', absoluteImage, true);
      setMetaTag('twitter:image', absoluteImage);
    }
    
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:card', 'summary_large_image');

    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${window.location.origin}${canonicalPath}`);
    }

    if (structuredData) {
      let script = document.querySelector('script[data-seo="structured-data"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-seo', 'structured-data');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);

      return () => {
        script.remove();
      };
    }
  }, [fullTitle, description, keywords, canonicalPath, ogType, ogImage, siteName, structuredData]);

  return null;
};

export default SEO;
