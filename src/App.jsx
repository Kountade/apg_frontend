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
import Evaluations from './components/rh/Evaluations';
import EvaluationForm from './components/rh/EvaluationForm';
import EvaluationDetail from './components/rh/EvaluationDetail';
import Formations from './components/rh/Formations';
import FormationForm from './components/rh/FormationForm';
import FormationDetail from './components/rh/FormationDetail';
import MesConges from './components/rh/MesConges';
import DashboardRH from './components/rh/DashboardRH';
import Clients from './components/clients/Clients';
import ClientForm from './components/clients/ClientForm';
import ClientDetail from './components/clients/ClientDetail';
import ClientsParticuliers from './components/clients/ClientsParticuliers';
import ClientsEntreprises from './components/clients/ClientsEntreprises';
import ClientsAdministrations from './components/clients/ClientsAdministrations';
import ClientsOng from './components/clients/ClientsOng';
import ClientsCollectivites from './components/clients/ClientsCollectivites';
import ClientsEcoles from './components/clients/ClientsEcoles';
import ClientsCommerces from './components/clients/ClientsCommerces';
import ClientsHotels from './components/clients/ClientsHotels';



// ============================================================
// CONTRATS - TYPES DE CONTRATS
// ============================================================
import TypesContrats from './components/clients/TypesContrats';
import TypeContratForm from './components/clients/TypeContratForm';
import TypeContratDetail from './components/clients/TypeContratDetail';

import ContratClientDetail from './components/clients/ContratClientDetail';
import ContratClientForm from './components/clients/ContratClientForm';
import ContratsClients from './components/clients/ContratsClients';
import Prestations from './components/clients/Prestations';
import PrestationForm from './components/clients/PrestationForm';


// ============================================================
// COMPTABILITÉ — AVOIRS / PAIEMENTS / LITIGES (COMPLET)
// ============================================================
import Avoirs from './components/comptabilite/Avoirs';
import AvoirForm from './components/comptabilite/AvoirForm';
import AvoirDetail from './components/comptabilite/AvoirDetail';

import PaiementsClients from './components/comptabilite/PaiementsClients';
import PaiementClientForm from './components/comptabilite/PaiementClientForm';
import PaiementClientDetail from './components/comptabilite/PaiementClientDetail';

import Litiges from './components/comptabilite/Litiges';
import LitigeForm from './components/comptabilite/LitigeForm';
import LitigeDetail from './components/comptabilite/LitigeDetail';

import Lettrage from './components/comptabilite/Lettrage';
import LettrageForm from './components/comptabilite/LettrageForm';

// ============================================================
// RECOUVREMENT & RELANCES
// ============================================================
import Recouvrement from './components/comptabilite/Recouvrement';
import Relances from './components/comptabilite/Relances';
import RelanceForm from './components/comptabilite/RelanceForm';
import HistoriqueRelances from './components/comptabilite/HistoriqueRelances';



// ============================================================
// COMPTABILITÉ — DASHBOARD / BALANCE / GRAND LIVRE
// ============================================================
import DashboardComptabilite from './components/comptabilite/DashboardComptabilite';
import Balance from './components/comptabilite/Balance';
import GrandLivre from './components/comptabilite/GrandLivre';

// ============================================================
// COMPTABILITÉ — CLÔTURE / ÉTATS FINANCIERS / RAPPORTS
// ============================================================
import Cloture from './components/comptabilite/Cloture';

import EtatsFinanciers from './components/comptabilite/EtatsFinanciers';
import RapportsComptables from './components/comptabilite/RapportsComptables';

// FACTURATION & RECOUVREMENT
// ============================================================
import FacturesRecouvrement from './components/comptabilite/FacturesRecouvrement';
import FacturesEchues from './components/comptabilite/FacturesEchues';
import FacturesNonEchues from './components/comptabilite/FacturesNonEchues';
import Creances from './components/comptabilite/Creances';
import Bilan from './components/comptabilite/Bilan';
import CompteResultat from './components/comptabilite/CompteResultat';

