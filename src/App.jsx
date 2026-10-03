// App.jsx
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoutes';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordReset from './components/PasswordReset';
import EtablissementSettings from './components/settings/EtablissementSettings';
import Utilisateurs from './components/utilisateurs/Utilisateurs';
import UtilisateurForm from './components/utilisateurs/UtilisateurForm';
import UtilisateurDetails from './components/utilisateurs/UtilisateurDetails';

function App() {
  const location = useLocation();

  // Routes sans Navbar (pages d'authentification)
  const noNavBar =
    location.pathname === '/' ||
    location.pathname === '/register' ||
    location.pathname.includes('password') ||
    location.pathname === '/login';

  return (
    <>
      {noNavBar ? (
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/request/password_reset" element={<PasswordResetRequest />} />
          <Route path="/password-reset/:token" element={<PasswordReset />} />
        </Routes>
      ) : (
        <Navbar
          content={
            <Routes>
              <Route element={<ProtectedRoute />}>
             

               



                <Route path="/utilisateurs" element={<Utilisateurs />} />
                <Route path="/utilisateurs/ajouter" element={<UtilisateurForm />} />
                <Route path="/utilisateurs/:id" element={<UtilisateurDetails />} />
                <Route path="/utilisateurs/:id/modifier" element={<UtilisateurForm />} />
  <Route path="/company-config" element={<EtablissementSettings />} />
               
              </Route>
            </Routes>
          }
        />
      )}
    </>
  );
}

export default App;