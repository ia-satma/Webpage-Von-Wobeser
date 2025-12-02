interface JsonLdSchemaProps {
  language: "es" | "en";
}

export default function JsonLdSchema({ language }: JsonLdSchemaProps) {
  const description = language === "es"
    ? "Von Wobeser y Sierra, S.C. es una firma de abogados líder en México, especializada en servicios legales corporativos, litigio, arbitraje, derecho fiscal, fusiones y adquisiciones, y más."
    : "Von Wobeser y Sierra, S.C. is a leading law firm in Mexico, specializing in corporate legal services, litigation, arbitration, tax law, mergers and acquisitions, and more.";

  const schema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": "Von Wobeser y Sierra, S.C.",
    "url": "https://www.vonwobeser.com",
    "logo": "https://vonwobeser.com/images/vonwobeser_2025.png",
    "image": "https://vonwobeser.com/images/vonwobeser_2025.png",
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Torre SOMA Chapultepec Piso 18, Campos Elíseos 204",
      "addressLocality": "Polanco",
      "postalCode": "11560",
      "addressRegion": "Ciudad de México",
      "addressCountry": "MX"
    },
    "telephone": "+52 55 5258 1000",
    "email": "info@vonwobeser.com",
    "areaServed": {
      "@type": "Country",
      "name": "Mexico"
    },
    "priceRange": "$$$",
    "openingHours": "Mo-Fr 09:00-18:00",
    "sameAs": [
      "https://www.linkedin.com/company/von-wobeser-y-sierra"
    ],
    "knowsAbout": [
      "Corporate Law",
      "Litigation",
      "Arbitration",
      "Tax Law",
      "Mergers and Acquisitions",
      "Banking and Finance",
      "Real Estate",
      "Intellectual Property",
      "Labor Law",
      "Environmental Law"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
