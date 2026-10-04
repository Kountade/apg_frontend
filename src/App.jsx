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



// src/App.jsx — Ajouter ces imports
import Departements from './components/rh/Departements';
import DepartementForm from './components/rh/DepartementForm';
import DepartementDetail from './components/rh/DepartementDetail';
import Postes from './components/rh/Postes';
import PosteForm from './components/rh/PosteForm';
import PosteDetail from './components/rh/PosteDetail';

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
             

               


//  RESSOURCES HUMAINES 
<Route path="/departements" element={<Departements />} />
<Route path="/departements/ajouter" element={<DepartementForm />} />
<Route path="/departements/:id" element={<DepartementDetail />} />
<Route path="/departements/:id/modifier" element={<DepartementForm />} />


<Route path="/postes" element={<Postes />} />
<Route path="/postes/ajouter" element={<PosteForm />} />
<Route path="/postes/:id" element={<PosteDetail />} />
<Route path="/postes/:id/modifier" element={<PosteForm />} />

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