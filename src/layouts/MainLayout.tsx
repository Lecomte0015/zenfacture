import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Pages qui gèrent elles-mêmes leur layout (pleine largeur)
const FULL_WIDTH_PAGES = ['/', '/features', '/pricing', '/help', '/faq', '/documentation'];

const MainLayout = () => {
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_PAGES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        {isFullWidth ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        )}
      </main>
      {isFullWidth && <Footer />}
    </div>
  );
};

export default MainLayout;