// Comptabilité - Plan comptable
import ComptesComptables from './components/comptabilite/ComptesComptables';
import CompteComptableForm from './components/comptabilite/CompteComptableForm';
import JournalForm from './components/comptabilite/JournalForm';
import Journaux from './components/comptabilite/Journaux';
import Factures from './components/comptabilite/Factures';
import FactureForm from './components/comptabilite/FactureForm';
import FactureDetail from './components/comptabilite/FactureDetail';
import Devis from './components/comptabilite/Devis';
import DevisForm from './components/comptabilite/DevisForm';
import DevisDetail from './components/comptabilite/DevisDetail';
import EcrituresComptables from './components/comptabilite/EcrituresComptables';
import EcritureForm from './components/comptabilite/EcritureForm';
import EcritureDetail from './components/comptabilite/EcritureDetail';
import DeclarationsFiscales from './components/comptabilite/DeclarationsFiscales';
import DeclarationForm from './components/comptabilite/DeclarationForm';
import DeclarationDetail from './components/comptabilite/DeclarationDetail';
import Caisses from './components/tresorerie/Caisses';
import CaisseForm from './components/tresorerie/CaisseForm';
import CaisseDetail from './components/tresorerie/CaisseDetail';
import EtatCaisse from './components/tresorerie/EtatCaisse';
import ComptesBancaires from './components/tresorerie/ComptesBancaires';
import CompteBancaireForm from './components/tresorerie/CompteBancaireForm';
import CompteBancaireDetail from './components/tresorerie/CompteBancaireDetail';
import Encaissements from './components/tresorerie/Encaissements';
import EncaissementForm from './components/tresorerie/EncaissementForm';
import EncaissementDetail from './components/tresorerie/EncaissementDetail';
import Decaissements from './components/tresorerie/Decaissements';
import DecaissementForm from './components/tresorerie/DecaissementForm';
import DecaissementDetail from './components/tresorerie/DecaissementDetail';
import MouvementsTresorerie from './components/tresorerie/MouvementsTresorerie';
import MouvementTresorerieDetail from './components/tresorerie/MouvementTresorerieDetail';
import Previsions from './components/tresorerie/Previsions';
import PrevisionForm from './components/tresorerie/PrevisionForm';
import RapprochementsBancaires from './components/tresorerie/RapprochementsBancaires';
import RapprochementBancaireForm from './components/tresorerie/RapprochementBancaireForm';
import AlertesTresorerie from './components/tresorerie/AlertesTresorerie';
import AlerteTresorerieForm from './components/tresorerie/AlerteTresorerieForm';
import DashboardTresorerie from './components/tresorerie/DashboardTresorerie';
import PeriodesPaie from './components/paie/PeriodesPaie';
import PeriodePaieForm from './components/paie/PeriodePaieForm';
import PeriodePaieDetail from './components/paie/PeriodePaieDetail';
import BulletinsPaie from './components/paie/BulletinsPaie';
import BulletinPaieDetail from './components/paie/BulletinPaieDetail';
import Primes from './components/paie/Primes';
import PrimeForm from './components/paie/PrimeForm';
import Retenues from './components/paie/Retenues';
import RetenueForm from './components/paie/RetenueForm';
import AvancesSalaire from './components/paie/AvancesSalaire';
import AvanceSalaireForm from './components/paie/AvanceSalaireForm';
import AvanceSalaireDetail from './components/paie/AvanceSalaireDetail';
import FichesPaie from './components/paie/FichesPaie';
import FichePaieDetail from './components/paie/FichePaieDetail';
import HistoriquePaie from './components/paie/HistoriquePaie';
import ArchivesPaie from './components/paie/ArchivesPaie';
import RapportsPaie from './components/paie/RapportsPaie';
import DashboardPaie from './components/paie/DashboardPaie';
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
             

CompteResultat

                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/ajouter" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/clients/:id/modifier" element={<ClientForm />} />

               {/* Clients filtrés par type */}
<Route path="/clients-particuliers" element={<ClientsParticuliers />} />
<Route path="/clients-entreprises" element={<ClientsEntreprises />} />
<Route path="/clients-administrations" element={<ClientsAdministrations />} />
<Route path="/clients-ong" element={<ClientsOng />} />
<Route path="/clients-collectivites" element={<ClientsCollectivites />} />
<Route path="/clients-ecoles" element={<ClientsEcoles />} />
<Route path="/clients-commerces" element={<ClientsCommerces />} />
<Route path="/clients-hotels" element={<ClientsHotels />} />

{/* Contrats clients */}
<Route path="/contrats-clients" element={<ContratsClients />} />
<Route path="/contrats-clients/ajouter" element={<ContratClientForm />} />
<Route path="/contrats-clients/:id" element={<ContratClientDetail />} />
<Route path="/contrats-clients/:id/modifier" element={<ContratClientForm />} />
<Route path="/contrats-clients/expirant" element={<ContratsClients />} />



<Route path="/types-contrats" element={<TypesContrats />} />
<Route path="/types-contrats/ajouter" element={<TypeContratForm />} />
<Route path="/types-contrats/:id" element={<TypeContratDetail />} />
<Route path="/types-contrats/:id/modifier" element={<TypeContratForm />} />






{/* ============================================================ */}
{/* PAIE - DASHBOARD                                             */}
{/* ============================================================ */}
<Route path="/dashboard-paie" element={<DashboardPaie />} />


{/* ============================================================ */}
{/* PAIE - RAPPORTS                                              */}
{/* ============================================================ */}
<Route path="/rapports-paie" element={<RapportsPaie />} />
{/* ============================================================ */}
{/* PAIE - ARCHIVES                                               */}
{/* ============================================================ */}
<Route path="/archives-paie" element={<ArchivesPaie />} />

{/* ============================================================ */}
{/* PAIE - HISTORIQUE                                             */}
{/* ============================================================ */}
<Route path="/historique-paie" element={<HistoriquePaie />} />

{/* ============================================================ */}
{/* PAIE - FICHES DE PAIE                                        */}
{/* ============================================================ */}
<Route path="/fiches-paie" element={<FichesPaie />} />
<Route path="/fiches-paie/:id" element={<FichePaieDetail />} />

{/* ============================================================ */}
{/* PAIE - RETENUES                                               */}
{/* ============================================================ */}
<Route path="/retenues" element={<Retenues />} />
<Route path="/retenues/ajouter" element={<RetenueForm />} />
<Route path="/retenues/:id/modifier" element={<RetenueForm />} />

{/* ============================================================ */}
{/* PAIE - AVANCES SUR SALAIRE                                    */}
{/* ============================================================ */}
<Route path="/avances-salaire" element={<AvancesSalaire />} />
<Route path="/avances-salaire/ajouter" element={<AvanceSalaireForm />} />
<Route path="/avances-salaire/:id" element={<AvanceSalaireDetail />} />
<Route path="/avances-salaire/:id/modifier" element={<AvanceSalaireForm />} />

{/* PAIE - PRIMES */}
<Route path="/primes" element={<Primes />} />
<Route path="/primes/ajouter" element={<PrimeForm />} />
<Route path="/primes/:id/modifier" element={<PrimeForm />} />
{/* PAIE - BULLETINS */}
<Route path="/paie-bulletins" element={<BulletinsPaie />} />
<Route path="/paie-bulletins/:id" element={<BulletinPaieDetail />} />
{/* ============================================ */}
{/* PAIE - PÉRIODES */}
{/* ============================================ */}
{/* ============================================================ */}
{/* PAIE - PÉRIODES DE PAIE                                       */}
{/* ============================================================ */}
<Route path="/paie-periodes" element={<PeriodesPaie />} />
<Route path="/paie-periodes/ajouter" element={<PeriodePaieForm />} />
<Route path="/paie-periodes/:id/modifier" element={<PeriodePaieForm />} />
<Route path="/paie-periodes/:id" element={<PeriodePaieDetail />} />


{/* ============================================ */}
{/* TRÉSORERIE - DASHBOARD */}
{/* ============================================ */}
<Route path="/dashboard-tresorerie" element={<DashboardTresorerie />} />
{/* ============================================ */}
{/* TRÉSORERIE - ALERTES */}
{/* ============================================ */}
<Route path="/alertes-tresorerie" element={<AlertesTresorerie />} />
<Route path="/alertes-tresorerie/ajouter" element={<AlerteTresorerieForm />} />
<Route path="/alertes-tresorerie/:id/modifier" element={<AlerteTresorerieForm />} />

{/* ============================================ */}
{/* TRÉSORERIE - RAPPROCHEMENT BANCAIRE */}
{/* ============================================ */}
<Route path="/rapprochement-bancaire" element={<RapprochementsBancaires />} />
<Route path="/rapprochement-bancaire/ajouter" element={<RapprochementBancaireForm />} />
<Route path="/rapprochement-bancaire/:id/modifier" element={<RapprochementBancaireForm />} />

