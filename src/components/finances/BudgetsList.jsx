// src/components/finances/BudgetsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Wallet, Plus, Search, Eye, Edit, Trash2, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle,
  Filter, ChevronLeft, ChevronRight,
  Calendar, AlertTriangle, TrendingUp, TrendingDown,
  PiggyBank, Clock, Check, Ban
} from 'lucide-react';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const BudgetsList = () => {
  // ==========================================================
  // HOOKS
  // ==========================================================
  const navigate = useNavigate();

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // ==========================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================
  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      annuel: { label: 'Annuel', className: 'badge-primary' },
      trimestriel: { label: 'Trimestriel', className: 'badge-info' },
      mensuel: { label: 'Mensuel', className: 'badge-secondary' },
      projet: { label: 'Projet', className: 'badge-warning' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getStatutBadge = (statut) => {
    const configs = {
      en_cours: { label: 'En cours', className: 'badge-info' },
      termine: { label: 'Terminé', className: 'badge-success' },
      annule: { label: 'Annulé', className: 'badge-error' }
    };
    const config = configs[statut] || { label: statut, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getPourcentageColor = (pourcentage) => {
    if (pourcentage >= 90) return 'text-red-600';
    if (pourcentage >= 75) return 'text-orange-500';
    if (pourcentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (pourcentage) => {
    if (pourcentage >= 90) return 'bg-red-500';
    if (pourcentage >= 75) return 'bg-orange-500';
    if (pourcentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // ==========================================================
  // REQUÊTES API
  // ==========================================================
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statutFilter !== 'all') params.append('statut', statutFilter);

      const response = await AxiosInstance.get(`/budgets/?${params.toString()}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setBudgets(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, statutFilter, navigate]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce budget ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/budgets/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Budget supprimé avec succès', 'success');
      fetchBudgets();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ==========================================================
  // FILTRES ET PAGINATION
  // ==========================================================
  const totalPages = Math.ceil(budgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBudgets = budgets.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const stats = {
    total: budgets.length,
    en_cours: budgets.filter(b => b.statut === 'en_cours').length,
    termine: budgets.filter(b => b.statut === 'termine').length,
    annule: budgets.filter(b => b.statut === 'annule').length,
    total_montant: budgets.reduce((sum, b) => sum + parseFloat(b.montant_total || 0), 0)
  };

  // ==========================================================
  // RENDU : CHARGEMENT
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 w-full">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-14 h-14 mx-auto" />
          <p className="text-lg font-medium text-gray-500">Chargement des budgets...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU : COMPOSANT PRINCIPAL - FULL WIDTH
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ======================================================
          NOTIFICATION
          ====================================================== */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 rounded-xl">
                <Wallet className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-green-600">
                  Budgets
                </h1>
                <p className="text-sm text-gray-500">
                  Planification et suivi budgétaire –{' '}
                  <span className="font-semibold text-gray-700">{stats.total}</span> budget(s)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchBudgets}
                className="btn btn-sm sm:btn-md btn-outline gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Actualiser
              </button>
              <button
                onClick={() => navigate('/budgets/nouveau')}
                className="btn btn-sm sm:btn-md bg-gradient-to-r from-green-600 to-green-700 text-white border-none shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" /> Nouveau budget
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}
      <div className="w-full px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-primary">{stats.total}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">En cours</p>
                <p className="text-xl font-bold text-info">{stats.en_cours}</p>
              </div>
              <Clock className="w-8 h-8 text-info/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Terminés</p>
                <p className="text-xl font-bold text-success">{stats.termine}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Montant total</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(stats.total_montant)}</p>
              </div>
              <PiggyBank className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTRES
          ====================================================== */}
      <div className="w-full px-6 pb-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col gap-3">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un budget..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchBudgets()}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm sm:hidden gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Masquer' : 'Filtres'}
            </button>

            <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 gap-3`}>
              <select
                className="select select-bordered w-full"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tous les types</option>
                <option value="annuel">Annuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="mensuel">Mensuel</option>
                <option value="projet">Projet</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLEAU
          ====================================================== */}
      <div className="w-full px-6 pb-6">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Type</th>
                  <th className="py-3 px-4 hidden md:table-cell">Période</th>
                  <th className="py-3 px-4 text-right">Montant total</th>
                  <th className="py-3 px-4 text-right">Utilisé</th>
                  <th className="py-3 px-4 text-center">Avancement</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBudgets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Wallet className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucun budget trouvé</p>
                        <p className="text-sm text-gray-400">Ajustez vos filtres ou créez un budget</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBudgets.map((budget) => {
                    const pourcentage = budget.pourcentage_utilise || 0;
                    const isAlerte = pourcentage >= 80;

                    return (
                      <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold">{budget.nom}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">{getTypeBadge(budget.type)}</td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatDate(budget.date_debut)}
                            </div>
                            <div className="text-gray-400 text-xs">→ {formatDate(budget.date_fin)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {formatCurrency(budget.montant_total)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-700">
                          {formatCurrency(budget.montant_utilise)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(pourcentage)}`}
                                style={{ width: `${Math.min(pourcentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${getPourcentageColor(pourcentage)}`}>
                              {pourcentage.toFixed(0)}%
                            </span>
                            {isAlerte && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{getStatutBadge(budget.statut)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/budgets/${budget.id}`)}
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/budgets/${budget.id}/modifier`)}
                              className="btn btn-ghost btn-sm btn-circle text-warning"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {budget.statut !== 'termine' && (
                              <button
                                onClick={() => handleDelete(budget.id)}
                                className="btn btn-ghost btn-sm btn-circle text-error"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ====================================================
              PAGINATION
              ==================================================== */}
          {budgets.length > 0 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, budgets.length)}</span> sur{' '}
                <span className="font-medium">{budgets.length}</span> budgets
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                </select>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetsList;