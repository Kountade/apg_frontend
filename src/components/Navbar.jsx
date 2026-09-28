// src/components/Navbar.jsx - Version APG ASSAINISSEMENT
// Gestion des Déchets Domestiques

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  LogOut, 
  UserCircle, 
  Settings, 
  Receipt,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Search,
  HelpCircle,
  History,
  Truck,
  ArrowLeftRight,
  DollarSign,
  ClipboardCheck,
  MoveHorizontal,
  Calculator,
  AlertOctagon,
  Wallet,
  BookOpen,
  PiggyBank,
  Cog,
  Database,
  BellRing,
  Printer,
  UserCog,
  CalendarClock,
  RefreshCw,
  Activity,
  Award,
  BarChart3,
  Edit,
  Eye,
  Landmark,
  Coins,
  ReceiptText,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Gauge,
  AlertCircle,
  Banknote,
  TrendingDown,
  ScrollText,
  Scale,
  FileSpreadsheet,
  Handshake,
  FileCheck,
  RotateCcw,
  BarChart,
  Clipboard,
  Archive,
  Map,
  UserCheck,
  Route,
  PlusCircle,
  BadgeDollarSign,
  UserPlus,
  FilePlus,
  Plus,
  Grid3x3,
  TableProperties,
  // ============================================================
  // ✅ ICÔNES SPÉCIFIQUES APG ASSAINISSEMENT
  // ============================================================
  Trash2,
  Recycle,
  Leaf,
  MapPin,
  Droplet,
  Wind,
  Factory,
  Container,
  Gauge as GaugeIcon,
  Weight,
  Timer,
  Navigation,
  CheckSquare,
  XSquare,
  ListChecks,
  AlertTriangle as AlertTriangleIcon,
  Droplets,
  Sparkles,
  Sprout,
  HeartPulse,
  Flame,
  HardHat,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

import axiosInstance from './AxiosInstance';

// ============================================================
// CONFIGURATION DES RÔLES POUR APG ASSAINISSEMENT
// ============================================================
const ROLE_CONFIG = {
  admin: { 
    label: 'Administrateur', 
    color: 'error', 
    icon: Shield, 
    description: 'Accès total', 
    level: 100 
  },
  gestionnaire: { 
    label: 'Gestionnaire', 
    color: 'warning', 
    icon: UserCog, 
    description: 'Gestion complète', 
    level: 80 
  },
  superviseur: { 
    label: 'Superviseur', 
    color: 'info', 
    icon: ClipboardCheck, 
    description: 'Supervision des tournées', 
    level: 75 
  },
  agent: { 
    label: 'Agent de Collecte', 
    color: 'success', 
    icon: Truck, 
    description: 'Collecte terrain', 
    level: 60 
  },
  comptable: { 
    label: 'Comptable', 
    color: 'secondary', 
    icon: Calculator, 
    description: 'Gestion financière', 
    level: 90 
  }
};

const Navbar = ({ content, mode, toggleColorMode }) => {
  const location = useLocation();
  const path = location.pathname || '/';
  const navigate = useNavigate();

  // ============================================================
  // ÉTATS PRINCIPAUX
  // ============================================================
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sections ouvertes par défaut
  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true,
    'COLLECTE & TOURNÉES': true,
    'CLIENTS & ABONNEMENTS': true,
    'POINTS DE COLLECTE': false,
    'FLOTTE & VÉHICULES': false,
    'TRAITEMENT & RECYCLAGE': false,
    'FINANCES': true,
    'TRÉSORERIE': false,
    'RAPPORTS': false,
    'PARAMÈTRES': false,
    'MON ESPACE': false
  });
  
  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [currentTime, setCurrentTime] = useState(new Date());

  // État pour l'établissement
  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  // ============================================================
  // COMPTEURS - ADAPTÉS POUR APG
  // ============================================================
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

  // ============================================================
  // RÉCUPÉRATION DE L'UTILISATEUR
  // ============================================================
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();
  const role = user?.role || 'agent';
  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const userName = firstName || lastName || user?.username || userEmail?.split('@')[0] || 'Utilisateur';

  // Horloge
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ============================================================
  // PERMISSIONS ADAPTÉES APG
  // ============================================================
  const isAdmin = role === 'admin';
  const isGestionnaire = role === 'gestionnaire' || isAdmin;
  const isSuperviseur = role === 'superviseur' || isGestionnaire;
  const isAgent = role === 'agent';
  const isComptable = role === 'comptable' || isAdmin;

  // Initiale utilisateur
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
  // CONSTRUCTION URL LOGO
  // ============================================================
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    if (logoPath.startsWith('/media/') || logoPath.startsWith('/static/')) {
      const baseURL = axiosInstance.defaults.baseURL || '';
      return `${baseURL}${logoPath}`;
    }
    const baseURL = axiosInstance.defaults.baseURL || '';
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  // ============================================================
  // CHARGEMENT ÉTABLISSEMENT
  // ============================================================
  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (response.data) {
          setEtablissement(response.data);
          if (response.data.logo) {
            const fullLogoUrl = getLogoUrl(response.data.logo);
            setLogoUrl(fullLogoUrl);
          }
        }
      } catch (error) {
        console.error('Erreur chargement établissement :', error);
      } finally {
        setLoadingEtab(false);
      }
    };
    fetchEtablissement();
  }, []);

  // ============================================================
  // CHARGEMENT DES COMPTEURS APG
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) return;

        if (isAdmin || isGestionnaire || isSuperviseur) {
          // Factures impayées
          try {
            const facturesRes = await axiosInstance.get('/factures/impayees/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setFacturesImpayees(facturesRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Collectes en attente
          try {
            const collectesRes = await axiosInstance.get('/collectes/en-attente/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setCollectesEnAttente(collectesRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Abonnements expirant
          try {
            const aboRes = await axiosInstance.get('/abonnements/expirant/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setAbonnementsExpirant(aboRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Conteneurs pleins
          try {
            const contRes = await axiosInstance.get('/conteneurs/pleins/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setConteneursPleins(contRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Véhicules en maintenance
          try {
            const vehRes = await axiosInstance.get('/vehicules/maintenance/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setVehiculesEnMaintenance(vehRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Réclamations clients
          try {
            const reclRes = await axiosInstance.get('/reclamations/nouvelles/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setReclamationsClients(reclRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Tournées du jour
          try {
            const tourneesRes = await axiosInstance.get('/tournees/aujourdhui/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setTourneesDuJour(tourneesRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Zones en retard
          try {
            const zonesRes = await axiosInstance.get('/zones/retard/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setZonesEnRetard(zonesRes.data?.length || 0);
          } catch (e) { console.error(e); }

          // Dépenses en attente
          try {
            const depRes = await axiosInstance.get('/depenses/en-attente/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setDepensesEnAttente(depRes.data?.length || 0);
          } catch (e) { console.error(e); }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [role, isAdmin, isGestionnaire, isSuperviseur]);

  // ============================================================
  // GESTION DES SECTIONS
  // ============================================================
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
  // MENU SECTIONS - ADAPTÉ APG ASSAINISSEMENT
  // ============================================================
  const menuSections = [
    // 1. TABLEAU DE BORD
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'statistiques', text: 'Statistiques Collecte', icon: TrendingUp, path: '/statistiques', permission: isAdmin || isGestionnaire },
        { id: 'analyses', text: 'Analyses & Rapports', icon: BarChart3, path: '/analyses', permission: isAdmin || isGestionnaire }
      ]
    },

    // 2. COLLECTE & TOURNÉES
    {
      name: 'COLLECTE & TOURNÉES',
      icon: Truck,
      items: [
        { 
          id: 'tournees', 
          text: 'Tournées de Collecte', 
          icon: Route, 
          path: '/tournees', 
          permission: isAdmin || isGestionnaire || isSuperviseur || isAgent,
          badge: tourneesDuJour > 0 ? tourneesDuJour : 0
        },
        { 
          id: 'nouvelle-tournee', 
          text: 'Nouvelle Tournée', 
          icon: PlusCircle, 
          path: '/tournees/nouvelle', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { 
          id: 'zones', 
          text: 'Zones de Collecte', 
          icon: MapPin, 
          path: '/zones', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: zonesEnRetard > 0 ? zonesEnRetard : 0
        },
        { 
          id: 'zones-retard', 
          text: 'Zones en Retard', 
          icon: AlertTriangle, 
          path: '/zones/retard', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: zonesEnRetard > 0 ? zonesEnRetard : 0
        },
        { id: 'separator-collecte-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'collectes', 
          text: 'Collectes en Cours', 
          icon: Trash2, 
          path: '/collectes', 
          permission: isAdmin || isGestionnaire || isSuperviseur || isAgent,
          badge: collectesEnAttente > 0 ? collectesEnAttente : 0
        },
        { 
          id: 'nouvelle-collecte', 
          text: 'Signaler une Collecte', 
          icon: PlusCircle, 
          path: '/collectes/nouvelle', 
          permission: isAdmin || isGestionnaire || isSuperviseur || isAgent 
        },
        { 
          id: 'historique-collectes', 
          text: 'Historique Collectes', 
          icon: History, 
          path: '/collectes/historique', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { id: 'separator-collecte-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'reclamations', 
          text: 'Réclamations Clients', 
          icon: AlertCircle, 
          path: '/reclamations', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: reclamationsClients > 0 ? reclamationsClients : 0
        },
        { 
          id: 'calendrier-collecte', 
          text: 'Calendrier de Collecte', 
          icon: CalendarDays, 
          path: '/calendrier-collecte', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        }
      ]
    },

    // 3. CLIENTS & ABONNEMENTS
    {
      name: 'CLIENTS & ABONNEMENTS',
      icon: Users,
      items: [
        { 
          id: 'clients', 
          text: 'Clients Résidentiels', 
          icon: Users, 
          path: '/clients', 
          permission: isAdmin || isGestionnaire || isSuperviseur || isAgent 
        },
        { 
          id: 'nouveau-client', 
          text: 'Nouveau Client', 
          icon: UserPlus, 
          path: '/clients/nouveau', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { 
          id: 'clients-professionnels', 
          text: 'Clients Professionnels', 
          icon: Building2, 
          path: '/clients/professionnels', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-client-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'abonnements', 
          text: 'Abonnements', 
          icon: FileCheck, 
          path: '/abonnements', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: abonnementsExpirant > 0 ? abonnementsExpirant : 0
        },
        { 
          id: 'nouvel-abonnement', 
          text: 'Nouvel Abonnement', 
          icon: PlusCircle, 
          path: '/abonnements/nouveau', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'abonnements-expirant', 
          text: 'Abonnements Expirants', 
          icon: CalendarClock, 
          path: '/abonnements/expirant', 
          permission: isAdmin || isGestionnaire,
          badge: abonnementsExpirant > 0 ? abonnementsExpirant : 0
        },
        { id: 'separator-client-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'factures', 
          text: 'Factures Clients', 
          icon: Receipt, 
          path: '/factures', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: facturesImpayees > 0 ? facturesImpayees : 0
        },
        { 
          id: 'paiements', 
          text: 'Paiements Clients', 
          icon: CreditCard, 
          path: '/paiements', 
          permission: isAdmin || isGestionnaire || isComptable 
        },
        { 
          id: 'nouveau-paiement', 
          text: 'Nouveau Paiement', 
          icon: PlusCircle, 
          path: '/paiements/nouveau', 
          permission: isAdmin || isGestionnaire || isComptable 
        }
      ]
    },

    // 4. POINTS DE COLLECTE
    {
      name: 'POINTS DE COLLECTE',
      icon: MapPin,
      items: [
        { 
          id: 'points-collecte', 
          text: 'Points de Collecte', 
          icon: MapPin, 
          path: '/points-collecte', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { 
          id: 'nouveau-point', 
          text: 'Nouveau Point', 
          icon: PlusCircle, 
          path: '/points-collecte/nouveau', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-points-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'conteneurs', 
          text: 'Conteneurs & Bacs', 
          icon: Container, 
          path: '/conteneurs', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: conteneursPleins > 0 ? conteneursPleins : 0
        },
        { 
          id: 'conteneurs-pleins', 
          text: 'Conteneurs Pleins', 
          icon: AlertTriangle, 
          path: '/conteneurs/pleins', 
          permission: isAdmin || isGestionnaire || isSuperviseur,
          badge: conteneursPleins > 0 ? conteneursPleins : 0
        },
        { 
          id: 'nouveau-conteneur', 
          text: 'Nouveau Conteneur', 
          icon: PlusCircle, 
          path: '/conteneurs/nouveau', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-points-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'types-dechets', 
          text: 'Types de Déchets', 
          icon: Recycle, 
          path: '/types-dechets', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'carte-points', 
          text: 'Carte des Points', 
          icon: Map, 
          path: '/points-collecte/carte', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        }
      ]
    },

    // 5. FLOTTE & VÉHICULES
    {
      name: 'FLOTTE & VÉHICULES',
      icon: Truck,
      items: [
        { 
          id: 'vehicules', 
          text: 'Véhicules de Collecte', 
          icon: Truck, 
          path: '/vehicules', 
          permission: isAdmin || isGestionnaire,
          badge: vehiculesEnMaintenance > 0 ? vehiculesEnMaintenance : 0
        },
        { 
          id: 'nouveau-vehicule', 
          text: 'Nouveau Véhicule', 
          icon: PlusCircle, 
          path: '/vehicules/nouveau', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'vehicules-maintenance', 
          text: 'Véhicules en Maintenance', 
          icon: AlertTriangle, 
          path: '/vehicules/maintenance', 
          permission: isAdmin || isGestionnaire,
          badge: vehiculesEnMaintenance > 0 ? vehiculesEnMaintenance : 0
        },
        { id: 'separator-flotte-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'chauffeurs', 
          text: 'Chauffeurs & Agents', 
          icon: UserCheck, 
          path: '/chauffeurs', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'equipes', 
          text: 'Équipes de Collecte', 
          icon: Users, 
          path: '/equipes', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { id: 'separator-flotte-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'maintenance', 
          text: 'Maintenance', 
          icon: Cog, 
          path: '/maintenance', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'carburant', 
          text: 'Carburant', 
          icon: Droplet, 
          path: '/carburant', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'suivi-vehicules', 
          text: 'Suivi GPS', 
          icon: Navigation, 
          path: '/suivi-vehicules', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        }
      ]
    },

    // 6. TRAITEMENT & RECYCLAGE
    {
      name: 'TRAITEMENT & RECYCLAGE',
      icon: Recycle,
      items: [
        { 
          id: 'centres-traitement', 
          text: 'Centres de Traitement', 
          icon: Factory, 
          path: '/centres-traitement', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'nouveau-centre', 
          text: 'Nouveau Centre', 
          icon: PlusCircle, 
          path: '/centres-traitement/nouveau', 
          permission: isAdmin 
        },
        { id: 'separator-traitement-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'recyclage', 
          text: 'Recyclage', 
          icon: Recycle, 
          path: '/recyclage', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'compostage', 
          text: 'Compostage', 
          icon: Sprout, 
          path: '/compostage', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'valorisation', 
          text: 'Valorisation Énergétique', 
          icon: Flame, 
          path: '/valorisation', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-traitement-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'pesees', 
          text: 'Pesées & Tonnages', 
          icon: Weight, 
          path: '/pesees', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { 
          id: 'nouvelle-pesee', 
          text: 'Nouvelle Pesée', 
          icon: PlusCircle, 
          path: '/pesees/nouvelle', 
          permission: isAdmin || isGestionnaire || isSuperviseur 
        },
        { 
          id: 'statistiques-traitement', 
          text: 'Statistiques Traitement', 
          icon: BarChart3, 
          path: '/statistiques-traitement', 
          permission: isAdmin || isGestionnaire 
        }
      ]
    }
  ];

  // ============================================================
  // SECTIONS POUR ADMIN / GESTIONNAIRE
  // ============================================================
  if (isAdmin || isGestionnaire) {
    // 7. FINANCES
    menuSections.splice(6, 0, {
      name: 'FINANCES',
      icon: DollarSign,
      items: [
        { 
          id: 'dashboard-finances', 
          text: 'Tableau de Bord Finances', 
          icon: Gauge, 
          path: '/dashboard-finances', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'comptes-comptables', 
          text: 'Plan Comptable', 
          icon: Grid3x3, 
          path: '/comptes-comptables', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'ecritures-comptables', 
          text: 'Écritures Comptables', 
          icon: BookOpen, 
          path: '/ecritures-comptables', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'journal-comptable', 
          text: 'Journal Comptable', 
          icon: ScrollText, 
          path: '/journal-comptable', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'grand-livre', 
          text: 'Grand Livre', 
          icon: Scale, 
          path: '/grand-livre', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'balance-generale', 
          text: 'Balance Générale', 
          icon: TableProperties, 
          path: '/balance-generale', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'depenses', 
          text: 'Dépenses', 
          icon: TrendingDown, 
          path: '/depenses', 
          permission: isAdmin || isComptable,
          badge: depensesEnAttente > 0 ? depensesEnAttente : 0
        },
        { 
          id: 'budgets', 
          text: 'Budgets', 
          icon: PiggyBank, 
          path: '/budgets', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'rapports-financiers', 
          text: 'Rapports Financiers', 
          icon: FileSpreadsheet, 
          path: '/rapports-financiers', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'config-financiere', 
          text: 'Configuration Financière', 
          icon: Cog, 
          path: '/config-financiere', 
          permission: isAdmin 
        }
      ]
    });

    // 8. TRÉSORERIE
    menuSections.splice(7, 0, {
      name: 'TRÉSORERIE',
      icon: Wallet,
      items: [
        { 
          id: 'dashboard-tresorerie', 
          text: 'Tableau de Bord Trésorerie', 
          icon: Gauge, 
          path: '/dashboard-tresorerie', 
          permission: isAdmin || isComptable,
          badge: tresorerieAlerte > 0 ? tresorerieAlerte : 0
        },
        { 
          id: 'caisses', 
          text: 'Caisses', 
          icon: Banknote, 
          path: '/caisses', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'comptes-bancaires', 
          text: 'Comptes Bancaires', 
          icon: Landmark, 
          path: '/comptes-bancaires', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'mouvements-tresorerie', 
          text: 'Mouvements Trésorerie', 
          icon: Coins, 
          path: '/mouvements-tresorerie', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'previsions', 
          text: 'Prévisions', 
          icon: CalendarDays, 
          path: '/previsions', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'rapprochement-bancaire', 
          text: 'Rapprochement Bancaire', 
          icon: CheckCircle, 
          path: '/rapprochement-bancaire', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'alertes-tresorerie', 
          text: 'Alertes Trésorerie', 
          icon: AlertCircle, 
          path: '/alertes-tresorerie', 
          permission: isAdmin || isComptable 
        }
      ]
    });

    // 9. RAPPORTS
    menuSections.splice(8, 0, {
      name: 'RAPPORTS',
      icon: FileText,
      items: [
        { 
          id: 'rapports-collecte', 
          text: 'Rapports de Collecte', 
          icon: FileSpreadsheet, 
          path: '/rapports/collecte', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'rapports-recyclage', 
          text: 'Rapports de Recyclage', 
          icon: Recycle, 
          path: '/rapports/recyclage', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'rapports-clients', 
          text: 'Rapports Clients', 
          icon: Users, 
          path: '/rapports/clients', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'rapports-financiers', 
          text: 'Rapports Financiers', 
          icon: FileSpreadsheet, 
          path: '/rapports/financiers', 
          permission: isAdmin || isComptable 
        },
        { 
          id: 'rapports-environnement', 
          text: 'Rapports Environnementaux', 
          icon: Leaf, 
          path: '/rapports/environnement', 
          permission: isAdmin || isGestionnaire 
        }
      ]
    });

    // 10. PARAMÈTRES
    menuSections.splice(9, 0, {
      name: 'PARAMÈTRES',
      icon: Settings,
      items: [
        { 
          id: 'company-config', 
          text: 'Configuration APG', 
          icon: Building2, 
          path: '/company-config', 
          permission: isAdmin 
        },
        { 
          id: 'notifications', 
          text: 'Notifications', 
          icon: Bell, 
          path: '/notifications', 
          permission: isAdmin || isGestionnaire,
          badge: notificationsCount > 0 ? notificationsCount : 0
        },
        { 
          id: 'utilisateurs', 
          text: 'Utilisateurs', 
          icon: Users, 
          path: '/utilisateurs', 
          permission: isAdmin 
        },
        { 
          id: 'roles', 
          text: 'Rôles & Permissions', 
          icon: Shield, 
          path: '/roles', 
          permission: isAdmin 
        },
        { 
          id: 'document-templates', 
          text: 'Modèles Documents', 
          icon: Printer, 
          path: '/document-templates', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'backups', 
          text: 'Sauvegardes', 
          icon: Database, 
          path: '/backups', 
          permission: isAdmin 
        },
        { 
          id: 'audit', 
          text: "Journal d'audit", 
          icon: History, 
          path: '/audit', 
          permission: isAdmin 
        },
        { 
          id: 'system-settings', 
          text: 'Paramètres Système', 
          icon: Cog, 
          path: '/system-settings', 
          permission: isAdmin 
        }
      ]
    });
  }

  // 11. MON ESPACE
  menuSections.push({
    name: 'MON ESPACE',
    icon: UserCircle,
    items: [
      { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
      { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount > 0 ? notificationsCount : 0 },
      { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
      { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
    ]
  });

  // Filtrer les sections
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

  const searchResults = searchQuery.length > 1 ? 
    visibleSections.flatMap(section => 
      section.items.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(item => ({ ...item, section: section.name }))
    ) : [];

  // Rendu item menu
  const renderMenuItem = (item, sectionName, isActive) => {
    if (item.separator) {
      return (
        <div key={item.id} className="border-t border-primary/20 my-2 mx-1"></div>
      );
    }

    const ItemIcon = item.icon;
    const isNewItem = item.id && item.id.startsWith('nouveau-') || item.id?.startsWith('nouvelle-');
    
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
        {item.badge && item.badge > 0 && (
          <span className={`badge badge-error badge-xs ${isActive ? 'badge-outline' : ''}`}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  // ============================================================
  // RENDU
  // ============================================================
  
  return (
    <div className="min-h-screen bg-base-200">
      
      {/* Overlay recherche */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="flex items-start justify-center pt-20 px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl overflow-hidden border border-primary/20">
              <div className="p-4 border-b border-base-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Rechercher un menu... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base-content placeholder:text-base-content/40"
                    autoFocus
                  />
                  <button onClick={() => setIsSearchOpen(false)} className="p-1 rounded-lg hover:bg-base-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-base-content">{item.text}</p>
                        <p className="text-xs text-base-content/40">{item.section}</p>
                      </div>
                    </Link>
                  ))
                ) : searchQuery.length > 1 ? (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Aucun résultat pour "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Tapez pour rechercher un menu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation supérieure */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-b-2 border-accent">
        <div className="px-4 sm:px-6 lg:pl-72">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo et menu toggle */}
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

              {/* Logo Desktop */}
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

              {/* Logo Mobile */}
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

            {/* Centre - Date/Heure */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedDate}</span>
                <div className="w-px h-4 bg-primary-content/30 mx-1"></div>
                <Clock className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedTime}</span>
              </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title="Rechercher (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10">
                <RoleIcon className="w-4 h-4 text-primary-content" />
                <span className="text-primary-content text-xs font-medium">{roleConfig.label}</span>
                {isAdmin && <span className="badge badge-error badge-xs ml-1">Admin</span>}
                {isGestionnaire && !isAdmin && <span className="badge badge-warning badge-xs ml-1">Gestion</span>}
                {isSuperviseur && !isAdmin && !isGestionnaire && <span className="badge badge-info badge-xs ml-1">Superviseur</span>}
                {isAgent && <span className="badge badge-success badge-xs ml-1">Agent</span>}
              </div>

              <button
                onClick={toggleColorMode}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title={mode === 'dark' ? "Mode clair" : "Mode sombre"}
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Menu utilisateur */}
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
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <UserCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mon profil</span>
                        </Link>
                        <Link
                          to="/my-preferences"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes préférences</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <HelpCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Support</span>
                        </Link>
                        <div className="border-t border-base-200 my-1"></div>
                        <button
                          onClick={logoutUser}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 transition-colors text-error"
                        >
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
          
          {/* Logo dans la sidebar */}
          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'} bg-gradient-to-r from-primary/5 to-transparent`}>
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'} gap-3`}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {!loadingEtab && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={etablissement?.nom || 'Logo'}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
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
              <div className="avatar placeholder">
                <div className={`bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-xl ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'} shadow-lg ring-2 ring-primary/20`}>
                  <span className={`${sidebarOpen ? 'text-xl' : 'text-lg'} font-bold`}>{userInitial || 'U'}</span>
                </div>
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
              
              // Badge section Collecte
              const sectionBadge = 
                section.name === 'COLLECTE & TOURNÉES' && (collectesEnAttente + zonesEnRetard) > 0 
                  ? collectesEnAttente + zonesEnRetard 
                  : section.name === 'POINTS DE COLLECTE' && conteneursPleins > 0
                  ? conteneursPleins
                  : section.name === 'CLIENTS & ABONNEMENTS' && (abonnementsExpirant + facturesImpayees) > 0
                  ? abonnementsExpirant + facturesImpayees
                  : section.name === 'FLOTTE & VÉHICULES' && vehiculesEnMaintenance > 0
                  ? vehiculesEnMaintenance
                  : 0;
              
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
                  <span className="text-xs text-base-content/50">v1.0.0 APG</span>
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
                      <img
                        src={logoUrl}
                        alt={etablissement?.nom || 'Logo'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
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
                        <span className="text-xs font-bold uppercase">
                          {section.name}
                        </span>
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