{/* ============================================ */}
{/* TRÉSORERIE - PRÉVISIONS */}
{/* ============================================ */}
<Route path="/previsions" element={<Previsions />} />
<Route path="/previsions/ajouter" element={<PrevisionForm />} />
<Route path="/previsions/:id/modifier" element={<PrevisionForm />} />

{/* ============================================ */}
{/* TRÉSORERIE - MOUVEMENTS */}
{/* ============================================ */}
<Route path="/mouvements-tresorerie" element={<MouvementsTresorerie />} />
<Route path="/mouvements-tresorerie/:id" element={<MouvementTresorerieDetail />} />
{/* ============================================ */}
{/* TRÉSORERIE - DÉCAISSEMENTS */}
{/* ============================================ */}
<Route path="/decaissements" element={<Decaissements />} />
<Route path="/decaissements/ajouter" element={<DecaissementForm />} />
<Route path="/decaissements/:id" element={<DecaissementDetail />} />
<Route path="/decaissements/:id/modifier" element={<DecaissementForm />} />
{/* ============================================ */}
{/* TRÉSORERIE - ENCAISSEMENTS */}
{/* ============================================ */}
<Route path="/encaissements" element={<Encaissements />} />
<Route path="/encaissements/ajouter" element={<EncaissementForm />} />
<Route path="/encaissements/:id" element={<EncaissementDetail />} />
<Route path="/encaissements/:id/modifier" element={<EncaissementForm />} />


{/* ============================================================ */}
{/* COMPTABILITÉ — CLÔTURE / ÉTATS / RAPPORTS                     */}
{/* ============================================================ */}
<Route path="/cloture" element={<Cloture />} />
<Route path="/etats-financiers" element={<EtatsFinanciers />} />
<Route path="/rapports-comptables" element={<RapportsComptables />} />

{/* ============================================ */}
{/* TRÉSORERIE - COMPTES BANCAIRES */}
{/* ============================================ */}
<Route path="/comptes-bancaires" element={<ComptesBancaires />} />
<Route path="/comptes-bancaires/ajouter" element={<CompteBancaireForm />} />
<Route path="/comptes-bancaires/:id" element={<CompteBancaireDetail />} />
<Route path="/comptes-bancaires/:id/modifier" element={<CompteBancaireForm />} />

<Route path="/lettrage" element={<Lettrage />} />

<Route path="/lettrage/ajouter" element={<LettrageForm />} />
<Route path="/lettrage/:id/modifier" element={<LettrageForm />} />
<Route path="/bilan" element={<Bilan />} />

{/* ============================================ */}
{/* TRÉSORERIE - CAISSES */}
{/* ============================================ */}
<Route path="/caisses" element={<Caisses />} />
<Route path="/caisses/ajouter" element={<CaisseForm />} />
<Route path="/caisses/:id" element={<CaisseDetail />} />
<Route path="/caisses/:id/modifier" element={<CaisseForm />} />
<Route path="/etat-caisse" element={<EtatCaisse />} />

{/* ============================================ */}
{/* COMPTABILITÉ - PLAN COMPTABLE */}
{/* ============================================ */}
<Route path="/plan-comptable" element={<ComptesComptables />} />
<Route path="/plan-comptable/ajouter" element={<CompteComptableForm />} />
<Route path="/plan-comptable/:id/modifier" element={<CompteComptableForm />} />
{/* ============================================ */}
{/* COMPTABILITÉ - JOURNAUX */}
{/* ============================================ */}
<Route path="/journaux" element={<Journaux />} />
<Route path="/journaux/ajouter" element={<JournalForm />} />
<Route path="/journaux/:id/modifier" element={<JournalForm />} />

<Route path="/compte-resultat" element={<CompteResultat />} />


{/* COMPTABILITÉ - FACTURES */}
{/* ============================================ */}
<Route path="/factures" element={<Factures />} />
<Route path="/factures/ajouter" element={<FactureForm />} />
<Route path="/factures/:id/modifier" element={<FactureForm />} />
<Route path="/factures/:id" element={<FactureDetail />} />

{/* ============================================ */}
{/* COMPTABILITÉ - DEVIS */}
{/* ============================================ */}
<Route path="/devis" element={<Devis />} />
<Route path="/devis/ajouter" element={<DevisForm />} />
<Route path="/devis/:id" element={<DevisDetail />} />
<Route path="/devis/:id/modifier" element={<DevisForm />} />



