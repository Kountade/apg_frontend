// components/clients/ContratClientForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Edit, Loader2, AlertCircle, CheckCircle,
  Plus, FileText, Building2, Calendar, DollarSign,
  MapPin, Briefcase, Users, Hash, Percent, User
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ContratClientForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const estEdition = id && id !== 'ajouter';
  const contratId = estEdition ? id : null;

  const [formData, setFormData] = useState({
    client: '',
    prestation: '',
    description: '',
    frequence: 'mensuel',
    zone: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    reconduction_tacite: false,
    jours_preavis: 30,
    tarif: '',
    tva: 0,
    modalite_paiement: 'especes',
    equipe: '',
    statut: 'brouillon',
    conditions_particulieres: '',
  });

  const [codeAffiche, setCodeAffiche] = useState('');
  const [clients, setClients] = useState([]);
  const [employes, setEmployes] = useState([]);

  useEffect(() => {
    chargerDonneesReference();
    if (estEdition && contratId) {
      chargerContrat(contratId);
    } else {
      const clientParam = searchParams.get('client');
      if (clientParam) setFormData(prev => ({ ...prev, client: clientParam }));
    }
  }, [id]);

  const chargerDonneesReference = async () => {
    try {
      const [clientsRes, employesRes] = await Promise.all([
        AxiosInstance.get('/clients/').catch(() => ({ data: [] })),
        AxiosInstance.get('/employes/').catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data.results || clientsRes.data || []);
      setEmployes(employesRes.data.results || employesRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const chargerContrat = async (cid) => {
    setChargementInitial(true);
    try {
      const response = await AxiosInstance.get(`/contrats-clients/${cid}/`);
      const data = response.data;

      setCodeAffiche(data.numero || '');

      setFormData({
        client: data.client || '',
        prestation: data.prestation || '',
        description: data.description || '',
        frequence: data.frequence || 'mensuel',
        zone: data.zone || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        reconduction_tacite: data.reconduction_tacite || false,
        jours_preavis: data.jours_preavis || 30,
        tarif: data.tarif || '',
        tva: data.tva || 0,
        modalite_paiement: data.modalite_paiement || 'especes',
        equipe: data.equipe || '',
        statut: data.statut || 'brouillon',
        conditions_particulieres: data.conditions_particulieres || '',
      });
    } catch (err) {
      setErreur('Impossible de charger le contrat');
    } finally {
      setChargementInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          if (['client', 'equipe'].includes(key)) dataToSend[key] = null;
          else if (['tva', 'jours_preavis'].includes(key)) dataToSend[key] = 0;
          else delete dataToSend[key];
        }
      });

      if (estEdition) {
        await AxiosInstance.patch(`/contrats-clients/${contratId}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate(`/contrats-clients/${contratId}`), 1200);
      } else {
        await AxiosInstance.post('/contrats-clients/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/contrats-clients'), 1200);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setErreur(errors.join(', '));
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const clientSelectionne = clients.find(c => String(c.id) === String(formData.client));
  const employeSelectionne = employes.find(e => String(e.id) === String(formData.equipe));

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">

      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(estEdition ? `/contrats-clients/${contratId}` : '/contrats-clients')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-base-content/50 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3 h-3" />
              Clients & Contrats / <span className="text-primary">{estEdition ? 'Modification' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {estEdition ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {estEdition ? `Modifier — ${codeAffiche}` : 'Nouveau contrat client'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none border-x-0 border-t-0 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Contrat {estEdition ? 'modifié' : 'créé'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none border-x-0 border-t-0 py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          <div className="lg:col-span-2 space-y-6">

            {/* Code auto */}
            <div className={`card shadow-sm border ${estEdition ? 'bg-info/5 border-info/30' : 'bg-success/5 border-success/30'}`}>
              <div className="card-body p-4 flex-row items-center gap-3">
                {estEdition ? (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-info" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-base-content/60 uppercase">Numéro du contrat</p>
                      <p className="font-mono font-bold text-lg text-info">{codeAffiche}</p>
                    </div>
                    <span className="badge badge-info badge-sm">🔒 Auto-généré</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-success">Numéro automatique</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Format : <span className="font-mono font-bold">CTR-{new Date().getFullYear()}-000001</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Client & Prestation */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client & Prestation</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Client <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="client"
                      className="select select-bordered w-full"
                      value={formData.client}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Sélectionner un client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.nom_complet || c.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Prestation <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="prestation"
                      className="input input-bordered w-full"
                      value={formData.prestation}
                      onChange={handleChange}
                      required
                      placeholder="Collecte des déchets ménagers..."
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description</span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Détails de la prestation..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Planification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-info" />
                  <h2 className="font-semibold text-sm">Planification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Fréquence <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="frequence"
                        className="select select-bordered w-full"
                        value={formData.frequence}
                        onChange={handleChange}
                        required
                      >
                        <option value="quotidien">Quotidien</option>
                        <option value="hebdomadaire">Hebdomadaire</option>
                        <option value="bimensuel">Bimensuel</option>
                        <option value="mensuel">Mensuel</option>
                        <option value="trimestriel">Trimestriel</option>
                        <option value="annuel">Annuel</option>
                        <option value="ponctuel">Ponctuel</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Zone</span>
                      </label>
                      <input
                        type="text"
                        name="zone"
                        className="input input-bordered w-full"
                        value={formData.zone}
                        onChange={handleChange}
                        placeholder="Zone A"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Date de début <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_debut"
                        className="input input-bordered w-full"
                        value={formData.date_debut}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Date de fin</span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        className="input input-bordered w-full"
                        value={formData.date_fin}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3 py-0 pb-1.5">
                        <input
                          type="checkbox"
                          name="reconduction_tacite"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={formData.reconduction_tacite}
                          onChange={handleChange}
                        />
                        <span className="label-text text-sm font-medium">Reconduction tacite</span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Jours de préavis</span>
                      </label>
                      <input
                        type="number"
                        name="jours_preavis"
                        className="input input-bordered w-full"
                        value={formData.jours_preavis}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarification */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <h2 className="font-semibold text-sm">Tarification</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Tarif HT <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm font-medium pointer-events-none">
                          GNF
                        </span>
                        <input
                          type="number"
                          name="tarif"
                          className="input input-bordered w-full pl-14"
                          value={formData.tarif}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">TVA (%)</span>
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                        <input
                          type="number"
                          name="tva"
                          className="input input-bordered w-full pl-10"
                          value={formData.tva}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Modalité de paiement</span>
                    </label>
                    <select
                      name="modalite_paiement"
                      className="select select-bordered w-full"
                      value={formData.modalite_paiement}
                      onChange={handleChange}
                    >
                      <option value="especes">Espèces</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="cheque">Chèque</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="prelevement">Prélèvement</option>
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-base-content/40" />
                        Équipe / Superviseur affecté
                      </span>
                    </label>
                    <select
                      name="equipe"
                      className="select select-bordered w-full"
                      value={formData.equipe}
                      onChange={handleChange}
                    >
                      <option value="">— Aucun —</option>
                      {employes.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.matricule ? `[${e.matricule}] ` : ''}{e.nom_complet || `${e.prenom || ''} ${e.nom}`.trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions particulières */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-base-content/60" />
                  <h2 className="font-semibold text-sm">Conditions particulières</h2>
                </div>
                <div className="p-5">
                  <textarea
                    name="conditions_particulieres"
                    className="textarea textarea-bordered w-full"
                    value={formData.conditions_particulieres}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Conditions spécifiques..."
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE LATÉRALE */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <p className="font-mono text-xs text-base-content/50">
                    {estEdition ? codeAffiche : `CTR-${new Date().getFullYear()}-...`}
                  </p>
                  <p className="font-bold text-sm mt-1 truncate">
                    {clientSelectionne?.nom_complet || clientSelectionne?.nom || 'Client non sélectionné'}
                  </p>
                  <p className="text-xs text-base-content/50 truncate mt-0.5">
                    {formData.prestation || 'Prestation'}
                  </p>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Fréquence :</span>
                      <span className="font-medium">{formData.frequence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Tarif :</span>
                      <span className="font-medium font-mono">
                        {formData.tarif
                          ? new Intl.NumberFormat('fr-FR').format(Number(formData.tarif)) + ' GNF'
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Équipe :</span>
                      <span className="font-medium truncate max-w-[120px]">
                        {employeSelectionne
                          ? (employeSelectionne.nom_complet || `${employeSelectionne.prenom || ''} ${employeSelectionne.nom}`.trim())
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <span className={`badge badge-sm ${
                    formData.statut === 'actif' ? 'badge-success' :
                    formData.statut === 'brouillon' ? 'badge-ghost' : 'badge-warning'
                  }`}>
                    {formData.statut}
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <label className="label py-0 pb-1.5">
                  <span className="label-text text-sm font-medium">Statut</span>
                </label>
                <select
                  name="statut"
                  className="select select-bordered w-full"
                  value={formData.statut}
                  onChange={handleChange}
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="expire">Expiré</option>
                  <option value="resilie">Résilié</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => navigate(estEdition ? `/contrats-clients/${contratId}` : '/contrats-clients')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary gap-2 min-w-[160px]" disabled={chargement}>
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le contrat'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContratClientForm;