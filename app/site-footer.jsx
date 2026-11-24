const services = [
  { name: 'Game đua vịt', url: 'https://duavit.mtdigital.vn/' },
  { name: 'BNI Podcast & BNI Power of One tiếng Việt', url: 'https://bnipodcast.mtdigital.vn/' },
  { name: 'Phần mềm chạy nhạc sự kiện', url: 'https://chaynhac.mtdigital.vn/' },
  {
    name: 'Vận Mệnh AI',
    description: 'Thần số học, tử vi, Tarot, lịch vạn sự',
    url: 'https://vanmenhai.online/',
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <img className="footer-brand" src="/mt-digital.webp" alt="MT Digital" width={560} height={107} />
        <nav aria-label="Các hệ thống của MT Digital">
          <ul className="footer-links">
            {services.map(({ name, description, url }) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <span className="footer-link-label">{name}</span>
                  {description && <small>{description}</small>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
