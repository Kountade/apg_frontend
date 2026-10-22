// src/components/stocks/ArticleDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Package2, Edit, Trash2, Loader2, AlertCircle,
  CheckCircle, AlertTriangle, Warehouse, Info,
  TrendingDown, TrendingUp, DollarSign
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showModalSuppression, setShowModalSuppression] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);

  useEffect(() => {
    charger();
  }, [id]);

  const charger = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await AxiosInstance.get(`/articles/${id}/`);
      setArticle(res.data);
      const stocksRes = await AxiosInstance
        .get(`/articles/${id}/stocks/`)
        .catch(() => ({ data: [] }));
      setStocks(stocksRes.data.results || stocksRes.data || []);
    } catch (err) {
      setErreur("Impossible de charger l'article");
    } finally {
      setChargement(false);
    }
  };

  const supprimer = async () => {
    setChargementAction(true);
    try {
      await AxiosInstance.delete(`/articles/${id}/`);
      navigate('/articles');
    } catch (err) {
      alert('Erreur lors de la suppression');
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

  if (erreur) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
        <p>{erreur}</p>
        <button onClick={() => navigate('/articles')} className="btn btn-primary mt-4">
          Retour
        </button>
      </div>
    );
  }

  if (!article) return null;

  const estCritique = article.est_critique;
  const estAlerte = article.est_en_alerte;

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/articles')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Articles / <span className="text-primary font-mono">{article.code}</span>
            </div>
            <h1 className="text-xl font-bold truncate">{article.designation}</h1>
          </div>
          <div className="hidden md:flex gap-2">
            <Link
              to={`/articles/${id}/modifier`}
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
          {estCritique ? (
            <span className="badge badge-error badge-lg gap-1">
              <AlertCircle className="w-4 h-4" /> Critique
            </span>
          ) : estAlerte ? (
            <span className="badge badge-warning badge-lg gap-1">
              <AlertTriangle className="w-4 h-4" /> Alerte
            </span>
          ) : (
            <span className="badge badge-success badge-lg gap-1">
              <CheckCircle className="w-4 h-4" /> OK
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* CARTE PRINCIPALE */}
            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {article.photo ? (
                      <img
                        src={article.photo}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Package2 className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-base-content/50">
                      {article.code}
                    </p>
                    <p className="text-2xl font-bold truncate">{article.designation}</p>
                    <p className="text-sm text-base-content/60">{article.categorie_nom}</p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Stock total</p>
                    <p className="text-2xl font-bold font-mono">{article.stock_total || 0}</p>
                    <p className="text-xs text-base-content/50">
                      {article.unite_display || article.unite}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Stock minimum</p>
                    <p className="font-mono font-bold text-lg">{article.stock_minimum}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Seuil d'alerte</p>
                    <p className="font-mono font-bold text-lg">{article.seuil_alerte}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase">Prix d'achat</p>
                    <p className="font-mono font-bold text-lg">
                      {formaterMontant(article.prix_achat)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STOCK PAR MAGASIN */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Stock par magasin</h2>
              </div>
              <div className="p-5">
                {stocks.length === 0 ? (
                  <div className="text-center py-8 text-base-content/40">
                    <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun stock enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stocks.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{s.magasin_nom}</p>
                          {s.emplacement && (
                            <p className="text-xs text-base-content/50">{s.emplacement}</p>
                          )}
                        </div>
                        <p className="font-mono font-bold text-lg">{s.quantite}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DESCRIPTION */}
            {article.description && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Info className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Description</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{article.description}</p>
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
                    to={`/mouvements-stock/ajouter?article=${article.id}&type=entree`}
                    className="btn btn-success btn-sm w-full gap-2 justify-start"
                  >
                    <TrendingUp className="w-4 h-4" /> Nouvelle entrée
                  </Link>
                  <Link
                    to={`/mouvements-stock/ajouter?article=${article.id}&type=sortie`}
                    className="btn btn-warning btn-sm w-full gap-2 justify-start"
                  >
                    <TrendingDown className="w-4 h-4" /> Nouvelle sortie
                  </Link>
                  <Link
                    to={`/articles/${article.id}/modifier`}
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                  <Link
                    to="/articles"
                    className="btn btn-ghost btn-sm w-full gap-2 justify-start"
                  >
                    <Package2 className="w-4 h-4" /> Tous les articles
                  </Link>
                </div>
              </div>
            </div>

            {article.fournisseur_nom && (
              <div className="card bg-info/5 border border-info/20 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-info mb-1">Fournisseur</p>
                      <p className="text-base-content/70">{article.fournisseur_nom}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <h3 className="text-xl font-bold mb-2">Supprimer l'article</h3>
              <p className="text-base-content/60 mb-4">
                Supprimer <strong>{article.designation}</strong> ?
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
                  {chargementAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;