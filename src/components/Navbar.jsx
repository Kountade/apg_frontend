// src/components/Navbar.jsx - Version APG Assainissement (6 rôles) - SANS ORANGE - SANS PRÉFIXE RH
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, LogOut, UserCircle, Settings,
  Receipt, FileText, ChevronDown, ChevronUp, Menu, X, Bell, Moon, Sun,
  Shield, Clock, Calendar, TrendingUp, CreditCard, AlertTriangle, Search,
  HelpCircle, History, Truck, DollarSign, ClipboardCheck, Calculator,
  Wallet, BookOpen, PiggyBank, Cog, Database, BellRing, Printer, UserCog,
  CalendarClock, RefreshCw, Activity, Award, BarChart3, Landmark, Coins,
  CalendarDays, CheckCircle, ClipboardList, Gauge, AlertCircle, Banknote,
  TrendingDown, ScrollText, Scale, FileSpreadsheet, Handshake, FileCheck,
  RotateCcw, Archive, Map, UserCheck, Route, PlusCircle, UserPlus, FilePlus,
  Plus, Grid3x3, TableProperties, Trash2, Recycle, Leaf, MapPin, Droplet,
  Factory, Container, Weight, Timer, Navigation, CheckSquare, Sprout,
  Flame, HardHat, Briefcase, Package, Warehouse, Smartphone, Send, Inbox,
  FolderOpen, Folder, FileSearch, Lock, Key, Target, Layers, Star, Hash,
  FileSignature, QrCode, Fingerprint, ArrowLeftRight, ArrowUpRight,
  ArrowDownRight, HandCoins, FileMinus, FileClock, Boxes, Tags
} from 'lucide-react';

import axiosInstance from './AxiosInstance';

// ============================================================
// ✅ CONFIGURATION DES 6 RÔLES APG (selon cahier des charges)
// ============================================================
const ROLE_CONFIG = {
  pdg: {
    label: 'PDG / Administrateur Général',
    color: 'info',
    icon: Shield,
    level: 100
  },
  admin: {
    label: 'PDG / Administrateur Général',
    color: 'info',
    icon: Shield,
    level: 100
  },
  rh: {
    label: 'Responsable RH',
    color: 'primary',
    icon: Users,
    level: 80
  },
  comptable: {
    label: 'Responsable Comptabilité',
    color: 'warning',
    icon: Calculator,
    level: 85
  },
  logistique: {
    label: 'Responsable Logistique',
    color: 'info',
    icon: Package,
    level: 80
  },
  superviseur: {
    label: 'Superviseur Exploitation',
    color: 'success',
    icon: Truck,
    level: 75
  },
  employe: {
    label: 'Employé',
    color: 'neutral',
    icon: UserCircle,
    level: 30
  }
};

const Navbar = ({ content, mode, toggleColorMode }) => {
  const location = useLocation();
  const path = location.pathname || '/';
  const navigate = useNavigate();

  // ============================================================
  // ÉTATS
  // ============================================================
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true,
    'ADMINISTRATION': false,
    'RESSOURCES HUMAINES': false,
    'PAIE': false,
    'CLIENTS & CONTRATS': false,
    'FACTURATION & RECOUVREMENT': false,
    'TRÉSORERIE': false,
    'COMPTABILITÉ': false,
    'LOGISTIQUE & STOCKS': false,
    'TRICYCLES & VÉHICULES': false,
    'CARBURANT & MAINTENANCE': false,
    'EXPLOITATION / MISSIONS': false,
    'FOURNISSEURS & ACHATS': false,
    'DOCUMENTS': false,
    'RAPPORTS': false,
    'ALERTES': false,
    'MON ESPACE': false
  });

  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  // Compteurs APG
  const [facturesImpayees, setFacturesImpayees] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [contratsExpirant, setContratsExpirant] = useState(0);
  const [congesEnAttente, setCongesEnAttente] = useState(0);
  const [paieEnAttente, setPaieEnAttente] = useState(0);
  const [stockCritique, setStockCritique] = useState(0);
  const [tricyclesEnMaintenance, setTricyclesEnMaintenance] = useState(0);
  const [missionsEnCours, setMissionsEnCours] = useState(0);
  const [validationsEnAttente, setValidationsEnAttente] = useState(0);
  const [depensesEnAttente, setDepensesEnAttente] = useState(0);
  const [carburantAlerte, setCarburantAlerte] = useState(0);

  // ============================================================
  // UTILISATEUR
  // ============================================================
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch { return null; }
  };

  const user = getUserData();
  const rawRole = user?.role || 'employe';
  const role = rawRole === 'admin' ? 'pdg' : rawRole;

  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const userName = firstName || lastName || user?.username || userEmail?.split('@')[0] || 'Utilisateur';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ============================================================
  // ✅ PERMISSIONS PAR RÔLE
  // ============================================================
  const isPDG = role === 'pdg';
  const isRH = role === 'rh';
  const isComptable = role === 'comptable';
  const isLogistique = role === 'logistique';
  const isSuperviseur = role === 'superviseur';
  const isEmploye = role === 'employe';

  const isStaff = isPDG || isRH || isComptable || isLogistique || isSuperviseur;

  useEffect(() => {
    if (firstName && lastName) {
      setUserInitial(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase());
      setUserFullName(`${firstName} ${lastName}`);
    } else if (userName) {
      setUserInitial(userName.charAt(0).toUpperCase());
      setUserFullName(userName);
    }
  }, [firstName, lastName, userName]);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.employe;
  const RoleIcon = roleConfig.icon;

  // ============================================================
  // LOGO
  // ============================================================
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
    const baseURL = axiosInstance.defaults.baseURL || '';
    if (logoPath.startsWith('/media/') || logoPath.startsWith('/static/')) return `${baseURL}${logoPath}`;
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (response.data) {
          setEtablissement(response.data);
          if (response.data.logo) setLogoUrl(getLogoUrl(response.data.logo));
        }
      } catch (error) {
        console.error('Erreur établissement:', error);
      } finally {
        setLoadingEtab(false);
      }
    };
    fetchEtablissement();
  }, []);

  // ============================================================
  // COMPTEURS
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('Token');
      if (!token) return;
      const headers = { Authorization: `Token ${token}` };

      const safeGet = async (url, setter) => {
        try {
          const res = await axiosInstance.get(url, { headers }).catch(() => ({ data: [] }));
          setter(res.data?.length || res.data?.count || 0);
        } catch (e) { /* silencieux */ }
      };

      if (isStaff) {
        safeGet('/factures/impayees/', setFacturesImpayees);
        safeGet('/contrats/expirant/', setContratsExpirant);
        safeGet('/conges/en-attente/', setCongesEnAttente);
        safeGet('/paie/en-attente/', setPaieEnAttente);
        safeGet('/stocks/critique/', setStockCritique);
        safeGet('/vehicules/maintenance/', setTricyclesEnMaintenance);
        safeGet('/missions/en-cours/', setMissionsEnCours);
        safeGet('/validations/en-attente/', setValidationsEnAttente);
        safeGet('/depenses/en-attente/', setDepensesEnAttente);
        safeGet('/carburant/alertes/', setCarburantAlerte);
        safeGet('/notifications/non-lues/', setNotificationsCount);
      }
    };
    loadData();
  }, [role, isStaff]);

  // ============================================================
  // RECHERCHE API
  // ============================================================
  useEffect(() => {
    const searchAPI = async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('Token');
        const headers = { Authorization: `Token ${token}` };
        const res = await axiosInstance.get(`/search/?q=${encodeURIComponent(searchQuery)}`, { headers })
          .catch(() => ({ data: [] }));
        setSearchResults(res.data || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const debounce = setTimeout(searchAPI, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const logoutUser = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('Token');
    localStorage.removeItem('User');
    navigate('/');
  };

  // ============================================================
  // ✅ MENU ALIGNÉ SUR LE CAHIER DES CHARGES APG
  // ============================================================
  const menuSections = [
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'dashboard-pdg', text: 'Dashboard PDG', icon: Target, path: '/dashboard-pdg', permission: isPDG },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isPDG },
        { id: 'analyses', text: 'Analyses & Rapports', icon: BarChart3, path: '/analyses', permission: isPDG },
        { id: 'kpi', text: 'Indicateurs (KPI)', icon: Gauge, path: '/kpi', permission: isPDG }
      ]
    },
    {
      name: 'ADMINISTRATION',
      icon: Shield,
      items: [
        { id: 'utilisateurs', text: 'Utilisateurs', icon: Users, path: '/utilisateurs', permission: isPDG },
        { id: 'nouvel-utilisateur', text: 'Nouvel Utilisateur', icon: UserPlus, path: '/utilisateurs/ajouter', permission: isPDG },
        { id: 'roles', text: 'Rôles & Permissions', icon: Shield, path: '/roles', permission: isPDG },
        { id: 'separator-admin-1', text: '', icon: null, path: '#', permission: isPDG, separator: true },
        { id: 'company-config', text: 'Configuration APG', icon: Building2, path: '/company-config', permission: isPDG },
        { id: 'numerotation', text: 'Numérotation', icon: Hash, path: '/numerotation', permission: isPDG },
        { id: 'document-templates', text: 'Modèles Documents', icon: Printer, path: '/document-templates', permission: isPDG },
        { id: 'separator-admin-2', text: '', icon: null, path: '#', permission: isPDG, separator: true },
        { id: 'backups', text: 'Sauvegardes', icon: Database, path: '/backups', permission: isPDG },
        { id: 'restauration', text: 'Restauration', icon: RotateCcw, path: '/restauration', permission: isPDG },
        { id: 'audit', text: "Journal d'audit", icon: History, path: '/audit', permission: isPDG },
        { id: 'connexions', text: 'Historique Connexions', icon: Activity, path: '/connexions', permission: isPDG },
        { id: 'system-settings', text: 'Paramètres Système', icon: Cog, path: '/system-settings', permission: isPDG },
        { id: 'api-keys', text: 'Clés API', icon: Key, path: '/api-keys', permission: isPDG }
      ]
    },
    {
      name: 'RESSOURCES HUMAINES',
      icon: Users,
      items: [
        // ✅ NOUVEAU : Tableau de bord RH en premier
        { id: 'dashboard-rh', text: 'Tableau de Bord RH', icon: Gauge, path: '/dashboard-rh', permission: isPDG || isRH },
        { id: 'separator-rh-dash', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Départements & Postes -----
        { id: 'departements', text: 'Départements', icon: Building2, path: '/departements', permission: isPDG || isRH },
        { id: 'postes', text: 'Postes', icon: Briefcase, path: '/postes', permission: isPDG || isRH },
        { id: 'separator-rh-orga', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Employés -----
        { id: 'employes', text: 'Employés', icon: Users, path: '/employes', permission: isPDG || isRH },
        { id: 'nouvel-employe', text: 'Nouvel Employé', icon: UserPlus, path: '/employes/ajouter', permission: isPDG || isRH },
        { id: 'organigramme', text: 'Organigramme', icon: Layers, path: '/organigramme', permission: isPDG || isRH },
        { id: 'statistiques-rh', text: 'Statistiques RH', icon: BarChart3, path: '/employes/statistiques', permission: isPDG || isRH },
        { id: 'separator-rh-1', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Contrats -----
        { id: 'contrats', text: 'Contrats', icon: FileCheck, path: '/contrats', permission: isPDG || isRH, badge: contratsExpirant },
        { id: 'nouveau-contrat', text: 'Nouveau Contrat', icon: FilePlus, path: '/contrats/ajouter', permission: isPDG || isRH },
        { id: 'contrats-expirant', text: 'Contrats Expirants', icon: CalendarClock, path: '/contrats/expirant', permission: isPDG || isRH, badge: contratsExpirant },
        { id: 'separator-rh-2', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Présences -----
        { id: 'presences', text: 'Présences', icon: ClipboardCheck, path: '/presences', permission: isPDG || isRH },
        { id: 'presences-aujourdhui', text: 'Présences du Jour', icon: Calendar, path: '/presences/aujourdhui', permission: isPDG || isRH },
        { id: 'pointage', text: 'Pointage', icon: Fingerprint, path: '/pointage', permission: isPDG || isRH },
        { id: 'absences', text: 'Absences', icon: AlertCircle, path: '/absences', permission: isPDG || isRH },
        { id: 'separator-rh-3', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Congés -----
        { id: 'conges', text: 'Congés', icon: CalendarDays, path: '/conges', permission: isPDG || isRH, badge: congesEnAttente },
        { id: 'demandes-conges', text: 'Demandes en Attente', icon: Inbox, path: '/conges/en_attente', permission: isPDG || isRH, badge: congesEnAttente },
        { id: 'nouveau-conge', text: 'Nouvelle Demande', icon: FilePlus, path: '/conges/ajouter', permission: isPDG || isRH },
        { id: 'mes-conges', text: 'Mes Congés', icon: UserCheck, path: '/conges/mes_conges', permission: true },
        { id: 'soldes-conges', text: 'Soldes de Congés', icon: Calculator, path: '/soldes-conges', permission: isPDG || isRH },
        { id: 'separator-rh-4', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Jours travaillés -----
        { id: 'jours-travailles', text: 'Jours Travaillés', icon: CalendarDays, path: '/jours-travailles', permission: isPDG || isRH },
        { id: 'separator-rh-5', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },

        // ----- Évaluations & Formations -----
        { id: 'evaluations', text: 'Évaluations', icon: Award, path: '/evaluations', permission: isPDG || isRH },
        { id: 'nouvelle-evaluation', text: 'Nouvelle Évaluation', icon: PlusCircle, path: '/evaluations/ajouter', permission: isPDG || isRH },
        { id: 'formations', text: 'Formations', icon: BookOpen, path: '/formations', permission: isPDG || isRH },
        { id: 'nouvelle-formation', text: 'Nouvelle Formation', icon: PlusCircle, path: '/formations/ajouter', permission: isPDG || isRH }
      ]
    },
    {
      name: 'PAIE',
      icon: Wallet,
      items: [
        { id: 'dashboard-paie', text: 'Tableau de Bord Paie', icon: Gauge, path: '/dashboard-paie', permission: isPDG || isRH || isComptable },
        { id: 'preparation-paie', text: 'Préparation Paie', icon: ClipboardList, path: '/paie-preparation', permission: isPDG || isRH, badge: paieEnAttente },
        { id: 'calcul-paie', text: 'Calcul de la Paie', icon: Calculator, path: '/paie-calcul', permission: isPDG || isRH },
        { id: 'controle-paie', text: 'Contrôle Paie', icon: ClipboardCheck, path: '/paie-controle', permission: isPDG || isRH || isComptable },
        { id: 'validation-paie', text: 'Validation Paie', icon: CheckCircle, path: '/paie-validation', permission: isPDG },
        { id: 'separator-paie-1', text: '', icon: null, path: '#', permission: isPDG || isRH || isComptable, separator: true },
        { id: 'etat-salaire', text: 'État de Salaire', icon: FileText, path: '/etat-salaire', permission: isPDG || isRH || isComptable },
        { id: 'fiches-paie', text: 'Fiches de Paie', icon: Receipt, path: '/fiches-paie', permission: isPDG || isRH || isComptable },
        { id: 'bulletins-paie', text: 'Bulletins de Paie', icon: FileText, path: '/bulletins-paie', permission: isPDG || isRH || isComptable },
        { id: 'separator-paie-2', text: '', icon: null, path: '#', permission: isPDG || isRH, separator: true },
        { id: 'avances-salaire', text: 'Avances sur Salaire', icon: HandCoins, path: '/avances-salaire', permission: isPDG || isRH || isComptable },
        { id: 'primes', text: 'Primes & Indemnités', icon: DollarSign, path: '/primes', permission: isPDG || isRH },
        { id: 'retenues', text: 'Retenues', icon: FileMinus, path: '/retenues', permission: isPDG || isRH || isComptable },
        { id: 'separator-paie-3', text: '', icon: null, path: '#', permission: isPDG || isRH || isComptable, separator: true },
        { id: 'historique-paie', text: 'Historique Paie', icon: History, path: '/historique-paie', permission: isPDG || isRH || isComptable },
        { id: 'archives-paie', text: 'Archives Paie', icon: Archive, path: '/archives-paie', permission: isPDG || isComptable },
        { id: 'rapports-paie', text: 'Rapports Paie', icon: FileSpreadsheet, path: '/rapports-paie', permission: isPDG || isRH || isComptable }
      ]
    },
    {
      name: 'CLIENTS & CONTRATS',
      icon: Users,
      items: [
        { id: 'clients', text: 'Clients', icon: Users, path: '/clients', permission: isPDG || isComptable },
        { id: 'nouveau-client', text: 'Nouveau Client', icon: UserPlus, path: '/clients/ajouter', permission: isPDG || isComptable },
        { id: 'clients-particuliers', text: 'Particuliers', icon: Users, path: '/clients-particuliers', permission: isPDG || isComptable },
        { id: 'clients-entreprises', text: 'Entreprises', icon: Building2, path: '/clients-entreprises', permission: isPDG || isComptable },
        { id: 'clients-administrations', text: 'Administrations', icon: Landmark, path: '/clients-administrations', permission: isPDG || isComptable },
        { id: 'clients-ong', text: 'ONG', icon: Handshake, path: '/clients-ong', permission: isPDG || isComptable },
        { id: 'clients-collectivites', text: 'Collectivités', icon: Map, path: '/clients-collectivites', permission: isPDG || isComptable },
        { id: 'separator-clients-1', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'contrats-clients', text: 'Contrats Clients', icon: FileSignature, path: '/contrats-clients', permission: isPDG || isComptable, badge: contratsExpirant },
        { id: 'nouveau-contrat-client', text: 'Nouveau Contrat', icon: FilePlus, path: '/contrats-clients/ajouter', permission: isPDG || isComptable },
        { id: 'contrats-expirant-clients', text: 'Contrats Expirants', icon: CalendarClock, path: '/contrats-clients/expirant', permission: isPDG || isComptable, badge: contratsExpirant },
        { id: 'separator-clients-2', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'devis', text: 'Devis', icon: FileText, path: '/devis', permission: isPDG || isComptable },
        { id: 'nouveau-devis', text: 'Nouveau Devis', icon: FilePlus, path: '/devis/ajouter', permission: isPDG || isComptable },
        { id: 'factures', text: 'Factures', icon: Receipt, path: '/factures', permission: isPDG || isComptable, badge: facturesImpayees },
        { id: 'nouvelle-facture', text: 'Nouvelle Facture', icon: PlusCircle, path: '/factures/ajouter', permission: isPDG || isComptable },
        { id: 'factures-proforma', text: 'Factures Pro-forma', icon: FileClock, path: '/factures-proforma', permission: isPDG || isComptable },
        { id: 'avoirs', text: 'Avoirs', icon: FileMinus, path: '/avoirs', permission: isPDG || isComptable }
      ]
    },
    {
      name: 'FACTURATION & RECOUVREMENT',
      icon: Receipt,
      items: [
        { id: 'factures-recouvrement', text: 'Factures Clients', icon: Receipt, path: '/factures-recouvrement', permission: isPDG || isComptable, badge: facturesImpayees },
        { id: 'factures-echues', text: 'Factures Échues', icon: AlertTriangle, path: '/factures-echues', permission: isPDG || isComptable, badge: facturesImpayees },
        { id: 'factures-non-echues', text: 'Factures Non Échues', icon: FileClock, path: '/factures-non-echues', permission: isPDG || isComptable },
        { id: 'separator-recouvrement-1', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'recouvrement', text: 'Recouvrement', icon: HandCoins, path: '/recouvrement', permission: isPDG || isComptable },
        { id: 'relances', text: 'Relances Clients', icon: Send, path: '/relances', permission: isPDG || isComptable },
        { id: 'historique-relances', text: 'Historique Relances', icon: History, path: '/historique-relances', permission: isPDG || isComptable },
        { id: 'separator-recouvrement-2', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'creances', text: 'Créances Clients', icon: HandCoins, path: '/creances', permission: isPDG || isComptable },
        { id: 'litiges', text: 'Litiges', icon: AlertTriangle, path: '/litiges', permission: isPDG || isComptable },
        { id: 'paiements-clients', text: 'Paiements Clients', icon: CreditCard, path: '/paiements-clients', permission: isPDG || isComptable }
      ]
    },
    {
      name: 'TRÉSORERIE',
      icon: Wallet,
      items: [
        { id: 'dashboard-tresorerie', text: 'Tableau de Bord Trésorerie', icon: Gauge, path: '/dashboard-tresorerie', permission: isPDG || isComptable },
        { id: 'caisses', text: 'Caisses', icon: Banknote, path: '/caisses', permission: isPDG || isComptable },
        { id: 'nouvelle-caisse', text: 'Nouvelle Caisse', icon: PlusCircle, path: '/caisses/ajouter', permission: isPDG },
        { id: 'etat-caisse', text: 'État de Caisse', icon: ClipboardList, path: '/etat-caisse', permission: isPDG || isComptable },
        { id: 'comptes-bancaires', text: 'Comptes Bancaires', icon: Landmark, path: '/comptes-bancaires', permission: isPDG || isComptable },
        { id: 'nouveau-compte-bancaire', text: 'Nouveau Compte', icon: PlusCircle, path: '/comptes-bancaires/ajouter', permission: isPDG },
        { id: 'mobile-money', text: 'Mobile Money', icon: Smartphone, path: '/mobile-money', permission: isPDG || isComptable },
        { id: 'separator-tresorerie-1', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'encaissements', text: 'Encaissements', icon: ArrowDownRight, path: '/encaissements', permission: isPDG || isComptable },
        { id: 'nouvel-encaissement', text: 'Nouvel Encaissement', icon: PlusCircle, path: '/encaissements/ajouter', permission: isPDG || isComptable },
        { id: 'decaissements', text: 'Décaissements', icon: ArrowUpRight, path: '/decaissements', permission: isPDG || isComptable, badge: depensesEnAttente },
        { id: 'nouveau-decaissement', text: 'Nouveau Décaissement', icon: PlusCircle, path: '/decaissements/ajouter', permission: isPDG || isComptable },
        { id: 'mouvements-tresorerie', text: 'Mouvements Trésorerie', icon: Coins, path: '/mouvements-tresorerie', permission: isPDG || isComptable },
        { id: 'separator-tresorerie-2', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'previsions', text: 'Prévisions', icon: CalendarDays, path: '/previsions', permission: isPDG || isComptable },
        { id: 'rapprochement-bancaire', text: 'Rapprochement Bancaire', icon: CheckCircle, path: '/rapprochement-bancaire', permission: isPDG || isComptable },
        { id: 'alertes-tresorerie', text: 'Alertes Trésorerie', icon: AlertCircle, path: '/alertes-tresorerie', permission: isPDG || isComptable }
      ]
    },
    {
      name: 'COMPTABILITÉ',
      icon: Calculator,
      items: [
        { id: 'dashboard-comptabilite', text: 'Tableau de Bord Comptable', icon: Gauge, path: '/dashboard-comptabilite', permission: isPDG || isComptable },
        { id: 'plan-comptable', text: 'Plan Comptable', icon: Grid3x3, path: '/plan-comptable', permission: isPDG || isComptable },
        { id: 'journaux', text: 'Journaux', icon: BookOpen, path: '/journaux', permission: isPDG || isComptable },
        { id: 'ecritures-comptables', text: 'Écritures Comptables', icon: BookOpen, path: '/ecritures-comptables', permission: isPDG || isComptable },
        { id: 'grand-livre', text: 'Grand Livre', icon: Scale, path: '/grand-livre', permission: isPDG || isComptable },
        { id: 'balance', text: 'Balance Générale', icon: TableProperties, path: '/balance', permission: isPDG || isComptable },
        { id: 'lettrage', text: 'Lettrage', icon: CheckSquare, path: '/lettrage', permission: isPDG || isComptable },
        { id: 'cloture', text: 'Clôture', icon: Lock, path: '/cloture', permission: isPDG },
        { id: 'separator-compta-1', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'etats-financiers', text: 'États Financiers', icon: FileSpreadsheet, path: '/etats-financiers', permission: isPDG || isComptable },
        { id: 'bilan', text: 'Bilan', icon: FileText, path: '/bilan', permission: isPDG || isComptable },
        { id: 'compte-resultat', text: 'Compte de Résultat', icon: TrendingUp, path: '/compte-resultat', permission: isPDG || isComptable },
        { id: 'declarations-fiscales', text: 'Déclarations Fiscales', icon: FileText, path: '/declarations-fiscales', permission: isPDG || isComptable },
        { id: 'separator-compta-2', text: '', icon: null, path: '#', permission: isPDG || isComptable, separator: true },
        { id: 'rapports-comptables', text: 'Rapports Comptables', icon: FileSpreadsheet, path: '/rapports-comptables', permission: isPDG || isComptable }
      ]
    },
    {
      name: 'LOGISTIQUE & STOCKS',
      icon: Package,
      items: [
        { id: 'dashboard-stocks', text: 'Tableau de Bord Stocks', icon: Gauge, path: '/dashboard-stocks', permission: isPDG || isLogistique },
        { id: 'articles', text: 'Articles', icon: Package, path: '/articles', permission: isPDG || isLogistique },
        { id: 'nouvel-article', text: 'Nouvel Article', icon: PlusCircle, path: '/articles/ajouter', permission: isPDG || isLogistique },
        { id: 'categories-articles', text: 'Catégories', icon: Tags, path: '/categories-articles', permission: isPDG || isLogistique },
        { id: 'separator-stocks-1', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'magasins', text: 'Magasins', icon: Warehouse, path: '/magasins', permission: isPDG || isLogistique },
        { id: 'nouveau-magasin', text: 'Nouveau Magasin', icon: PlusCircle, path: '/magasins/ajouter', permission: isPDG },
        { id: 'stock-critique', text: 'Stock Critique', icon: AlertTriangle, path: '/stock-critique', permission: isPDG || isLogistique, badge: stockCritique },
        { id: 'separator-stocks-2', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'mouvements-stock', text: 'Mouvements de Stock', icon: ArrowLeftRight, path: '/mouvements-stock', permission: isPDG || isLogistique },
        { id: 'entree-stock', text: 'Entrée de Stock', icon: ArrowDownRight, path: '/entree-stock', permission: isPDG || isLogistique },
        { id: 'sortie-stock', text: 'Sortie de Stock', icon: ArrowUpRight, path: '/sortie-stock', permission: isPDG || isLogistique },
        { id: 'inventaire', text: 'Inventaire', icon: ClipboardCheck, path: '/inventaire', permission: isPDG || isLogistique },
        { id: 'separator-stocks-3', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'equipements', text: 'Équipements', icon: HardHat, path: '/equipements', permission: isPDG || isLogistique },
        { id: 'affectations', text: 'Affectations', icon: UserCheck, path: '/affectations', permission: isPDG || isLogistique },
        { id: 'rapports-stocks', text: 'Rapports Stocks', icon: FileSpreadsheet, path: '/rapports-stocks', permission: isPDG || isLogistique }
      ]
    },
    {
      name: 'TRICYCLES & VÉHICULES',
      icon: Truck,
      items: [
        { id: 'tricycles', text: 'Tricycles', icon: Truck, path: '/tricycles', permission: isPDG || isLogistique },
        { id: 'nouveau-tricycle', text: 'Nouveau Tricycle', icon: PlusCircle, path: '/tricycles/ajouter', permission: isPDG || isLogistique },
        { id: 'vehicules', text: 'Véhicules', icon: Truck, path: '/vehicules', permission: isPDG || isLogistique },
        { id: 'nouveau-vehicule', text: 'Nouveau Véhicule', icon: PlusCircle, path: '/vehicules/ajouter', permission: isPDG || isLogistique },
        { id: 'separator-tricycles-1', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'conducteurs', text: 'Conducteurs', icon: UserCheck, path: '/conducteurs', permission: isPDG || isLogistique },
        { id: 'affectations-vehicules', text: 'Affectations', icon: UserCheck, path: '/affectations-vehicules', permission: isPDG || isLogistique },
        { id: 'separator-tricycles-2', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'documents-vehicules', text: 'Documents Véhicules', icon: FileText, path: '/documents-vehicules', permission: isPDG || isLogistique },
        { id: 'assurances', text: 'Assurances', icon: Shield, path: '/assurances', permission: isPDG || isLogistique },
        { id: 'suivi-vehicules', text: 'Suivi GPS', icon: Navigation, path: '/suivi-vehicules', permission: isPDG || isLogistique },
        { id: 'rapports-vehicules', text: 'Rapports Véhicules', icon: FileSpreadsheet, path: '/rapports-vehicules', permission: isPDG || isLogistique }
      ]
    },
    {
      name: 'CARBURANT & MAINTENANCE',
      icon: Droplet,
      items: [
        { id: 'carburant', text: 'Carburant', icon: Droplet, path: '/carburant', permission: isPDG || isLogistique, badge: carburantAlerte },
        { id: 'nouveau-carburant', text: 'Nouveau Plein', icon: PlusCircle, path: '/carburant/ajouter', permission: isPDG || isLogistique },
        { id: 'suivi-carburant', text: 'Suivi Consommation', icon: TrendingUp, path: '/suivi-carburant', permission: isPDG || isLogistique },
        { id: 'alertes-carburant', text: 'Alertes Carburant', icon: AlertTriangle, path: '/alertes-carburant', permission: isPDG || isLogistique, badge: carburantAlerte },
        { id: 'separator-carburant-1', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'maintenance', text: 'Maintenance', icon: Cog, path: '/maintenance', permission: isPDG || isLogistique, badge: tricyclesEnMaintenance },
        { id: 'nouvelle-maintenance', text: 'Nouvelle Intervention', icon: PlusCircle, path: '/maintenance/ajouter', permission: isPDG || isLogistique },
        { id: 'planning-maintenance', text: 'Planning Maintenance', icon: CalendarClock, path: '/planning-maintenance', permission: isPDG || isLogistique },
        { id: 'historique-maintenance', text: 'Historique Maintenance', icon: History, path: '/historique-maintenance', permission: isPDG || isLogistique },
        { id: 'separator-carburant-2', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'pieces-detachees', text: 'Pièces Détachées', icon: Package, path: '/pieces-detachees', permission: isPDG || isLogistique },
        { id: 'rapports-carburant', text: 'Rapports Carburant', icon: FileSpreadsheet, path: '/rapports-carburant', permission: isPDG || isLogistique }
      ]
    },
    {
      name: 'EXPLOITATION / MISSIONS',
      icon: HardHat,
      items: [
        { id: 'missions', text: 'Missions', icon: Target, path: '/missions', permission: isPDG || isSuperviseur, badge: missionsEnCours },
        { id: 'nouvelle-mission', text: 'Nouvelle Mission', icon: PlusCircle, path: '/missions/ajouter', permission: isPDG || isSuperviseur },
        { id: 'missions-en-cours', text: 'Missions en Cours', icon: Timer, path: '/missions/en-cours', permission: isPDG || isSuperviseur, badge: missionsEnCours },
        { id: 'historique-missions', text: 'Historique Missions', icon: History, path: '/historique-missions', permission: isPDG || isSuperviseur },
        { id: 'separator-exploitation-1', text: '', icon: null, path: '#', permission: isPDG || isSuperviseur, separator: true },
        { id: 'equipes', text: 'Équipes', icon: Users, path: '/equipes', permission: isPDG || isSuperviseur },
        { id: 'nouvelle-equipe', text: 'Nouvelle Équipe', icon: PlusCircle, path: '/equipes/ajouter', permission: isPDG || isSuperviseur },
        { id: 'presences-terrain', text: 'Présences Terrain', icon: ClipboardCheck, path: '/presences-terrain', permission: isPDG || isSuperviseur },
        { id: 'pointage-terrain', text: 'Pointage Terrain', icon: Fingerprint, path: '/pointage-terrain', permission: isPDG || isSuperviseur },
        { id: 'separator-exploitation-2', text: '', icon: null, path: '#', permission: isPDG || isSuperviseur, separator: true },
        { id: 'activites-terrain', text: 'Activités Terrain', icon: Activity, path: '/activites-terrain', permission: isPDG || isSuperviseur },
        { id: 'incidents', text: 'Incidents', icon: AlertTriangle, path: '/incidents', permission: isPDG || isSuperviseur },
        { id: 'rapports-terrain', text: 'Rapports Terrain', icon: FileSpreadsheet, path: '/rapports-terrain', permission: isPDG || isSuperviseur }
      ]
    },
    {
      name: 'FOURNISSEURS & ACHATS',
      icon: Briefcase,
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: isPDG || isLogistique },
        { id: 'nouveau-fournisseur', text: 'Nouveau Fournisseur', icon: PlusCircle, path: '/fournisseurs/ajouter', permission: isPDG || isLogistique },
        { id: 'evaluations-fournisseurs', text: 'Évaluations', icon: Star, path: '/evaluations-fournisseurs', permission: isPDG || isLogistique },
        { id: 'separator-achats-1', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'demandes-achat', text: "Demandes d'Achat", icon: FilePlus, path: '/demandes-achat', permission: isPDG || isLogistique },
        { id: 'nouvelle-demande-achat', text: 'Nouvelle Demande', icon: PlusCircle, path: '/demandes-achat/ajouter', permission: isPDG || isLogistique },
        { id: 'validation-demandes', text: 'Validation Demandes', icon: CheckSquare, path: '/validation-demandes', permission: isPDG },
        { id: 'separator-achats-2', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'devis-fournisseurs', text: 'Devis Fournisseurs', icon: FileText, path: '/devis-fournisseurs', permission: isPDG || isLogistique },
        { id: 'bons-commande', text: 'Bons de Commande', icon: ClipboardList, path: '/bons-commande', permission: isPDG || isLogistique },
        { id: 'nouveau-bon-commande', text: 'Nouveau Bon de Commande', icon: PlusCircle, path: '/bons-commande/ajouter', permission: isPDG || isLogistique },
        { id: 'separator-achats-3', text: '', icon: null, path: '#', permission: isPDG || isLogistique, separator: true },
        { id: 'receptions', text: 'Réceptions', icon: Package, path: '/receptions', permission: isPDG || isLogistique },
        { id: 'factures-fournisseurs', text: 'Factures Fournisseurs', icon: Receipt, path: '/factures-fournisseurs', permission: isPDG || isComptable },
        { id: 'paiements-fournisseurs', text: 'Paiements Fournisseurs', icon: CreditCard, path: '/paiements-fournisseurs', permission: isPDG || isComptable }
      ]
    },
    {
      name: 'DOCUMENTS',
      icon: Archive,
      items: [
        { id: 'documents', text: 'Tous les Documents', icon: FolderOpen, path: '/documents', permission: true },
        { id: 'documents-recents', text: 'Documents Récents', icon: FileClock, path: '/documents-recents', permission: true },
        { id: 'mes-documents', text: 'Mes Documents', icon: Folder, path: '/mes-documents', permission: true },
        { id: 'separator-docs-1', text: '', icon: null, path: '#', permission: isStaff, separator: true },
        { id: 'documents-rh-section', text: 'Documents RH', icon: Users, path: '/documents-rh-section', permission: isPDG || isRH },
        { id: 'documents-comptables', text: 'Documents Comptables', icon: Calculator, path: '/documents-comptables', permission: isPDG || isComptable },
        { id: 'documents-vehicules-section', text: 'Documents Véhicules', icon: Truck, path: '/documents-vehicules-section', permission: isPDG || isLogistique },
        { id: 'documents-fournisseurs-section', text: 'Documents Fournisseurs', icon: Building2, path: '/documents-fournisseurs-section', permission: isPDG || isLogistique },
        { id: 'documents-clients-section', text: 'Documents Clients', icon: Users, path: '/documents-clients-section', permission: isPDG || isComptable },
        { id: 'separator-docs-2', text: '', icon: null, path: '#', permission: isPDG, separator: true },
        { id: 'archives-documents', text: 'Archives', icon: Archive, path: '/archives-documents', permission: isPDG }
      ]
    },
    {
      name: 'RAPPORTS',
      icon: FileText,
      items: [
        { id: 'rapports-financiers', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers', permission: isPDG || isComptable },
        { id: 'rapports-rh', text: 'Rapports RH', icon: Users, path: '/rapports-rh', permission: isPDG || isRH },
        { id: 'rapports-paie', text: 'Rapports Paie', icon: FileSpreadsheet, path: '/rapports-paie', permission: isPDG || isRH || isComptable },
        { id: 'rapports-clients', text: 'Rapports Clients', icon: Users, path: '/rapports-clients', permission: isPDG || isComptable },
        { id: 'rapports-stocks', text: 'Rapports Stocks', icon: Package, path: '/rapports-stocks', permission: isPDG || isLogistique },
        { id: 'rapports-logistiques', text: 'Rapports Logistiques', icon: Truck, path: '/rapports-logistiques', permission: isPDG || isLogistique },
        { id: 'rapports-exploitation', text: 'Rapports Exploitation', icon: HardHat, path: '/rapports-exploitation', permission: isPDG || isSuperviseur },
        { id: 'rapports-environnement', text: 'Rapports Environnementaux', icon: Leaf, path: '/rapports-environnement', permission: isPDG },
        { id: 'rapports-pdg', text: 'Rapports Direction', icon: Target, path: '/rapports-pdg', permission: isPDG }
      ]
    },
    {
      name: 'ALERTES',
      icon: BellRing,
      items: [
        { id: 'toutes-alertes', text: 'Toutes les Alertes', icon: Bell, path: '/alertes', permission: true, badge: notificationsCount },
        { id: 'alertes-rh', text: 'Alertes RH', icon: Users, path: '/alertes-rh', permission: isPDG || isRH, badge: contratsExpirant + congesEnAttente },
        { id: 'alertes-finance', text: 'Alertes Finance', icon: DollarSign, path: '/alertes-finance', permission: isPDG || isComptable, badge: facturesImpayees + depensesEnAttente },
        { id: 'alertes-logistique', text: 'Alertes Logistique', icon: Package, path: '/alertes-logistique', permission: isPDG || isLogistique, badge: stockCritique + carburantAlerte },
        { id: 'alertes-vehicules', text: 'Alertes Véhicules', icon: Truck, path: '/alertes-vehicules', permission: isPDG || isLogistique, badge: tricyclesEnMaintenance },
        { id: 'alertes-exploitation', text: 'Alertes Exploitation', icon: HardHat, path: '/alertes-exploitation', permission: isPDG || isSuperviseur, badge: missionsEnCours },
        { id: 'separator-alertes-1', text: '', icon: null, path: '#', permission: isPDG, separator: true },
        { id: 'config-alertes', text: 'Configurer les Alertes', icon: Settings, path: '/config-alertes', permission: isPDG },
        { id: 'canaux-notification', text: 'Canaux de Notification', icon: Send, path: '/canaux-notification', permission: isPDG }
      ]
    },
    {
      name: 'MON ESPACE',
      icon: UserCircle,
      items: [
        { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
        { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount },
        { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
        { id: 'mes-documents', text: 'Mes Documents', icon: Folder, path: '/mes-documents', permission: true },
        { id: 'mes-conges', text: 'Mes Congés', icon: CalendarDays, path: '/mes-conges', permission: true },
        { id: 'mes-fiches-paie', text: 'Mes Fiches de Paie', icon: Receipt, path: '/mes-fiches-paie', permission: true },
        { id: 'mes-presences', text: 'Mes Présences', icon: ClipboardCheck, path: '/mes-presences', permission: true },
        { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
      ]
    }
  ];

  // Filtrer les sections vides
  const visibleSections = menuSections
    .map(section => {
      const visibleItems = section.items.filter(item => item.permission === true);
      return { ...section, items: visibleItems };
    })
    .filter(section => section.items.length > 0);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuSearchResults = searchQuery.length > 1 ?
    visibleSections.flatMap(section =>
      section.items.filter(item =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(item => ({ ...item, section: section.name, type: 'menu' }))
    ) : [];

  const allSearchResults = [
    ...menuSearchResults,
    ...searchResults.map(r => ({ ...r, type: 'data' }))
  ];

  const renderMenuItem = (item, sectionName, isActive) => {
    if (item.separator) {
      return <div key={item.id} className="border-t border-primary/20 my-2 mx-1"></div>;
    }

    const ItemIcon = item.icon;
    const isNewItem = item.id && (item.id.startsWith('nouveau-') || item.id.startsWith('nouvelle-'));
    const badgeValue = typeof item.badge === 'number' && item.badge > 0 ? item.badge : 0;

    return (
      <Link
        key={item.id}
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
          ${isActive
            ? 'bg-primary text-primary-content shadow-md'
            : 'text-base-content/60 hover:bg-primary/10 hover:text-primary'
          }
          ${isNewItem && !isActive ? 'border-l-2 border-secondary pl-3' : ''}
        `}
      >
        {ItemIcon && <ItemIcon className={`w-4 h-4 ${isActive ? 'text-inherit' : ''}`} />}
        <span className="flex-1">{item.text}</span>
        {isNewItem && !isActive && (
          <span className="badge badge-success badge-xs">Nouveau</span>
        )}
        {badgeValue > 0 && (
          <span className={`badge badge-error badge-xs ${isActive ? 'badge-outline' : ''}`}>
            {badgeValue > 99 ? '99+' : badgeValue}
          </span>
        )}
      </Link>
    );
  };

  const getSectionBadge = (sectionName) => {
    switch (sectionName) {
      case 'ADMINISTRATION': return validationsEnAttente;
      case 'RESSOURCES HUMAINES': return contratsExpirant + congesEnAttente;
      case 'PAIE': return paieEnAttente;
      case 'CLIENTS & CONTRATS': return contratsExpirant + facturesImpayees;
      case 'FACTURATION & RECOUVREMENT': return facturesImpayees;
      case 'TRÉSORERIE': return depensesEnAttente;
      case 'LOGISTIQUE & STOCKS': return stockCritique;
      case 'TRICYCLES & VÉHICULES': return tricyclesEnMaintenance;
      case 'CARBURANT & MAINTENANCE': return carburantAlerte + tricyclesEnMaintenance;
      case 'EXPLOITATION / MISSIONS': return missionsEnCours;
      case 'FOURNISSEURS & ACHATS': return validationsEnAttente;
      case 'ALERTES': return notificationsCount;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-base-200">

      {/* Overlay recherche */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="flex items-start justify-center pt-20 px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-3xl bg-base-100 rounded-2xl shadow-2xl overflow-hidden border border-primary/20">
              <div className="p-4 border-b border-base-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Rechercher un menu, client, facture, employé... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base-content placeholder:text-base-content/40"
                    autoFocus
                  />
                  {isSearching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                  <button onClick={() => setIsSearchOpen(false)} className="p-1 rounded-lg hover:bg-base-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {allSearchResults.length > 0 ? (
                  <>
                    {menuSearchResults.length > 0 && (
                      <div className="px-3 py-1">
                        <span className="text-xs font-semibold text-base-content/40 uppercase">Menus</span>
                      </div>
                    )}
                    {menuSearchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        {item.icon && <item.icon className="w-5 h-5 text-primary" />}
                        <div>
                          <p className="text-sm font-medium text-base-content">{item.text}</p>
                          <p className="text-xs text-base-content/40">{item.section}</p>
                        </div>
                      </Link>
                    ))}
                    {searchResults.length > 0 && (
                      <div className="px-3 py-1 mt-2">
                        <span className="text-xs font-semibold text-base-content/40 uppercase">Données</span>
                      </div>
                    )}
                    {searchResults.map((item, idx) => (
                      <Link
                        key={`data-${idx}`}
                        to={item.url || '#'}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <FileSearch className="w-5 h-5 text-info" />
                        <div>
                          <p className="text-sm font-medium text-base-content">{item.label || item.name}</p>
                          <p className="text-xs text-base-content/40">{item.type_label || item.type}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : searchQuery.length > 1 ? (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Aucun résultat pour "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Tapez pour rechercher un menu ou une donnée</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre supérieure */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-b-2 border-primary/30">
        <div className="px-4 sm:px-6 lg:pl-72">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
              >
                {sidebarOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/dashboard" className="hidden lg:flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-content/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center shadow-lg border-2 border-secondary overflow-hidden">
                    {!loadingEtab && logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={etablissement?.nom || 'APG Logo'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Recycle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-primary-content font-bold text-lg tracking-wide">
                    {!loadingEtab ? (etablissement?.nom || 'APG ASSAINISSEMENT') : 'Chargement...'}
                  </h1>
                  <p className="text-primary-content/60 text-[10px] font-medium">
                    {!loadingEtab ? (etablissement?.sigle || 'Gestion des Déchets') : ''}
                  </p>
                </div>
              </Link>

              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center border-2 border-secondary overflow-hidden">
                  {!loadingEtab && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={etablissement?.nom || 'Logo'}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Recycle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <span className="text-primary-content font-bold text-sm">
                  {!loadingEtab ? (etablissement?.nom || 'APG') : 'Chargement...'}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedDate}</span>
                <div className="w-px h-4 bg-primary-content/30 mx-1"></div>
                <Clock className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title="Rechercher (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                to="/alertes"
                className="relative p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title="Alertes"
              >
                <Bell className="w-5 h-5" />
                {notificationsCount > 0 && (
                  <span className="absolute top-0 right-0 badge badge-error badge-xs">
                    {notificationsCount > 99 ? '99+' : notificationsCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10">
                <RoleIcon className="w-4 h-4 text-primary-content" />
                <span className="text-primary-content text-xs font-medium">{roleConfig.label}</span>
              </div>

              <button
                onClick={toggleColorMode}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title={mode === 'dark' ? "Mode clair" : "Mode sombre"}
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-primary-content/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-content font-bold border-2 border-primary-content shadow-md">
                    {userInitial || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-primary-content hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-xl shadow-xl z-50 border border-primary/20 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-content">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary-content/20 flex items-center justify-center text-xl font-bold">
                            {userInitial || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{userFullName || userName}</p>
                            <p className="text-xs text-primary-content/70 truncate">{userEmail}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className={`badge badge-${roleConfig.color} badge-sm`}>
                                {roleConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <UserCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mon profil</span>
                        </Link>
                        <Link to="/my-preferences" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <Settings className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes préférences</span>
                        </Link>
                        <Link to="/my-notifications" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <BellRing className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes notifications</span>
                          {notificationsCount > 0 && <span className="badge badge-error badge-xs ml-auto">{notificationsCount}</span>}
                        </Link>
                        <Link to="/mes-fiches-paie" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <Receipt className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes fiches de paie</span>
                        </Link>
                        <Link to="/mes-conges" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <CalendarDays className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes congés</span>
                        </Link>
                        <Link to="/support" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors">
                          <HelpCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Support</span>
                        </Link>
                        <div className="border-t border-base-200 my-1"></div>
                        <button onClick={logoutUser} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 transition-colors text-error">
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed left-0 top-16 bottom-0 z-30
        bg-base-100 shadow-xl border-r border-primary/20
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        hidden lg:block
      `}>
        <div className="h-full flex flex-col">

          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'} bg-gradient-to-r from-primary/5 to-transparent`}>
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'} gap-3`}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {!loadingEtab && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <Recycle className="w-6 h-6 text-white" />
                )}
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-base-content text-sm">
                    {!loadingEtab ? (etablissement?.nom || 'APG ASSAINISSEMENT') : 'Chargement...'}
                  </h2>
                  <p className="text-xs text-base-content/50">
                    {!loadingEtab ? (etablissement?.sigle || 'Gestion des Déchets') : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'}`}>
            <div className={`flex items-center ${!sidebarOpen && 'flex-col'} gap-3`}>
              <div className={`bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-xl ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'} shadow-lg ring-2 ring-primary/20 flex items-center justify-center`}>
                <span className={`${sidebarOpen ? 'text-xl' : 'text-lg'} font-bold`}>{userInitial || 'U'}</span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-base-content">{userFullName || userName}</p>
                  <p className="text-xs text-base-content/50 truncate">{userEmail}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className={`badge badge-${roleConfig.color} badge-sm`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleSections.map((section, idx) => {
              const SectionIcon = section.icon;
              const isOpen = openSections[section.name] || false;
              const sectionBadge = getSectionBadge(section.name);

              return (
                <div key={idx} className="mb-1">
                  <button
                    onClick={() => handleSectionToggle(section.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${!sidebarOpen && 'justify-center'}
                      ${isOpen
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content/70 hover:bg-primary/5 hover:text-primary'
                      }
                    `}
                    title={!sidebarOpen ? section.name : ''}
                  >
                    <SectionIcon className={`w-5 h-5 ${isOpen ? 'text-inherit' : ''}`} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-xs font-semibold tracking-wide uppercase">
                          {section.name}
                        </span>
                        {sectionBadge > 0 && (
                          <span className="badge badge-error badge-xs animate-pulse">
                            {sectionBadge > 99 ? '99+' : sectionBadge}
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>

                  {sidebarOpen && isOpen && (
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                      {section.items.map((item) => {
                        const isActive = path === item.path;
                        return renderMenuItem(item, section.name, isActive);
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary/20 bg-base-100">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-base-content/50">v2.0.0 APG</span>
                </div>
                <span className="badge badge-primary badge-sm">
                  {!loadingEtab ? (etablissement?.sigle || 'APG') : 'APG'}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        <div className="p-4 sm:p-6">
          {content || (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-base-content/50">Aucun contenu à afficher</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-base-100 z-50 shadow-2xl lg:hidden overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center p-1 shadow-lg overflow-hidden">
                    {!loadingEtab && logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <Recycle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-primary-content font-bold text-lg">
                      {!loadingEtab ? (etablissement?.nom || 'APG') : 'Chargement...'}
                    </h2>
                    <p className="text-primary-content/70 text-xs">{roleConfig.label}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-primary-content p-2 rounded-lg hover:bg-primary-content/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary-content/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-content/20 flex items-center justify-center text-primary-content font-bold">
                  {userInitial || 'U'}
                </div>
                <div>
                  <p className="text-primary-content font-medium text-sm">{userFullName || userName}</p>
                  <p className="text-primary-content/60 text-xs">{userEmail}</p>
                </div>
              </div>
            </div>

            <div className="py-4 px-3 space-y-1">
              {visibleSections.map((section, idx) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.name] || false;

                return (
                  <div key={idx} className="mb-2">
                    <button
                      onClick={() => handleSectionToggle(section.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold uppercase">{section.name}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isOpen && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                        {section.items.map((item) => {
                          const isActive = path === item.path;
                          return renderMenuItem(item, section.name, isActive);
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;