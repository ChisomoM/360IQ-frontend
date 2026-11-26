import { Outlet } from 'react-router-dom';
import Footer from '../components/footer';
import Navbar from '@/components/navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-0 text-text-primary">
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
