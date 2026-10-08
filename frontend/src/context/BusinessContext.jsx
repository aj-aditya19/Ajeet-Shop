import { createContext, useContext, useEffect, useState } from 'react';
import { getBusiness } from '../services/serviceApi';

// Fallback shown until the API answers (the API is the source of truth for contact details).
const FALLBACK = {
  name: 'Ajeet Digital Services', cateringName: 'Ajeet Catering Services', owner: 'Ajeet Kumar Jaiswal',
  address: ['Front of Tons Food Park', 'Nanda Ki Chowki', 'Sudhowala', 'Dehradun', 'Uttarakhand - 248007'],
  whatsapp: '9458344385', phones: ['9458344385', '7456067529'], email: 'ajeetjayswal71@gmail.com',
  whatsappLink: 'https://wa.me/919458344385', mapsUrl: '', limits: { maxFileSizeMb: 10, maxFiles: 5 },
};
const BusinessContext = createContext(FALLBACK);
export const useBusiness = () => useContext(BusinessContext);

export function BusinessProvider({ children }) {
  const [biz, setBiz] = useState(FALLBACK);
  useEffect(() => { getBusiness().then((b) => setBiz({ ...FALLBACK, ...b })).catch(() => {}); }, []);
  return <BusinessContext.Provider value={biz}>{children}</BusinessContext.Provider>;
}
