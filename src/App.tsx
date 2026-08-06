import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LowPowerProvider } from "@/hooks/useLowPower";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import CriarInimigo from "@/pages/CriarInimigo";
import InimigoPage from "@/pages/Inimigo";
import MiniVitoriasPage from "@/pages/MiniVitorias";
import ConquistasPage from "@/pages/Conquistas";
import PerfilPage from "@/pages/Perfil";
import LojaPage from "@/pages/Loja";
import PersonalizarPage from "@/pages/Personalizar";
import AdminPage from "@/pages/Admin";
import Fissura from "@/pages/Fissura";
import Reestruturacao from "@/pages/Reestruturacao";
import UrgeSurfing from "@/pages/UrgeSurfing";
import FissuraPage from "@/pages/Fissura";
import Laboratorio from "@/pages/Laboratorio";
import Predicao from "@/pages/Predicao";
import Mente from "@/pages/Mente";
import Trataka from "@/pages/Trataka";
import Estudos from "@/pages/Estudos";
import EstudoCategoria from "@/pages/EstudoCategoria";

const qc = new QueryClient();

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <LowPowerProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="top-center" richColors />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/criar-inimigo" element={<Protected><CriarInimigo /></Protected>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/inimigo" element={<Protected><InimigoPage /></Protected>} />
            <Route path="/mini-vitorias" element={<Protected><MiniVitoriasPage /></Protected>} />
            <Route path="/conquistas" element={<Protected><ConquistasPage /></Protected>} />
            <Route path="/fissura" element={<Protected><FissuraPage /></Protected>} />
            <Route path="/loja" element={<Protected><LojaPage /></Protected>} />
            <Route path="/personalizar" element={<Protected><PersonalizarPage /></Protected>} />
            <Route path="/perfil" element={<Protected><PerfilPage /></Protected>} />
            <Route path="/admin" element={<Protected><AdminPage /></Protected>} />
            <Route path="/fissura" element={<Protected><Fissura /></Protected>} />
            <Route path="/reestruturacao" element={<Protected><Reestruturacao /></Protected>} />
            <Route path="/urge-surfing" element={<Protected><UrgeSurfing /></Protected>} />
            <Route path="/laboratorio" element={<Protected><Laboratorio /></Protected>} />
            <Route path="/predicao" element={<Protected><Predicao /></Protected>} />
            <Route path="/mente" element={<Protected><Mente /></Protected>} />
            <Route path="/trataka" element={<Protected><Trataka /></Protected>} />
            <Route path="/estudos" element={<Protected><Estudos /></Protected>} />
            <Route path="/estudos/:id" element={<Protected><EstudoCategoria /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </LowPowerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}