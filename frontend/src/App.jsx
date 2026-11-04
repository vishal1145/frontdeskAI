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
import { ClinicProvider } from './context/ClinicContext';
import ClinicLayout from './components/ClinicLayout';
import DashboardPage from './pages/portal/DashboardPage';
import AppointmentsPage from './pages/portal/AppointmentsPage';
import DoctorsServicesPage from './pages/portal/DoctorsServicesPage';
import CalendarPage from './pages/portal/CalendarPage';
import ProfilePage from './pages/portal/ProfilePage';
import AdminPanel from './pages/AdminPanel';
import CreateBusiness from './pages/CreateBusiness';
import FeatureDetail from './pages/FeatureDetail';
import { FEATURE_SLUGS } from './pages/featureContent';
import CustomCursorAndInteractions from './components/CustomCursorAndInteractions';
import { borderRadius, colors, fontSize, spacing, withAlpha } from '../design-tokens.js';

const CLINIC_PAGES = ['portal', 'dashboard', 'appointments', 'doctors', 'doctors-services', 'calendar', 'profile'];
const VALID_PAGES = ['about', 'privacy', 'terms', 'support', 'login', 'admin', ...CLINIC_PAGES];
const HOME_SECTIONS = ['features', 'telephony', 'roi', 'simulator'];

function parseCurrentRoute() {
  if (typeof window === 'undefined') return { page: 'home', section: null };

  // 1. Check pathname first (e.g. /about, /support, /privacy, /terms, /features/<slug>)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const featureMatch = pathname.match(/^features\/([a-z0-9-]+)$/);
  if (featureMatch && FEATURE_SLUGS.includes(featureMatch[1])) {
    return { page: 'feature', section: null, feature: featureMatch[1] };
  }

  // Clinic Portal route redirects and sub-pages:
  // /portal automatically defaults and redirects to /portal/dashboard
  if (pathname === 'portal') {
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/portal/dashboard');
    }
    return { page: 'dashboard', section: null };
  }
  if (pathname === 'portal/dashboard' || pathname === 'portal/calls' || pathname === 'dashboard' || pathname === 'calls') {
    return { page: 'dashboard', section: null };
  }
  if (pathname === 'portal/appointments' || pathname === 'appointments') {
    return { page: 'appointments', section: null };
  }
  if (pathname === 'portal/doctors-services' || pathname === 'portal/doctors' || pathname === 'doctors-services' || pathname === 'doctors') {
    return { page: 'doctors-services', section: null };
  }
  if (pathname === 'portal/calendar' || pathname === 'calendar') {
    return { page: 'calendar', section: null };
  }
  if (pathname === 'portal/profile' || pathname === 'profile') {
    return { page: 'profile', section: null };
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
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

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
          else window.scrollTo(0, 0);
        }, 100);
      } else {
        window.scrollTo(0, 0);
      }
    };

    // If initial load has a valid section anchor, scroll to it
    const { section } = parseCurrentRoute();
    if (section && section !== 'home') {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      window.scrollTo(0, 0);
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Guarantee scroll to top immediately whenever activePage changes without a section anchor
  useEffect(() => {
    const { section } = parseCurrentRoute();
    if (!section || section === 'home') {
      window.scrollTo(0, 0);
    }
  }, [activePage, featureSlug]);

  const handlePageChange = (newPage, sectionId = null) => {
    // Feature detail pages: setActivePage('feature', '<slug>')
    if (newPage === 'feature' && FEATURE_SLUGS.includes(sectionId)) {
      setActivePage('feature');
      setFeatureSlug(sectionId);
      const featureUrl = `/features/${sectionId}`;
      if (window.location.pathname !== featureUrl) {
        window.history.pushState({ page: 'feature', sectionId }, '', featureUrl);
      }
      window.scrollTo(0, 0);
      return;
    }

    // Create New Business page lives under the console: /admin/create
    if (newPage === 'admin-create') {
      setActivePage('admin-create');
      if (window.location.pathname !== '/admin/create') {
        window.history.pushState({ page: 'admin-create' }, '', '/admin/create');
      }
      window.scrollTo(0, 0);
      return;
    }

    // Clinic portal 5 pages routing with clean URLs:
    if (newPage === 'portal' || newPage === 'dashboard' || newPage === 'calls') {
      setActivePage('dashboard');
      if (window.location.pathname !== '/portal/dashboard') {
        window.history.pushState({ page: 'dashboard' }, '', '/portal/dashboard');
      }
      window.scrollTo(0, 0);
      return;
    }
    if (newPage === 'appointments') {
      setActivePage('appointments');
      if (window.location.pathname !== '/portal/appointments') {
        window.history.pushState({ page: 'appointments' }, '', '/portal/appointments');
      }
      window.scrollTo(0, 0);
      return;
    }
    if (newPage === 'doctors-services' || newPage === 'doctors') {
      setActivePage('doctors-services');
      if (window.location.pathname !== '/portal/doctors-services') {
        window.history.pushState({ page: 'doctors-services' }, '', '/portal/doctors-services');
      }
      window.scrollTo(0, 0);
      return;
    }
    if (newPage === 'calendar') {
      setActivePage('calendar');
      if (window.location.pathname !== '/portal/calendar') {
        window.history.pushState({ page: 'calendar' }, '', '/portal/calendar');
      }
      window.scrollTo(0, 0);
      return;
    }
    if (newPage === 'profile') {
      setActivePage('profile');
      if (window.location.pathname !== '/portal/profile') {
        window.history.pushState({ page: 'profile' }, '', '/portal/profile');
      }
      window.scrollTo(0, 0);
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
        else window.scrollTo(0, 0);
      }, 80);
    } else {
      window.scrollTo(0, 0);
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
            borderRadius: borderRadius[16],
            background: colors.tint.blue[37],
            color: colors.white,
            fontSize: fontSize[13],
            fontWeight: 'var(--fd-weight-medium)',
            padding: `${spacing[3]} ${spacing['s-18']}`,
            boxShadow: `0 20px 40px -15px ${withAlpha(colors.tint.blue[37], 0.4)}`,
          },
          success: {
            iconTheme: {
              primary: colors.tint.green[7],
              secondary: colors.white,
            },
          },
          error: {
            iconTheme: {
              primary: colors.tint.rose[7],
              secondary: colors.white,
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
        onClinicLogout={() => setClinicUser(null)}
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
        {CLINIC_PAGES.includes(activePage) && (
          <ClinicProvider
            clinicUser={clinicUser}
            onLogout={() => setClinicUser(null)}
            setActivePage={handlePageChange}
          >
            <ClinicLayout
              activePage={activePage === 'portal' ? 'dashboard' : activePage}
              setActivePage={handlePageChange}
            >
              {(activePage === 'portal' || activePage === 'dashboard' || activePage === 'calls') && <DashboardPage />}
              {activePage === 'appointments' && <AppointmentsPage />}
              {(activePage === 'doctors-services' || activePage === 'doctors') && <DoctorsServicesPage />}
              {activePage === 'calendar' && <CalendarPage />}
              {activePage === 'profile' && <ProfilePage />}
            </ClinicLayout>
          </ClinicProvider>
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
              handlePageChange('dashboard');
            }}
          />
        )}
      </main>

      {/* Global Footer - Hidden on Login, Clinic Pages, and AdminPanel pages */}
      {!['login', 'admin', 'admin-create', ...CLINIC_PAGES].includes(activePage) && (
        <Footer setActivePage={handlePageChange} />
      )}
    </div>
  );
}

export default App;
