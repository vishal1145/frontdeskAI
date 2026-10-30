import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Support from './pages/Support';
import Login from './pages/Login';
import ClinicPortal from './pages/ClinicPortal';
import AdminPanel from './pages/AdminPanel';
import CreateBusiness from './pages/CreateBusiness';
import FeatureDetail from './pages/FeatureDetail';
import { FEATURE_SLUGS } from './pages/featureContent';
import CustomCursorAndInteractions from './components/CustomCursorAndInteractions';

const VALID_PAGES = ['about', 'privacy', 'terms', 'support', 'login', 'portal', 'admin'];
const HOME_SECTIONS = ['features', 'telephony', 'roi', 'simulator'];

function parseCurrentRoute() {
  if (typeof window === 'undefined') return { page: 'home', section: null };

  // 1. Check pathname first (e.g. /about, /support, /privacy, /terms, /features/<slug>)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const featureMatch = pathname.match(/^features\/([a-z0-9-]+)$/);
  if (featureMatch && FEATURE_SLUGS.includes(featureMatch[1])) {
    return { page: 'feature', section: null, feature: featureMatch[1] };
  }
  if (VALID_PAGES.includes(pathname)) {
    return { page: pathname, section: null };
  }
  // Nested admin route: /admin/create → page id 'admin-create'
  if (pathname === 'admin/create') {
    return { page: 'admin-create', section: null };
  }

  // 2. Check hash fallback (e.g. #about, #/about, #support)
  const hash = window.location.hash.replace(/^#[/]?/, '').toLowerCase();
  if (VALID_PAGES.includes(hash)) {
    return { page: hash, section: null };
  }
  if (HOME_SECTIONS.includes(hash)) {
    return { page: 'home', section: hash };
  }

  return { page: 'home', section: null };
}

function App() {
  const [activePage, setActivePage] = useState(() => parseCurrentRoute().page);
  const [featureSlug, setFeatureSlug] = useState(() => parseCurrentRoute().feature || null);
  const [clinicUser, setClinicUser] = useState(() => {
    try {
      const s = localStorage.getItem('clinic_auth');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  // Super admin session lives in localStorage (set by Login, cleared by AdminPanel logout).
  // Both flows navigate right after, so reading it on each render keeps the navbar in sync.
  const isSuperAdmin = (() => {
    try {
      return !!localStorage.getItem('frontdesk_admin_key');
    } catch {
      return false;
    }
  })();

  // Handle URL pathname/hash changes and browser back/forward buttons (popstate)
  useEffect(() => {
    // If URL contains #home or empty hash, cleanly normalize to root URL
    if (window.location.hash === '#home' || window.location.hash === '#/' || window.location.hash === '#') {
      window.history.replaceState(null, '', window.location.pathname);
    }

    const handleLocationChange = () => {
      const { page, section, feature } = parseCurrentRoute();
      setActivePage(page);
      setFeatureSlug(feature || null);

      if (section && section !== 'home') {
        setTimeout(() => {
          const el = document.getElementById(section);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    // If initial load has a valid section anchor, scroll to it
    const { section } = parseCurrentRoute();
    if (section && section !== 'home') {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handlePageChange = (newPage, sectionId = null) => {
    // Feature detail pages: setActivePage('feature', '<slug>')
    if (newPage === 'feature' && FEATURE_SLUGS.includes(sectionId)) {
      setActivePage('feature');
      setFeatureSlug(sectionId);
      const featureUrl = `/features/${sectionId}`;
      if (window.location.pathname !== featureUrl) {
        window.history.pushState({ page: 'feature', sectionId }, '', featureUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Create New Business page lives under the console: /admin/create
    if (newPage === 'admin-create') {
      setActivePage('admin-create');
      if (window.location.pathname !== '/admin/create') {
        window.history.pushState({ page: 'admin-create' }, '', '/admin/create');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (newPage === 'home' && sectionId === 'home') {
      sectionId = null;
    }
    if (HOME_SECTIONS.includes(newPage)) {
      sectionId = newPage;
      newPage = 'home';
    }

    const page = VALID_PAGES.includes(newPage) ? newPage : 'home';
    setActivePage(page);

    const targetUrl = page === 'home'
      ? (sectionId && sectionId !== 'home' ? `/#${sectionId}` : '/')
      : `/${page}`;

    if (window.location.pathname + window.location.hash !== targetUrl) {
      window.history.pushState({ page, sectionId }, '', targetUrl);
    }

    if (sectionId && sectionId !== 'home') {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-ink flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Toast Notifications Provider */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '16px',
            background: '#0e1b2a',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            padding: '12px 18px',
            boxShadow: '0 20px 40px -15px rgba(14,27,42,0.4)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Interactive Custom Cursor & Lenis Smooth Scroll */}
      <CustomCursorAndInteractions activePage={activePage} />

      {/* Top Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={handlePageChange} 
        clinicUser={clinicUser}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Dynamic Page Content */}
      <main className="flex-1 w-full">
        {activePage === 'home' && <Home setActivePage={handlePageChange} />}
        {activePage === 'about' && <About setActivePage={handlePageChange} />}
        {activePage === 'privacy' && <Privacy setActivePage={handlePageChange} />}
        {activePage === 'terms' && <Terms setActivePage={handlePageChange} />}
        {activePage === 'support' && <Support setActivePage={handlePageChange} />}
        {activePage === 'feature' && featureSlug && (
          <FeatureDetail key={featureSlug} slug={featureSlug} setActivePage={handlePageChange} />
        )}
        {activePage === 'login' && (
          <Login 
            setActivePage={handlePageChange} 
            onLoginSuccess={(c) => setClinicUser(c)} 
          />
        )}
        {activePage === 'portal' && (
          <ClinicPortal 
            setActivePage={handlePageChange} 
            clinicUser={clinicUser} 
            onLogout={() => setClinicUser(null)} 
          />
        )}
        {activePage === 'admin-create' && (
          <CreateBusiness setActivePage={handlePageChange} />
        )}
        {activePage === 'admin' && (
          <AdminPanel 
            setActivePage={handlePageChange}
            onLoginAsClinic={(clinic) => {
              setClinicUser(clinic);
              localStorage.setItem('clinic_auth', JSON.stringify(clinic));
              handlePageChange('portal');
            }}
          />
        )}
      </main>

      {/* Global Footer - Hidden on Login, ClinicPortal, and AdminPanel pages */}
      {activePage !== 'login' && activePage !== 'portal' && activePage !== 'admin' && activePage !== 'admin-create' && (
        <Footer setActivePage={handlePageChange} />
      )}
    </div>
  );
}

export default App;
