import './globals.css';

export const metadata = {
  title: 'Cào tên ở quán trà',
  description: 'Cào phiếu để gọi tên ngẫu nhiên.',
};

export const viewport = { themeColor: '#183c35' };

export default function RootLayout({ children }) {
  return <html lang="vi"><body>{children}</body></html>;
}
