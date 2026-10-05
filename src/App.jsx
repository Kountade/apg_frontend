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



// src/App.jsx — Ajouter ces imports
import Departements from './components/rh/Departements';
import DepartementForm from './components/rh/DepartementForm';
import DepartementDetail from './components/rh/DepartementDetail';
import Postes from './components/rh/Postes';
import PosteForm from './components/rh/PosteForm';
import PosteDetail from './components/rh/PosteDetail';
import Employes from './components/rh/Employes';
import EmployeForm from './components/rh/EmployeForm';
import EmployeDetail from './components/rh/EmployeDetail';
import Organigramme from './components/rh/Organigramme';
import Contrats from './components/rh/Contrats';
import ContratForm from './components/rh/ContratForm';
import ContratDetail from './components/rh/ContratDetail';

import Utilisateurs from './components/utilisateurs/Utilisateurs';
import UtilisateurForm from './components/utilisateurs/UtilisateurForm';
import UtilisateurDetails from './components/utilisateurs/UtilisateurDetails';
import Presences from './components/rh/Presences';
import PresenceForm from './components/rh/PresenceForm';
import PresenceDetail from './components/rh/PresenceDetail';
import PresencesAujourdhui from './components/rh/PresencesAujourdhui';
import Pointage from './components/rh/Pointage';
import Absences from './components/rh/Absences';
import AbsenceForm from './components/rh/AbsenceForm';
import AbsenceDetail from './components/rh/AbsenceDetail';
import Conges from './components/rh/Conges';
import CongeForm from './components/rh/CongeForm';
import CongeDetail from './components/rh/CongeDetail';
import SoldeConges from './components/rh/SoldeConges';
import JoursTravailles from './components/rh/JoursTravailles';
import JoursTravaillesForm from './components/rh/JoursTravaillesForm';

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


<Route path="/employes" element={<Employes />} />
<Route path="/employes/ajouter" element={<EmployeForm />} />
<Route path="/employes/:id" element={<EmployeDetail />} />
<Route path="/employes/:id/modifier" element={<EmployeForm />} />


<Route path="/organigramme" element={<Organigramme />} />


<Route path="/contrats" element={<Contrats />} />
<Route path="/contrats/ajouter" element={<ContratForm />} />
<Route path="/contrats/:id" element={<ContratDetail />} />
<Route path="/contrats/:id/modifier" element={<ContratForm />} />


<Route path="/presences" element={<Presences />} />
<Route path="/presences/ajouter" element={<PresenceForm />} />
<Route path="/presences/:id/modifier" element={<PresenceForm />} />
<Route path="/presences/:id" element={<PresenceDetail />} />
<Route path="/presences/aujourdhui" element={<PresencesAujourdhui />} />
<Route path="/pointage" element={<Pointage />} />

<Route path="/absences" element={<Absences />} />
<Route path="/absences/ajouter" element={<AbsenceForm />} />
<Route path="/absences/:id" element={<AbsenceDetail />} />
<Route path="/absences/:id/modifier" element={<AbsenceForm />} />

<Route path="/conges" element={<Conges />} />
<Route path="/conges/ajouter" element={<CongeForm />} />
<Route path="/conges/:id" element={<CongeDetail />} />
<Route path="/conges/:id/modifier" element={<CongeForm />} />
<Route path="/soldes-conges" element={<SoldeConges />} />
<Route path="/jours-travailles" element={<JoursTravailles />} />
<Route path="/jours-travailles/ajouter" element={<JoursTravaillesForm />} />

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