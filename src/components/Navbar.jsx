// src/components/Navbar.jsx - Version APG CORRIGÉE
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
// CONFIGURATION DES RÔLES
// ============================================================
const ROLE_CONFIG = {
  admin: { label: 'Administrateur / PDG', color: 'error', icon: Shield, level: 100 },
  gestionnaire: { label: 'Gestionnaire', color: 'warning', icon: UserCog, level: 80 },
  superviseur: { label: 'Superviseur', color: 'info', icon: ClipboardCheck, level: 75 },
  agent: { label: 'Agent de Collecte', color: 'success', icon: Truck, level: 60 },
  comptable: { label: 'Comptable', color: 'secondary', icon: Calculator, level: 90 },
  tresorier: { label: 'Trésorier', color: 'accent', icon: Wallet, level: 85 },
  rh: { label: 'Ressources Humaines', color: 'info', icon: Users, level: 85 },
  logistique: { label: 'Logistique', color: 'warning', icon: Truck, level: 80 },
  achats: { label: 'Responsable Achats', color: 'secondary', icon: Briefcase, level: 75 },
  commercial: { label: 'Responsable Commercial', color: 'primary', icon: Handshake, level: 75 },
  exploitation: { label: 'Responsable Exploitation', color: 'info', icon: HardHat, level: 78 },
  employe: { label: 'Employé', color: 'ghost', icon: UserCircle, level: 30 }
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

  // ✅ TOUTES les sections FERMÉES par défaut (sauf Dashboard)
  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true,
    'RESSOURCES HUMAINES': false,
    'PAIE': false,
    'COLLECTE & TOURNÉES': true,
    'CLIENTS & ABONNEMENTS': false,
    'POINTS DE COLLECTE': false,
    'FLOTTE & VÉHICULES': false,
    'TRAITEMENT & RECYCLAGE': false,
    'FOURNISSEURS & ACHATS': false,
    'STOCKS & MAGASINS': false,
    'FINANCES': false,
    'TRÉSORERIE': false,
    'COMPTABILITÉ': false,
    'WORKFLOWS': false,
    'DOCUMENTS': false,
    'RAPPORTS': false,
    'ALERTES': false,
    'PARAMÈTRES': false,
    'MON ESPACE': false
  });

  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  // Compteurs
  const [facturesImpayees, setFacturesImpayees] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [collectesEnAttente, setCollectesEnAttente] = useState(0);
  const [abonnementsExpirant, setAbonnementsExpirant] = useState(0);
  const [conteneursPleins, setConteneursPleins] = useState(0);
  const [vehiculesEnMaintenance, setVehiculesEnMaintenance] = useState(0);
  const [reclamationsClients, setReclamationsClients] = useState(0);
  const [tourneesDuJour, setTourneesDuJour] = useState(0);
  const [zonesEnRetard, setZonesEnRetard] = useState(0);
  const [depensesEnAttente, setDepensesEnAttente] = useState(0);
  const [tresorerieAlerte, setTresorerieAlerte] = useState(0);
  const [contratsExpirant, setContratsExpirant] = useState(0);
  const [employesEnConge, setEmployesEnConge] = useState(0);
  const [paieEnAttente, setPaieEnAttente] = useState(0);
  const [validationsEnAttente, setValidationsEnAttente] = useState(0);
  const [stockCritique, setStockCritique] = useState(0);
  const [achatsEnAttente, setAchatsEnAttente] = useState(0);
  const [missionsEnCours, setMissionsEnCours] = useState(0);

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
  const role = user?.role || 'agent';
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
  // PERMISSIONS
  // ============================================================
  const isAdmin = role === 'admin';
  const isGestionnaire = role === 'gestionnaire' || isAdmin;
  const isSuperviseur = role === 'superviseur' || isGestionnaire;
  const isAgent = role === 'agent';
  const isComptable = role === 'comptable' || isAdmin;
  const isTresorier = role === 'tresorier' || isComptable;
  const isRH = role === 'rh' || isAdmin || isGestionnaire;
  const isLogistique = role === 'logistique' || isAdmin || isGestionnaire;
  const isAchats = role === 'achats' || isAdmin || isGestionnaire;
  const isCommercial = role === 'commercial' || isAdmin || isGestionnaire;
  const isExploitation = role === 'exploitation' || isAdmin || isGestionnaire;

  useEffect(() => {
    if (firstName && lastName) {
      setUserInitial(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase());
      setUserFullName(`${firstName} ${lastName}`);
    } else if (userName) {
      setUserInitial(userName.charAt(0).toUpperCase());
      setUserFullName(userName);
    }
  }, [firstName, lastName, userName]);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.agent;
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
  // COMPTEURS (avec gestion d'erreur silencieuse)
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

      if (isAdmin || isGestionnaire || isSuperviseur) {
        safeGet('/factures/impayees/', setFacturesImpayees);
        safeGet('/collectes/en-attente/', setCollectesEnAttente);
        safeGet('/abonnements/expirant/', setAbonnementsExpirant);
        safeGet('/conteneurs/pleins/', setConteneursPleins);
        safeGet('/vehicules/maintenance/', setVehiculesEnMaintenance);
        safeGet('/reclamations/nouvelles/', setReclamationsClients);
        safeGet('/tournees/aujourdhui/', setTourneesDuJour);
        safeGet('/zones/retard/', setZonesEnRetard);
        safeGet('/depenses/en-attente/', setDepensesEnAttente);
        safeGet('/contrats/expirant/', setContratsExpirant);
        safeGet('/conges/en-cours/', setEmployesEnConge);
        safeGet('/paie/en-attente/', setPaieEnAttente);
        safeGet('/validations/en-attente/', setValidationsEnAttente);
        safeGet('/stocks/critique/', setStockCritique);
        safeGet('/achats/en-attente/', setAchatsEnAttente);
        safeGet('/missions/en-cours/', setMissionsEnCours);
        safeGet('/tresorerie/alertes/', setTresorerieAlerte);
        safeGet('/notifications/non-lues/', setNotificationsCount);
      }
    };
    loadData();
  }, [role, isAdmin, isGestionnaire, isSuperviseur]);

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
  // ✅ MENU AVEC ROUTES SIMPLES (pas de /rh/, /paie/)
  // ============================================================
  const menuSections = [
    // 1. TABLEAU DE BORD
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'dashboard-pdg', text: 'Dashboard PDG', icon: Target, path: '/dashboard-pdg', permission: isAdmin },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isAdmin || isGestionnaire },
        { id: 'analyses', text: 'Analyses & Rapports', icon: BarChart3, path: '/analyses', permission: isAdmin || isGestionnaire },
        { id: 'kpi', text: 'Indicateurs (KPI)', icon: Gauge, path: '/kpi', permission: isAdmin || isGestionnaire }
      ]
    },

    // 2. RESSOURCES HUMAINES (routes simples)
    {
      name: 'RESSOURCES HUMAINES',
      icon: Users,
      items: [
        { id: 'personnel', text: 'Personnel', icon: Users, path: '/personnel', permission: isRH || isSuperviseur },
        { id: 'nouvel-employe', text: 'Nouvel Employé', icon: UserPlus, path: '/personnel/nouveau', permission: isRH },
        { id: 'organigramme', text: 'Organigramme', icon: Layers, path: '/organigramme', permission: isRH || isGestionnaire },
        { id: 'separator-rh-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'contrats', text: 'Contrats', icon: FileCheck, path: '/contrats', permission: isRH, badge: contratsExpirant },
        { id: 'nouveau-contrat', text: 'Nouveau Contrat', icon: FilePlus, path: '/contrats/nouveau', permission: isRH },
        { id: 'separator-rh-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'presences', text: 'Présences', icon: ClipboardCheck, path: '/presences', permission: isRH || isSuperviseur },
        { id: 'pointage', text: 'Pointage', icon: Fingerprint, path: '/pointage', permission: isRH || isSuperviseur },
        { id: 'absences', text: 'Absences', icon: AlertCircle, path: '/absences', permission: isRH || isSuperviseur },
        { id: 'separator-rh-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'conges', text: 'Congés', icon: CalendarDays, path: '/conges', permission: isRH || isSuperviseur, badge: employesEnConge },
        { id: 'demandes-conges', text: 'Demandes de Congés', icon: Inbox, path: '/conges/demandes', permission: isRH || isSuperviseur },
        { id: 'calendrier-conges', text: 'Calendrier Congés', icon: Calendar, path: '/conges/calendrier', permission: isRH || isSuperviseur },
        { id: 'soldes-conges', text: 'Soldes de Congés', icon: Calculator, path: '/conges/soldes', permission: isRH },
        { id: 'separator-rh-4', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'jours-travailles', text: 'Jours Travaillés', icon: CalendarDays, path: '/jours-travailles', permission: isRH },
        { id: 'documents-rh', text: 'Documents RH', icon: FolderOpen, path: '/documents-rh', permission: isRH },
        { id: 'etats-personnel', text: 'États du Personnel', icon: FileSpreadsheet, path: '/etats-personnel', permission: isRH || isGestionnaire },
        { id: 'evaluations', text: 'Évaluations', icon: Award, path: '/evaluations', permission: isRH || isGestionnaire },
        { id: 'formations', text: 'Formations', icon: BookOpen, path: '/formations', permission: isRH }
      ]
    },

    // 3. PAIE (routes simples)
    {
      name: 'PAIE',
      icon: Wallet,
      items: [
        { id: 'dashboard-paie', text: 'Tableau de Bord Paie', icon: Gauge, path: '/dashboard-paie', permission: isRH || isComptable || isAdmin },
        { id: 'preparation-paie', text: 'Préparation Paie', icon: ClipboardList, path: '/paie-preparation', permission: isRH, badge: paieEnAttente },
        { id: 'calcul-paie', text: 'Calcul de la Paie', icon: Calculator, path: '/paie-calcul', permission: isRH },
        { id: 'controle-paie', text: 'Contrôle Paie', icon: ClipboardCheck, path: '/paie-controle', permission: isRH || isComptable },
        { id: 'validation-paie', text: 'Validation Paie', icon: CheckCircle, path: '/paie-validation', permission: isAdmin || isGestionnaire },
        { id: 'separator-paie-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'etat-salaire', text: 'État de Salaire', icon: FileText, path: '/etat-salaire', permission: isRH || isComptable },
        { id: 'fiches-paie', text: 'Fiches de Paie', icon: Receipt, path: '/fiches-paie', permission: isRH || isComptable },
        { id: 'bulletins-paie', text: 'Bulletins de Paie', icon: FileText, path: '/bulletins-paie', permission: isRH || isComptable },
        { id: 'separator-paie-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'avances-salaire', text: 'Avances sur Salaire', icon: HandCoins, path: '/avances-salaire', permission: isRH || isComptable },
        { id: 'primes', text: 'Primes & Indemnités', icon: DollarSign, path: '/primes', permission: isRH },
        { id: 'retenues', text: 'Retenues', icon: FileMinus, path: '/retenues', permission: isRH || isComptable },
        { id: 'separator-paie-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'historique-paie', text: 'Historique Paie', icon: History, path: '/historique-paie', permission: isRH || isComptable },
        { id: 'archives-paie', text: 'Archives Paie', icon: Archive, path: '/archives-paie', permission: isAdmin || isComptable },
        { id: 'rapports-paie', text: 'Rapports Paie', icon: FileSpreadsheet, path: '/rapports-paie', permission: isRH || isComptable }
      ]
    },

    // 4. COLLECTE & TOURNÉES
    {
      name: 'COLLECTE & TOURNÉES',
      icon: Truck,
      items: [
        { id: 'tournees', text: 'Tournées de Collecte', icon: Route, path: '/tournees', permission: isAdmin || isGestionnaire || isSuperviseur || isAgent, badge: tourneesDuJour },
        { id: 'nouvelle-tournee', text: 'Nouvelle Tournée', icon: PlusCircle, path: '/tournees/nouvelle', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'zones', text: 'Zones de Collecte', icon: MapPin, path: '/zones', permission: isAdmin || isGestionnaire || isSuperviseur, badge: zonesEnRetard },
        { id: 'zones-retard', text: 'Zones en Retard', icon: AlertTriangle, path: '/zones-retard', permission: isAdmin || isGestionnaire || isSuperviseur, badge: zonesEnRetard },
        { id: 'separator-collecte-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'collectes', text: 'Collectes en Cours', icon: Trash2, path: '/collectes', permission: isAdmin || isGestionnaire || isSuperviseur || isAgent, badge: collectesEnAttente },
        { id: 'nouvelle-collecte', text: 'Signaler une Collecte', icon: PlusCircle, path: '/collectes/nouvelle', permission: isAdmin || isGestionnaire || isSuperviseur || isAgent },
        { id: 'historique-collectes', text: 'Historique Collectes', icon: History, path: '/historique-collectes', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'separator-collecte-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'missions', text: 'Missions', icon: Target, path: '/missions', permission: isAdmin || isGestionnaire || isSuperviseur || isExploitation, badge: missionsEnCours },
        { id: 'nouvelle-mission', text: 'Nouvelle Mission', icon: PlusCircle, path: '/missions/nouvelle', permission: isAdmin || isGestionnaire || isSuperviseur || isExploitation },
        { id: 'separator-collecte-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'reclamations', text: 'Réclamations', icon: AlertCircle, path: '/reclamations', permission: isAdmin || isGestionnaire || isSuperviseur, badge: reclamationsClients },
        { id: 'incidents', text: 'Incidents Terrain', icon: AlertTriangle, path: '/incidents', permission: isAdmin || isGestionnaire || isSuperviseur || isExploitation },
        { id: 'calendrier-collecte', text: 'Calendrier Collecte', icon: CalendarDays, path: '/calendrier-collecte', permission: isAdmin || isGestionnaire || isSuperviseur }
      ]
    },

    // 5. CLIENTS & ABONNEMENTS
    {
      name: 'CLIENTS & ABONNEMENTS',
      icon: Users,
      items: [
        { id: 'clients', text: 'Clients Résidentiels', icon: Users, path: '/clients', permission: isAdmin || isGestionnaire || isSuperviseur || isAgent || isCommercial },
        { id: 'nouveau-client', text: 'Nouveau Client', icon: UserPlus, path: '/clients/nouveau', permission: isAdmin || isGestionnaire || isSuperviseur || isCommercial },
        { id: 'clients-professionnels', text: 'Clients Professionnels', icon: Building2, path: '/clients-professionnels', permission: isAdmin || isGestionnaire || isCommercial },
        { id: 'separator-client-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'contrats-clients', text: 'Contrats Clients', icon: FileSignature, path: '/contrats-clients', permission: isAdmin || isGestionnaire || isCommercial },
        { id: 'nouveau-contrat-client', text: 'Nouveau Contrat Client', icon: FilePlus, path: '/contrats-clients/nouveau', permission: isAdmin || isGestionnaire || isCommercial },
        { id: 'contrats-expirant-clients', text: 'Contrats Expirants', icon: CalendarClock, path: '/contrats-clients/expirant', permission: isAdmin || isGestionnaire || isCommercial },
        { id: 'separator-client-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'abonnements', text: 'Abonnements', icon: FileCheck, path: '/abonnements', permission: isAdmin || isGestionnaire || isSuperviseur, badge: abonnementsExpirant },
        { id: 'nouvel-abonnement', text: 'Nouvel Abonnement', icon: PlusCircle, path: '/abonnements/nouveau', permission: isAdmin || isGestionnaire },
        { id: 'abonnements-expirant', text: 'Abonnements Expirants', icon: CalendarClock, path: '/abonnements/expirant', permission: isAdmin || isGestionnaire, badge: abonnementsExpirant },
        { id: 'separator-client-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'factures', text: 'Factures Clients', icon: Receipt, path: '/factures', permission: isAdmin || isGestionnaire || isSuperviseur || isComptable, badge: facturesImpayees },
        { id: 'nouvelle-facture', text: 'Nouvelle Facture', icon: PlusCircle, path: '/factures/nouvelle', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'devis', text: 'Devis', icon: FileText, path: '/devis', permission: isAdmin || isGestionnaire || isComptable || isCommercial },
        { id: 'nouveau-devis', text: 'Nouveau Devis', icon: FilePlus, path: '/devis/nouveau', permission: isAdmin || isGestionnaire || isComptable || isCommercial },
        { id: 'avoirs', text: 'Avoirs', icon: FileMinus, path: '/avoirs', permission: isAdmin || isComptable },
        { id: 'separator-client-4', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'paiements', text: 'Paiements Clients', icon: CreditCard, path: '/paiements', permission: isAdmin || isGestionnaire || isComptable || isTresorier },
        { id: 'nouveau-paiement', text: 'Nouveau Paiement', icon: PlusCircle, path: '/paiements/nouveau', permission: isAdmin || isGestionnaire || isComptable || isTresorier },
        { id: 'recouvrement', text: 'Recouvrement', icon: HandCoins, path: '/recouvrement', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'relances', text: 'Relances', icon: Send, path: '/relances', permission: isAdmin || isComptable }
      ]
    },

    // 6. POINTS DE COLLECTE
    {
      name: 'POINTS DE COLLECTE',
      icon: MapPin,
      items: [
        { id: 'points-collecte', text: 'Points de Collecte', icon: MapPin, path: '/points-collecte', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'nouveau-point', text: 'Nouveau Point', icon: PlusCircle, path: '/points-collecte/nouveau', permission: isAdmin || isGestionnaire },
        { id: 'conteneurs', text: 'Conteneurs & Bacs', icon: Container, path: '/conteneurs', permission: isAdmin || isGestionnaire || isSuperviseur, badge: conteneursPleins },
        { id: 'conteneurs-pleins', text: 'Conteneurs Pleins', icon: AlertTriangle, path: '/conteneurs-pleins', permission: isAdmin || isGestionnaire || isSuperviseur, badge: conteneursPleins },
        { id: 'nouveau-conteneur', text: 'Nouveau Conteneur', icon: PlusCircle, path: '/conteneurs/nouveau', permission: isAdmin || isGestionnaire },
        { id: 'types-dechets', text: 'Types de Déchets', icon: Recycle, path: '/types-dechets', permission: isAdmin || isGestionnaire },
        { id: 'carte-points', text: 'Carte des Points', icon: Map, path: '/carte-points', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'qr-codes', text: 'QR Codes Points', icon: QrCode, path: '/qr-codes', permission: isAdmin || isGestionnaire }
      ]
    },

    // 7. FLOTTE & VÉHICULES
    {
      name: 'FLOTTE & VÉHICULES',
      icon: Truck,
      items: [
        { id: 'vehicules', text: 'Véhicules', icon: Truck, path: '/vehicules', permission: isAdmin || isGestionnaire || isLogistique, badge: vehiculesEnMaintenance },
        { id: 'nouveau-vehicule', text: 'Nouveau Véhicule', icon: PlusCircle, path: '/vehicules/nouveau', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'vehicules-maintenance', text: 'Véhicules en Maintenance', icon: AlertTriangle, path: '/vehicules-maintenance', permission: isAdmin || isGestionnaire || isLogistique, badge: vehiculesEnMaintenance },
        { id: 'tricycles', text: 'Tricycles', icon: Truck, path: '/tricycles', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'nouveau-tricycle', text: 'Nouveau Tricycle', icon: PlusCircle, path: '/tricycles/nouveau', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'separator-flotte-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'chauffeurs', text: 'Chauffeurs & Agents', icon: UserCheck, path: '/chauffeurs', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'equipes', text: 'Équipes de Collecte', icon: Users, path: '/equipes', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'separator-flotte-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'maintenance', text: 'Maintenance', icon: Cog, path: '/maintenance', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'nouvelle-maintenance', text: 'Nouvelle Intervention', icon: PlusCircle, path: '/maintenance/nouvelle', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'planning-maintenance', text: 'Planning Maintenance', icon: CalendarClock, path: '/planning-maintenance', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'carburant', text: 'Carburant', icon: Droplet, path: '/carburant', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'nouveau-carburant', text: 'Nouveau Plein', icon: PlusCircle, path: '/carburant/nouveau', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'suivi-vehicules', text: 'Suivi GPS', icon: Navigation, path: '/suivi-vehicules', permission: isAdmin || isGestionnaire || isSuperviseur || isLogistique },
        { id: 'documents-vehicules', text: 'Documents Véhicules', icon: FileText, path: '/documents-vehicules', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'assurances', text: 'Assurances', icon: Shield, path: '/assurances', permission: isAdmin || isGestionnaire || isLogistique }
      ]
    },

    // 8. TRAITEMENT & RECYCLAGE
    {
      name: 'TRAITEMENT & RECYCLAGE',
      icon: Recycle,
      items: [
        { id: 'centres-traitement', text: 'Centres de Traitement', icon: Factory, path: '/centres-traitement', permission: isAdmin || isGestionnaire },
        { id: 'nouveau-centre', text: 'Nouveau Centre', icon: PlusCircle, path: '/centres-traitement/nouveau', permission: isAdmin },
        { id: 'separator-traitement-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'recyclage', text: 'Recyclage', icon: Recycle, path: '/recyclage', permission: isAdmin || isGestionnaire },
        { id: 'compostage', text: 'Compostage', icon: Sprout, path: '/compostage', permission: isAdmin || isGestionnaire },
        { id: 'valorisation', text: 'Valorisation Énergétique', icon: Flame, path: '/valorisation', permission: isAdmin || isGestionnaire },
        { id: 'separator-traitement-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'pesees', text: 'Pesées & Tonnages', icon: Weight, path: '/pesees', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'nouvelle-pesee', text: 'Nouvelle Pesée', icon: PlusCircle, path: '/pesees/nouvelle', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'statistiques-traitement', text: 'Statistiques Traitement', icon: BarChart3, path: '/statistiques-traitement', permission: isAdmin || isGestionnaire }
      ]
    },

    // 9. FOURNISSEURS & ACHATS
    {
      name: 'FOURNISSEURS & ACHATS',
      icon: Briefcase,
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'nouveau-fournisseur', text: 'Nouveau Fournisseur', icon: PlusCircle, path: '/fournisseurs/nouveau', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'evaluations-fournisseurs', text: 'Évaluations Fournisseurs', icon: Star, path: '/evaluations-fournisseurs', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'separator-achats-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'demandes-achat', text: "Demandes d'Achat", icon: FilePlus, path: '/demandes-achat', permission: isAdmin || isGestionnaire || isAchats, badge: achatsEnAttente },
        { id: 'nouvelle-demande-achat', text: 'Nouvelle Demande', icon: PlusCircle, path: '/demandes-achat/nouvelle', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'validation-demandes', text: 'Validation Demandes', icon: CheckSquare, path: '/validation-demandes', permission: isAdmin || isGestionnaire },
        { id: 'separator-achats-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'devis-fournisseurs', text: 'Devis Fournisseurs', icon: FileText, path: '/devis-fournisseurs', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'comparaison-devis', text: 'Comparaison Devis', icon: Scale, path: '/comparaison-devis', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'bons-commande', text: 'Bons de Commande', icon: ClipboardList, path: '/bons-commande', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'nouveau-bon-commande', text: 'Nouveau Bon de Commande', icon: PlusCircle, path: '/bons-commande/nouveau', permission: isAdmin || isGestionnaire || isAchats },
        { id: 'separator-achats-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'receptions', text: 'Réceptions', icon: Package, path: '/receptions', permission: isAdmin || isGestionnaire || isAchats || isLogistique },
        { id: 'nouvelle-reception', text: 'Nouvelle Réception', icon: PlusCircle, path: '/receptions/nouvelle', permission: isAdmin || isGestionnaire || isAchats || isLogistique },
        { id: 'factures-fournisseurs', text: 'Factures Fournisseurs', icon: Receipt, path: '/factures-fournisseurs', permission: isAdmin || isGestionnaire || isAchats || isComptable },
        { id: 'paiements-fournisseurs', text: 'Paiements Fournisseurs', icon: CreditCard, path: '/paiements-fournisseurs', permission: isAdmin || isGestionnaire || isComptable || isTresorier }
      ]
    },

    // 10. STOCKS & MAGASINS
    {
      name: 'STOCKS & MAGASINS',
      icon: Warehouse,
      items: [
        { id: 'dashboard-stocks', text: 'Tableau de Bord Stocks', icon: Gauge, path: '/dashboard-stocks', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'articles', text: 'Articles', icon: Package, path: '/articles', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'nouvel-article', text: 'Nouvel Article', icon: PlusCircle, path: '/articles/nouveau', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'categories-articles', text: 'Catégories', icon: Tags, path: '/categories-articles', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'separator-stocks-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'magasins', text: 'Magasins', icon: Warehouse, path: '/magasins', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'nouveau-magasin', text: 'Nouveau Magasin', icon: PlusCircle, path: '/magasins/nouveau', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'stock-critique', text: 'Stock Critique', icon: AlertTriangle, path: '/stock-critique', permission: isAdmin || isGestionnaire || isLogistique, badge: stockCritique },
        { id: 'separator-stocks-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'mouvements-stock', text: 'Mouvements de Stock', icon: ArrowLeftRight, path: '/mouvements-stock', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'entree-stock', text: 'Entrée de Stock', icon: ArrowDownRight, path: '/entree-stock', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'sortie-stock', text: 'Sortie de Stock', icon: ArrowUpRight, path: '/sortie-stock', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'inventaire', text: 'Inventaire', icon: ClipboardCheck, path: '/inventaire', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'separator-stocks-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'equipements', text: 'Équipements', icon: HardHat, path: '/equipements', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'affectations', text: 'Affectations', icon: UserCheck, path: '/affectations', permission: isAdmin || isGestionnaire || isLogistique },
        { id: 'rapports-stocks', text: 'Rapports Stocks', icon: FileSpreadsheet, path: '/rapports-stocks', permission: isAdmin || isGestionnaire || isLogistique }
      ]
    },

    // 11. FINANCES
    {
      name: 'FINANCES',
      icon: DollarSign,
      items: [
        { id: 'dashboard-finances', text: 'Tableau de Bord Finances', icon: Gauge, path: '/dashboard-finances', permission: isAdmin || isComptable },
        { id: 'comptes-comptables', text: 'Plan Comptable', icon: Grid3x3, path: '/comptes-comptables', permission: isAdmin || isComptable },
        { id: 'ecritures-comptables', text: 'Écritures Comptables', icon: BookOpen, path: '/ecritures-comptables', permission: isAdmin || isComptable },
        { id: 'journal-comptable', text: 'Journal Comptable', icon: ScrollText, path: '/journal-comptable', permission: isAdmin || isComptable },
        { id: 'grand-livre', text: 'Grand Livre', icon: Scale, path: '/grand-livre', permission: isAdmin || isComptable },
        { id: 'balance-generale', text: 'Balance Générale', icon: TableProperties, path: '/balance-generale', permission: isAdmin || isComptable },
        { id: 'depenses', text: 'Dépenses', icon: TrendingDown, path: '/depenses', permission: isAdmin || isComptable, badge: depensesEnAttente },
        { id: 'nouvelle-depense', text: 'Nouvelle Dépense', icon: PlusCircle, path: '/depenses/nouvelle', permission: isAdmin || isComptable || isTresorier },
        { id: 'budgets', text: 'Budgets', icon: PiggyBank, path: '/budgets', permission: isAdmin || isComptable },
        { id: 'rapports-financiers', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers', permission: isAdmin || isComptable },
        { id: 'config-financiere', text: 'Configuration Financière', icon: Cog, path: '/config-financiere', permission: isAdmin }
      ]
    },

    // 12. TRÉSORERIE
    {
      name: 'TRÉSORERIE',
      icon: Wallet,
      items: [
        { id: 'dashboard-tresorerie', text: 'Tableau de Bord Trésorerie', icon: Gauge, path: '/dashboard-tresorerie', permission: isAdmin || isComptable || isTresorier, badge: tresorerieAlerte },
        { id: 'caisses', text: 'Caisses', icon: Banknote, path: '/caisses', permission: isAdmin || isComptable || isTresorier },
        { id: 'nouvelle-caisse', text: 'Nouvelle Caisse', icon: PlusCircle, path: '/caisses/nouvelle', permission: isAdmin || isComptable },
        { id: 'etat-caisse', text: 'État de Caisse', icon: ClipboardList, path: '/etat-caisse', permission: isAdmin || isComptable || isTresorier },
        { id: 'comptes-bancaires', text: 'Comptes Bancaires', icon: Landmark, path: '/comptes-bancaires', permission: isAdmin || isComptable || isTresorier },
        { id: 'nouveau-compte-bancaire', text: 'Nouveau Compte', icon: PlusCircle, path: '/comptes-bancaires/nouveau', permission: isAdmin || isComptable },
        { id: 'mobile-money', text: 'Mobile Money', icon: Smartphone, path: '/mobile-money', permission: isAdmin || isComptable || isTresorier },
        { id: 'separator-tresorerie-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'encaissements', text: 'Encaissements', icon: ArrowDownRight, path: '/encaissements', permission: isAdmin || isComptable || isTresorier },
        { id: 'nouvel-encaissement', text: 'Nouvel Encaissement', icon: PlusCircle, path: '/encaissements/nouveau', permission: isAdmin || isComptable || isTresorier },
        { id: 'decaissements', text: 'Décaissements', icon: ArrowUpRight, path: '/decaissements', permission: isAdmin || isComptable || isTresorier },
        { id: 'nouveau-decaissement', text: 'Nouveau Décaissement', icon: PlusCircle, path: '/decaissements/nouveau', permission: isAdmin || isComptable || isTresorier },
        { id: 'mouvements-tresorerie', text: 'Mouvements Trésorerie', icon: Coins, path: '/mouvements-tresorerie', permission: isAdmin || isComptable || isTresorier },
        { id: 'separator-tresorerie-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'previsions', text: 'Prévisions', icon: CalendarDays, path: '/previsions', permission: isAdmin || isComptable },
        { id: 'rapprochement-bancaire', text: 'Rapprochement Bancaire', icon: CheckCircle, path: '/rapprochement-bancaire', permission: isAdmin || isComptable || isTresorier },
        { id: 'alertes-tresorerie', text: 'Alertes Trésorerie', icon: AlertCircle, path: '/alertes-tresorerie', permission: isAdmin || isComptable || isTresorier }
      ]
    },

    // 13. COMPTABILITÉ
    {
      name: 'COMPTABILITÉ',
      icon: Calculator,
      items: [
        { id: 'dashboard-comptabilite', text: 'Tableau de Bord Comptable', icon: Gauge, path: '/dashboard-comptabilite', permission: isAdmin || isComptable },
        { id: 'plan-comptable', text: 'Plan Comptable', icon: Grid3x3, path: '/plan-comptable', permission: isAdmin || isComptable },
        { id: 'journaux', text: 'Journaux', icon: BookOpen, path: '/journaux', permission: isAdmin || isComptable },
        { id: 'grand-livre-comptable', text: 'Grand Livre', icon: Scale, path: '/grand-livre-comptable', permission: isAdmin || isComptable },
        { id: 'balance', text: 'Balance', icon: TableProperties, path: '/balance', permission: isAdmin || isComptable },
        { id: 'lettrage', text: 'Lettrage', icon: CheckSquare, path: '/lettrage', permission: isAdmin || isComptable },
        { id: 'rapprochement', text: 'Rapprochement', icon: CheckCircle, path: '/rapprochement', permission: isAdmin || isComptable },
        { id: 'cloture', text: 'Clôture', icon: Lock, path: '/cloture', permission: isAdmin || isComptable },
        { id: 'etats-financiers', text: 'États Financiers', icon: FileSpreadsheet, path: '/etats-financiers', permission: isAdmin || isComptable },
        { id: 'bilan', text: 'Bilan', icon: FileText, path: '/bilan', permission: isAdmin || isComptable },
        { id: 'compte-resultat', text: 'Compte de Résultat', icon: TrendingUp, path: '/compte-resultat', permission: isAdmin || isComptable },
        { id: 'declarations-fiscales', text: 'Déclarations Fiscales', icon: FileText, path: '/declarations-fiscales', permission: isAdmin || isComptable }
      ]
    },

    // 14. WORKFLOWS
    {
      name: 'WORKFLOWS',
      icon: ClipboardList,
      items: [
        { id: 'mes-validations', text: 'Mes Validations', icon: CheckSquare, path: '/mes-validations', permission: true, badge: validationsEnAttente },
        { id: 'en-attente-validation', text: 'En Attente de Validation', icon: Clock, path: '/en-attente-validation', permission: isAdmin || isGestionnaire, badge: validationsEnAttente },
        { id: 'historique-validations', text: 'Historique Validations', icon: History, path: '/historique-validations', permission: isAdmin || isGestionnaire },
        { id: 'separator-workflows-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'workflow-achats', text: 'Workflow Achats', icon: Briefcase, path: '/workflow-achats', permission: isAdmin || isGestionnaire },
        { id: 'workflow-salaires', text: 'Workflow Salaires', icon: Wallet, path: '/workflow-salaires', permission: isAdmin || isGestionnaire },
        { id: 'workflow-factures', text: 'Workflow Factures', icon: Receipt, path: '/workflow-factures', permission: isAdmin || isGestionnaire },
        { id: 'workflow-depenses', text: 'Workflow Dépenses', icon: TrendingDown, path: '/workflow-depenses', permission: isAdmin || isGestionnaire },
        { id: 'separator-workflows-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'config-workflows', text: 'Configurer Workflows', icon: Settings, path: '/config-workflows', permission: isAdmin },
        { id: 'niveaux-validation', text: 'Niveaux de Validation', icon: Layers, path: '/niveaux-validation', permission: isAdmin }
      ]
    },

    // 15. DOCUMENTS
    {
      name: 'DOCUMENTS',
      icon: Archive,
      items: [
        { id: 'documents', text: 'Tous les Documents', icon: FolderOpen, path: '/documents', permission: true },
        { id: 'documents-recents', text: 'Documents Récents', icon: FileClock, path: '/documents-recents', permission: true },
        { id: 'mes-documents', text: 'Mes Documents', icon: Folder, path: '/mes-documents', permission: true },
        { id: 'separator-docs-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'documents-rh-section', text: 'Documents RH', icon: Users, path: '/documents-rh-section', permission: isRH || isAdmin },
        { id: 'documents-comptables', text: 'Documents Comptables', icon: Calculator, path: '/documents-comptables', permission: isComptable || isAdmin },
        { id: 'documents-vehicules-section', text: 'Documents Véhicules', icon: Truck, path: '/documents-vehicules-section', permission: isLogistique || isAdmin },
        { id: 'documents-fournisseurs-section', text: 'Documents Fournisseurs', icon: Building2, path: '/documents-fournisseurs-section', permission: isAchats || isAdmin },
        { id: 'documents-clients-section', text: 'Documents Clients', icon: Users, path: '/documents-clients-section', permission: isCommercial || isAdmin },
        { id: 'separator-docs-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'modeles-documents', text: 'Modèles Documents', icon: FileText, path: '/modeles-documents', permission: isAdmin || isGestionnaire },
        { id: 'archives-documents', text: 'Archives', icon: Archive, path: '/archives-documents', permission: isAdmin || isGestionnaire },
        { id: 'corbeille', text: 'Corbeille', icon: Trash2, path: '/corbeille', permission: isAdmin }
      ]
    },

    // 16. RAPPORTS
    {
      name: 'RAPPORTS',
      icon: FileText,
      items: [
        { id: 'rapports-collecte', text: 'Rapports de Collecte', icon: FileSpreadsheet, path: '/rapports-collecte', permission: isAdmin || isGestionnaire || isSuperviseur },
        { id: 'rapports-recyclage', text: 'Rapports de Recyclage', icon: Recycle, path: '/rapports-recyclage', permission: isAdmin || isGestionnaire },
        { id: 'rapports-clients', text: 'Rapports Clients', icon: Users, path: '/rapports-clients', permission: isAdmin || isGestionnaire || isCommercial },
        { id: 'rapports-financiers-section', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers-section', permission: isAdmin || isComptable },
        { id: 'rapports-rh', text: 'Rapports RH', icon: Users, path: '/rapports-rh', permission: isAdmin || isRH },
        { id: 'rapports-stocks-section', text: 'Rapports Stocks', icon: Package, path: '/rapports-stocks-section', permission: isAdmin || isLogistique },
        { id: 'rapports-logistiques', text: 'Rapports Logistiques', icon: Truck, path: '/rapports-logistiques', permission: isAdmin || isLogistique },
        { id: 'rapports-environnement', text: 'Rapports Environnementaux', icon: Leaf, path: '/rapports-environnement', permission: isAdmin || isGestionnaire },
        { id: 'rapports-exploitation', text: 'Rapports Exploitation', icon: HardHat, path: '/rapports-exploitation', permission: isAdmin || isExploitation },
        { id: 'rapports-pdg', text: 'Rapports Direction', icon: Target, path: '/rapports-pdg', permission: isAdmin }
      ]
    },

    // 17. ALERTES
    {
      name: 'ALERTES',
      icon: BellRing,
      items: [
        { id: 'toutes-alertes', text: 'Toutes les Alertes', icon: Bell, path: '/alertes', permission: true, badge: notificationsCount },
        { id: 'alertes-rh', text: 'Alertes RH', icon: Users, path: '/alertes-rh', permission: isRH || isAdmin, badge: contratsExpirant },
        { id: 'alertes-finance', text: 'Alertes Finance', icon: DollarSign, path: '/alertes-finance', permission: isComptable || isAdmin, badge: facturesImpayees + depensesEnAttente },
        { id: 'alertes-logistique', text: 'Alertes Logistique', icon: Truck, path: '/alertes-logistique', permission: isLogistique || isAdmin, badge: stockCritique + vehiculesEnMaintenance },
        { id: 'alertes-contrats', text: 'Alertes Contrats', icon: FileCheck, path: '/alertes-contrats', permission: isAdmin || isCommercial, badge: contratsExpirant },
        { id: 'separator-alertes-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'config-alertes', text: 'Configurer les Alertes', icon: Settings, path: '/config-alertes', permission: isAdmin },
        { id: 'canaux-notification', text: 'Canaux de Notification', icon: Send, path: '/canaux-notification', permission: isAdmin }
      ]
    },

    // 18. PARAMÈTRES
    {
      name: 'PARAMÈTRES',
      icon: Settings,
      items: [
        { id: 'company-config', text: 'Configuration APG', icon: Building2, path: '/company-config', permission: isAdmin },
        { id: 'notifications', text: 'Notifications', icon: Bell, path: '/notifications', permission: isAdmin || isGestionnaire, badge: notificationsCount },
        { id: 'utilisateurs', text: 'Utilisateurs', icon: Users, path: '/utilisateurs', permission: isAdmin },
        { id: 'nouvel-utilisateur', text: 'Nouvel Utilisateur', icon: UserPlus, path: '/utilisateurs/nouveau', permission: isAdmin },
        { id: 'roles', text: 'Rôles & Permissions', icon: Shield, path: '/roles', permission: isAdmin },
        { id: 'document-templates', text: 'Modèles Documents', icon: Printer, path: '/document-templates', permission: isAdmin || isGestionnaire },
        { id: 'numerotation', text: 'Numérotation', icon: Hash, path: '/numerotation', permission: isAdmin },
        { id: 'separator-params-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'backups', text: 'Sauvegardes', icon: Database, path: '/backups', permission: isAdmin },
        { id: 'restauration', text: 'Restauration', icon: RotateCcw, path: '/restauration', permission: isAdmin },
        { id: 'audit', text: "Journal d'audit", icon: History, path: '/audit', permission: isAdmin },
        { id: 'connexions', text: 'Historique Connexions', icon: Activity, path: '/connexions', permission: isAdmin },
        { id: 'system-settings', text: 'Paramètres Système', icon: Cog, path: '/system-settings', permission: isAdmin },
        { id: 'api-keys', text: 'Clés API', icon: Key, path: '/api-keys', permission: isAdmin }
      ]
    },

    // 19. MON ESPACE
    {
      name: 'MON ESPACE',
      icon: UserCircle,
      items: [
        { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
        { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount },
        { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
        { id: 'my-documents', text: 'Mes Documents', icon: Folder, path: '/my-documents', permission: true },
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

  // Recherche
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
          ${isNewItem && !isActive ? 'border-l-2 border-primary pl-3' : ''}
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

  // Calcul du badge de section
  const getSectionBadge = (sectionName) => {
    switch (sectionName) {
      case 'COLLECTE & TOURNÉES': return collectesEnAttente + zonesEnRetard + missionsEnCours;
      case 'POINTS DE COLLECTE': return conteneursPleins;
      case 'CLIENTS & ABONNEMENTS': return abonnementsExpirant + facturesImpayees;
      case 'FLOTTE & VÉHICULES': return vehiculesEnMaintenance;
      case 'RESSOURCES HUMAINES': return contratsExpirant + employesEnConge;
      case 'PAIE': return paieEnAttente;
      case 'FOURNISSEURS & ACHATS': return achatsEnAttente;
      case 'STOCKS & MAGASINS': return stockCritique;
      case 'WORKFLOWS': return validationsEnAttente;
      case 'ALERTES': return notificationsCount;
      case 'TRÉSORERIE': return tresorerieAlerte;
      case 'FINANCES': return depensesEnAttente;
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
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-b-2 border-accent">
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
                  <div className="relative w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center shadow-lg border-2 border-accent overflow-hidden">
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
                <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center border-2 border-accent overflow-hidden">
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
                    {!loadingEtab ? (etablissement?.sigle || 'Déchets Domestiques') : ''}
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