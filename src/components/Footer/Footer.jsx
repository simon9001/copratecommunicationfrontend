import { useLocation } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-copyright">
          © 2025 Kenya National Highways Authority. All rights reserved.
        </span>
      </div>

      <div className="footer-center">
        <span className="footer-hint">
          Click on a glowing point on the map to explore a project
        </span>
      </div>

      <div className="footer-right">
        <span className="footer-motto">Built for a Better Connected Kenya 🇰🇪</span>
      </div>
    </footer>
  );
}
