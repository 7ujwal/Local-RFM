import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import AuthCallback from "@/components/AuthCallback";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import EventsPage from "@/pages/EventsPage";
import EventPage from "@/pages/EventPage";
import ContactPage from "@/pages/ContactPage";
import AdminPage from "@/pages/AdminPage";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const lenis = new Lenis({ lerp: 0.09 });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });

  return (
    <MotionConfig reducedMotion="user">
      <div className="App">
        <motion.div
          data-testid="scroll-progress"
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[3px] bg-saffron z-[60] origin-left"
          style={{ scaleX }}
        />
        <BrowserRouter>
          <ScrollToTop />
          <AppRouter />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: "#171714", border: "1px solid #3A332B", color: "#F1E9D8" },
            }}
          />
        </BrowserRouter>
      </div>
    </MotionConfig>
  );
}

export default App;