{/* ============================================================ */}
{/* COMPTABILITÉ — AVOIRS                                         */}
{/* ============================================================ */}
<Route path="/avoirs" element={<Avoirs />} />
<Route path="/avoirs/ajouter" element={<AvoirForm />} />
<Route path="/avoirs/:id/modifier" element={<AvoirForm />} />
<Route path="/avoirs/:id" element={<AvoirDetail />} />

{/* ============================================================ */}
{/* COMPTABILITÉ — PAIEMENTS CLIENTS                              */}
{/* ============================================================ */}
<Route path="/paiements-clients" element={<PaiementsClients />} />
<Route path="/paiements-clients/ajouter" element={<PaiementClientForm />} />
<Route path="/paiements-clients/:id/modifier" element={<PaiementClientForm />} />
<Route path="/paiements-clients/:id" element={<PaiementClientDetail />} />

{/* ============================================================ */}
{/* COMPTABILITÉ — LITIGES                                        */}
{/* ============================================================ */}
<Route path="/litiges" element={<Litiges />} />
<Route path="/litiges/ajouter" element={<LitigeForm />} />
<Route path="/litiges/:id/modifier" element={<LitigeForm />} />
<Route path="/litiges/:id" element={<LitigeDetail />} />

{/* ============================================================ */}
{/* FACTURATION & RECOUVREMENT                                    */}
{/* ============================================================ */}
<Route path="/factures-recouvrement" element={<FacturesRecouvrement />} />
<Route path="/factures-echues" element={<FacturesEchues />} />
<Route path="/factures-non-echues" element={<FacturesNonEchues />} />
<Route path="/creances" element={<Creances />} />


{/* ============================================================ */}
{/* RECOUVREMENT & RELANCES                                       */}
{/* ============================================================ */}
<Route path="/recouvrement" element={<Recouvrement />} />
<Route path="/relances" element={<Relances />} />
<Route path="/relances/ajouter" element={<RelanceForm />} />
<Route path="/relances/:id/modifier" element={<RelanceForm />} />
<Route path="/historique-relances" element={<HistoriqueRelances />} />

{/* ============================================ */}
{/* COMPTABILITÉ - ÉCRITURES COMPTABLES */}
{/* ============================================ */}
<Route path="/ecritures-comptables" element={<EcrituresComptables />} />
<Route path="/ecritures-comptables/ajouter" element={<EcritureForm />} />
<Route path="/ecritures-comptables/:id" element={<EcritureDetail />} />
<Route path="/ecritures-comptables/:id/modifier" element={<EcritureForm />} />

{/* ============================================================ */}
{/* COMPTABILITÉ — DASHBOARD / BALANCE / GRAND LIVRE              */}
{/* ============================================================ */}
<Route path="/dashboard-comptabilite" element={<DashboardComptabilite />} />
<Route path="/balance" element={<Balance />} />
<Route path="/grand-livre" element={<GrandLivre />} />

{/* ============================================ */}
{/* COMPTABILITÉ - DÉCLARATIONS FISCALES */}
<Route path="/declarations-fiscales" element={<DeclarationsFiscales />} />
<Route path="/declarations-fiscales/ajouter" element={<DeclarationForm />} />
<Route path="/declarations-fiscales/:id" element={<DeclarationDetail />} />
<Route path="/declarations-fiscales/:id/modifier" element={<DeclarationForm />} />

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

{/* Prestations */}
<Route path="/prestations" element={<Prestations />} />
<Route path="/prestations/ajouter" element={<PrestationForm />} />
<Route path="/prestations/:id/modifier" element={<PrestationForm />} />


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

<Route path="/evaluations" element={<Evaluations />} />
<Route path="/evaluations/ajouter" element={<EvaluationForm />} />
<Route path="/evaluations/:id" element={<EvaluationDetail />} />
<Route path="/evaluations/:id/modifier" element={<EvaluationForm />} />

<Route path="/formations" element={<Formations />} />
<Route path="/formations/ajouter" element={<FormationForm />} />
<Route path="/formations/:id" element={<FormationDetail />} />
<Route path="/formations/:id/modifier" element={<FormationForm />} />
<Route path="/conges/mes_conges" element={<MesConges />} />
<Route path="/dashboard-rh" element={<DashboardRH />} />

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