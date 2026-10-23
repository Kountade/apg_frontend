// src/components/achats/FournisseurDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, Star, Phone, Mail, MapPin, User, DollarSign,
  FileText, Plus, FileCheck, Receipt
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const FournisseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fournisseur, setFournisseur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    try {
      const res = await AxiosInstance.get(`/fournisseurs/${id}/`);
      setFournisseur(res.data);
    } catch (err) {
      setErreur('Impossible de charger le fournisseur');
    } finally {
      setChargement(false);
    }
  };

  const supprimer = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/fournisseurs/${id}/`);
      navigate('/fournisseurs');
    } catch (err) {
      alert('Erreur suppression');
      setChargementAction(false);
    }
  };

  const formaterMontant = (m) => {
    if (!m || Number(m) <= 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(Number(m)) + ' GNF';
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (erreur || !fournisseur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur || 'Introuvable'}</p>
        <button onClick={() => navigate('/fournisseurs')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/fournisseurs')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Fournisseurs /{' '}
              <span className="text-primary font-mono">{fournisseur.code}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{fournisseur.nom}</h1>
          </div>
          <div className="hidden md:flex gap-2">
            <Link
              to={`/fournisseurs/${id}/modifier`}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <button
              onClick={() => setShowModalSuppression(true)}
              className="btn btn-ghost btn-sm text-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
          <span className={`badge ${
            fournisseur.statut === 'actif' ? 'badge-success' : 'badge-ghost'
          } badge-lg`}>
            {fournisseur.statut_display}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* CARTE PRINCIPALE */}
            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {fournisseur.logo ? (
                      <img src={fournisseur.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-base-content/50">
                      {fournisseur.code}
                    </p>
                    <p className="text-2xl font-bold truncate">{fournisseur.nom}</p>
                    <p className="text-sm text-base-content/60">
                      {fournisseur.sigle || fournisseur.type_display}
                    </p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Type</p>
                    <p className="font-medium text-xs">{fournisseur.type_display}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Note moyenne</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      <span className="font-bold">{Number(fournisseur.note_moyenne || 0).toFixed(1)}</span>
                      <span className="text-base-content/40">/5</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Délai livraison</p>
                    <p className="font-mono font-bold">{fournisseur.delai_livraison_jours} j</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Remise</p>
                    <p className="font-mono font-bold">{Number(fournisseur.remise_habituelle || 0).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Coordonnées</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Téléphone</p>
                  <p className="font-mono text-sm">{fournisseur.telephone || '—'}</p>
                  {fournisseur.telephone2 && (
                    <p className="font-mono text-xs text-base-content/60">{fournisseur.telephone2}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-base-content/50 uppercase">Email</p>
                  <p className="text-sm truncate">{fournisseur.email || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-base-content/50 uppercase">Adresse</p>
                  <p className="text-sm">
                    {fournisseur.adresse || '—'}
                    {(fournisseur.ville || fournisseur.pays) && (
                      <span className="text-base-content/60">
                        {' — '}
                        {[fournisseur.ville, fournisseur.pays].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* CONTACT COMMERCIAL */}
            {(fournisseur.contact_nom || fournisseur.contact_telephone) && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Contact commercial</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Nom</p>
                    <p className="font-medium text-sm">{fournisseur.contact_nom || '—'}</p>
                    {fournisseur.contact_fonction && (
                      <p className="text-xs text-base-content/60">{fournisseur.contact_fonction}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Téléphone contact</p>
                    <p className="font-mono text-sm">{fournisseur.contact_telephone || '—'}</p>
                    {fournisseur.contact_email && (
                      <p className="text-xs text-base-content/60 truncate">{fournisseur.contact_email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* COORDONNÉES BANCAIRES */}
            {(fournisseur.banque || fournisseur.numero_compte || fournisseur.iban) && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Coordonnées bancaires</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Banque</p>
                    <p className="text-sm">{fournisseur.banque || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">N° de compte</p>
                    <p className="font-mono text-sm">{fournisseur.numero_compte || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">IBAN</p>
                    <p className="font-mono text-sm">{fournisseur.iban || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* NOTES */}
            {fournisseur.notes && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{fournisseur.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm mb-3">Actions rapides</h3>
                <div className="space-y-2">
                  <Link
                    to={`/devis-fournisseurs/ajouter?fournisseur=${fournisseur.id}`}
                    className="btn btn-info btn-sm w-full gap-2 justify-start"
                  >
                    <FileText className="w-4 h-4" /> Nouveau devis
                  </Link>
                  <Link
                    to={`/bons-commande/ajouter?fournisseur=${fournisseur.id}`}
                    className="btn btn-success btn-sm w-full gap-2 justify-start"
                  >
                    <FileCheck className="w-4 h-4" /> Nouveau bon de commande
                  </Link>
                  <Link
                    to={`/factures-fournisseurs/ajouter?fournisseur=${fournisseur.id}`}
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <Receipt className="w-4 h-4" /> Nouvelle facture
                  </Link>
                  <Link
                    to={`/fournisseurs/${id}/modifier`}
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                  <Link
                    to="/fournisseurs"
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Building2 className="w-4 h-4" /> Tous les fournisseurs
                  </Link>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <p className="text-xs font-medium text-info mb-2">Activité</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Devis :</span>
                    <span className="font-bold">{fournisseur.nombre_devis || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Bons de commande :</span>
                    <span className="font-bold">{fournisseur.nombre_bons_commande || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Factures :</span>
                    <span className="font-bold">{fournisseur.nombre_factures || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SUPPRESSION */}
      {showModalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModalSuppression(false)}
          ></div>
          <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le fournisseur</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{fournisseur.nom}</strong> ?
              </p>
              <div className="flex gap-3">
                <button
                  className="btn flex-1"
                  onClick={() => setShowModalSuppression(false)}
                  disabled={chargementAction}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={supprimer}
                  disabled={chargementAction}
                >
                  {chargementAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FournisseurDetail;