import { useEffect } from 'react';

const SEO = ({ 
  title = 'EStore - Your Trusted Online Shopping Destination',
  description = 'Shop quality products at great prices. Fast shipping, secure checkout, and excellent customer service.',
  keywords = 'ecommerce, online shopping, products, deals, shop',
}) => {
  const siteTitle = 'EStore';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update or create meta tags
    const setMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    
    // Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', 'website', true);
    
    // Twitter tags
    setMetaTag('twitter:title', fullTitle, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:card', 'summary_large_image', true);
    
  }, [fullTitle, description, keywords]);

  return null;
};

export default SEO;
