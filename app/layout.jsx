import '@fontsource-variable/baloo-2';
import './globals.css';
import './taste-motion.css';
import SiteFooter from './site-footer';

export const metadata = {
  title: 'Cào tên ở quán trà',
  description: 'Cào phiếu để gọi tên ngẫu nhiên.',
  other: { 'page-type': 'software', 'site-kind': 'gaming' },
};

export const viewport = { themeColor: '#183c35' };

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-type="software" data-motion="on">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
