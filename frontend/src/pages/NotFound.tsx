import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #dbeafe 70%, #e0f2fe 100%)" }}
      data-testid="not-found-page"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 Visual */}
        <div className="relative mb-8">
          <div 
            className="text-[150px] font-black leading-none"
            style={{ 
              background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}
          >
            404
          </div>
          <div 
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
            >
              <Search className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-3" data-testid="not-found-title">
          Page not found
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="h-11 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            data-testid="go-back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="h-11 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white hover:opacity-90 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
            data-testid="go-home-button"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          Tried to access: <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{location.pathname}</code>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
