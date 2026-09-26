// src/components/ventes/VenteDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import TicketPOS from '../ventesclients/TicketPOS';
import {
  ArrowLeft, ShoppingCart, User, Package, CreditCard,
  Truck, Calendar, DollarSign, FileText, Download,
  Edit, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Loader2, Phone, Mail, MapPin, Printer,
  Send, Ban, Clock, Users, Building2, X
} from 'lucide-react';

const VenteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vente, setVente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchVente = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/sales/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      console.log('Données reçues:', response.data);
      
      if (response.data) {
        setVente(response.data);
      } else {
        showNotification('Vente non trouvée', 'error');
        setTimeout(() => navigate('/ventes'), 1500);
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Vente non trouvée', 'error');
        setTimeout(() => navigate('/ventes'), 1500);
      } else {
        showNotification(`Erreur: ${error.response?.data?.detail || error.message || 'Erreur inconnue'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVente();
    }
  }, [id]);

  const handleUpdateStatus = async (status) => {
    if (!vente) return;
    
    setActionLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        return;
      }

      await AxiosInstance.post(
        `/sales/${id}/update_status/`,
        { status },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotification(`Statut mis à jour: ${status}`, 'success');
      await fetchVente();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = () => {
    navigate(`/ventes/${id}/paiement`);
  };

  const handleDownloadPdf = () => {
    window.open(`/ventes/${id}/pdf/`, '_blank');
  };

  const handlePrintTicket = async () => {
    if (!vente) return;
    
    setPrinting(true);
    try {
      await TicketPOS(vente, {
        companyName: 'ETABLISSEMENTS BAH SOULEYMANE ET FILS',
        companySlogan: 'E.B.S.F',
        companyPhone: '+224 626 53 32 53',
        companyEmail: 'ebsfservices@gmail.com',
        companyAddress: 'Pita Centre – Grand Marché, Guinée'
      });
      showNotification('Ticket imprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur impression ticket:', error);
      showNotification('Erreur lors de l\'impression du ticket', 'error');
    } finally {
      setPrinting(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost', icon: FileText },
      confirmed: { label: 'Confirmée', className: 'badge-info', icon: CheckCircle },
      paid: { label: 'Payée', className: 'badge-success', icon: CreditCard },
      delivered: { label: 'Livrée', className: 'badge-primary', icon: Truck },
      cancelled: { label: 'Annulée', className: 'badge-error', icon: Ban },
      returned: { label: 'Retournée', className: 'badge-warning', icon: AlertCircle }
    };
    const config = configs[status] || { label: status || 'Inconnu', className: 'badge-ghost', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1 text-sm`}>
        <Icon className="w-4 h-4" /> {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const configs = {
      paid: { label: 'Payé', className: 'badge-success' },
      partial: { label: 'Partiel', className: 'badge-warning' },
      pending: { label: 'En attente', className: 'badge-error' }
    };
    const config = configs[status] || { label: status || 'Inconnu', className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 FCFA';
    return `${numAmount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de la vente...</p>
        </div>
      </div>
    );
  }

  // Vente non trouvée
  if (!vente) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Vente non trouvée</h2>
          <p className="text-gray-500 mb-6">La vente que vous recherchez n'existe pas ou a été supprimée.</p>
          <button onClick={() => navigate('/ventes')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/ventes')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Vente {vente.invoice_number || 'N/A'}
                  </h1>
                  <p className="text-sm text-gray-500">{vente.client_name || 'Client inconnu'}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* PDF */}
              <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm gap-2">
                <Download className="w-4 h-4" /> PDF
              </button>

              {/* Ticket POS */}
              <button 
                onClick={handlePrintTicket} 
                className="btn btn-secondary btn-sm gap-2"
                disabled={printing}
              >
                {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Ticket
              </button>

              {/* Actions selon statut */}
              {vente.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/ventes/${id}/modifier`)} className="btn btn-outline btn-sm gap-2">
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('confirmed')} 
                    className="btn btn-success btn-sm gap-2" 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirmer
                  </button>
                </>
              )}

              {vente.status === 'confirmed' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('paid')} 
                    className="btn btn-success btn-sm gap-2" 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Marquer payée
                  </button>
                  <button 
                    onClick={handleAddPayment} 
                    className="btn btn-info btn-sm gap-2"
                  >
                    <DollarSign className="w-4 h-4" /> Paiement
                  </button>
                </>
              )}

              {vente.status !== 'cancelled' && vente.status !== 'paid' && (
                <button 
                  onClick={() => handleUpdateStatus('cancelled')} 
                  className="btn btn-error btn-sm gap-2" 
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Annuler
                </button>
              )}

              <button onClick={fetchVente} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">N° Facture</p>
                <p className="font-semibold font-mono">{vente.invoice_number || '-'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(vente.total)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(vente.status)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Paiement</p>
                {getPaymentBadge(vente.payment_status)}
                <p className="text-xs text-gray-400">Dû: {formatCurrency(vente.amount_due)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Détails - Grille 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tableau des produits - 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Produits
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Qté</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Prix unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Remise</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vente.lines && vente.lines.length > 0 ? (
                    vente.lines.map((line, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{line.product_name || line.product?.name || 'Produit'}</p>
                          <p className="text-xs text-gray-400">{line.product_code || line.product?.code || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{line.quantity || 0}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(line.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-error">{formatCurrency(line.discount)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(line.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        Aucun produit dans cette vente
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-semibold">Sous-total</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(vente.subtotal)}</td>
                  </tr>
                  {(vente.discount_amount || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Remise</td>
                      <td className="px-4 py-3 text-right text-error">-{formatCurrency(vente.discount_amount)}</td>
                    </tr>
                  )}
                  {(vente.tax_amount || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">TVA ({vente.tax_rate || 0}%)</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(vente.tax_amount)}</td>
                    </tr>
                  )}
                  {(vente.shipping_fee || 0) > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Frais livraison</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(vente.shipping_fee)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-primary bg-primary/5">
                    <td colSpan="4" className="px-4 py-4 text-right font-bold text-lg">Total TTC</td>
                    <td className="px-4 py-4 text-right font-bold text-xl text-primary">{formatCurrency(vente.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Panneau droit - 1/3 */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="font-semibold text-base">{vente.client_name || 'Client inconnu'}</p>
                {vente.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{vente.client_phone}</span>
                  </div>
                )}
                {vente.client_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{vente.client_email}</span>
                  </div>
                )}
                {vente.client_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">{vente.client_address}</span>
                  </div>
                )}
                {vente.client && vente.client.id && (
                  <button 
                    onClick={() => navigate(`/clients/${vente.client.id}`)} 
                    className="btn btn-ghost btn-sm w-full mt-2 gap-2"
                  >
                    <Users className="w-4 h-4" /> Voir le client
                  </button>
                )}
              </div>
            </div>

            {/* Paiements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Paiements
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant payé</span>
                  <span className="font-semibold text-success">{formatCurrency(vente.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant dû</span>
                  <span className="font-semibold text-error">{formatCurrency(vente.amount_due)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-500">Méthode</span>
                  <span className="font-medium">{vente.payment_method || 'Non défini'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Échéance</span>
                  <span className="font-medium">{formatDate(vente.payment_due_date)}</span>
                </div>
                {vente.payments && vente.payments.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-1">Historique des paiements</p>
                    {vente.payments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-50">
                        <span>{formatDate(payment.payment_date)}</span>
                        <span className="font-semibold text-success">{formatCurrency(payment.amount)}</span>
                        <span className="text-gray-400">{payment.method}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {vente.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Notes
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{vente.notes}</p>
                </div>
              </div>
            )}

            {/* QR Code */}
            {vente.qr_code_url && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="7" height="7" rx="1"/>
                      <rect x="15" y="2" width="7" height="7" rx="1"/>
                      <rect x="2" y="15" width="7" height="7" rx="1"/>
                      <rect x="15" y="15" width="3" height="3" rx="1"/>
                      <rect x="19" y="15" width="3" height="3" rx="1"/>
                      <rect x="15" y="19" width="3" height="3" rx="1"/>
                    </svg>
                    QR Code
                  </h3>
                </div>
                <div className="p-4 flex justify-center">
                  <img 
                    src={vente.qr_code_url} 
                    alt="QR Code de la vente" 
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<p class="text-gray-400 text-sm">QR Code non disponible</p>';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenteDetail;