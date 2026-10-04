import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import logoFallback from '../assets/logo.svg'
import {
  Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle,
  Truck, Recycle, Users, BarChart3, ShieldCheck,
  Building2, Globe
} from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [currentYear] = useState(new Date().getFullYear())

  // ============================================================
  // ÉTABLISSEMENT (logo + nom dynamiques)
  // ============================================================
  const [etablissement, setEtablissement] = useState(null)
  const [loadingEtab, setLoadingEtab] = useState(true)
  const [logoUrl, setLogoUrl] = useState(null)

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath
    const baseURL = AxiosInstance.defaults.baseURL || ''
    if (logoPath.startsWith('/media/') || logoPath.startsWith('/static/')) return `${baseURL}${logoPath}`
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`
  }

  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await AxiosInstance.get('/etablissements/unique/')
        if (response.data) {
          setEtablissement(response.data)
          if (response.data.logo) setLogoUrl(getLogoUrl(response.data.logo))
        }
      } catch (error) {
        console.error('Erreur établissement:', error)
      } finally {
        setLoadingEtab(false)
      }
    }
    fetchEtablissement()
  }, [])

  const companyName = !loadingEtab ? (etablissement?.nom || 'APG ASSAINISSEMENT') : 'APG ASSAINISSEMENT'
  const companySigle = !loadingEtab ? (etablissement?.sigle || 'Gestion des Déchets Domestiques') : 'Gestion des Déchets Domestiques'
  const companyLogo = logoUrl || logoFallback

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) setRememberMe(true)
  }, [])

  const handleLogin = async (data) => {
    setLoading(true)
    setShowMessage(false)

    try {
      const response = await AxiosInstance.post('login/', {
        email: data.email,
        password: data.password,
      })

      localStorage.setItem('Token', response.data.token)
      localStorage.setItem('User', JSON.stringify(response.data.user))

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      setMessageText('Connexion réussie. Redirection en cours...')
      setMessageType('success')
      setShowMessage(true)

      setTimeout(() => navigate('/dashboard'), 1200)

    } catch (error) {
      let errorMessage = 'Échec de connexion. Veuillez réessayer.'
      if (error.response) {
        if (error.response.status === 401) errorMessage = 'Email ou mot de passe incorrect.'
        else if (error.response.status === 403) errorMessage = 'Compte désactivé. Contactez l\'administrateur.'
        else if (error.response.status === 429) errorMessage = 'Trop de tentatives. Veuillez patienter 5 minutes.'
        else if (error.response.data && error.response.data.error) errorMessage = error.response.data.error
      } else if (error.request) {
        errorMessage = 'Serveur inaccessible. Vérifiez votre connexion internet.'
      }

      setMessageText(errorMessage)
      setMessageType('error')
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 5000)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Truck, text: 'Gestion des collectes' },
    { icon: Recycle, text: 'Suivi du recyclage' },
    { icon: Users, text: 'Gestion des clients' },
    { icon: BarChart3, text: 'Statistiques et rapports' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-200">

      {/* Fond décoratif discret */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full filter blur-3xl"></div>
      </div>

      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`alert shadow-lg border-l-4 ${
            messageType === 'error' ? 'alert-error border-l-error' : 'alert-success border-l-success'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl bg-base-100 border border-base-300/30">

          {/* ============================================ */}
          {/* COLONNE GAUCHE — BRANDING INSTITUTIONNEL      */}
          {/* ============================================ */}
          <div className="hidden lg:flex relative bg-primary overflow-hidden">
            {/* Motif discret */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>

            <div className="relative z-10 p-10 text-primary-content flex flex-col justify-between h-full w-full">

              {/* ============================================ */}
              {/* ✅ LOGO + NOM + SIGLE CENTRÉS AU MILIEU       */}
              {/* ============================================ */}
              <div className="flex flex-col items-center text-center">
                {/* Logo centré */}
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-secondary overflow-hidden mb-5">
                  {!loadingEtab && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={companyName}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => { e.target.src = logoFallback; }}
                    />
                  ) : (
                    <img
                      src={logoFallback}
                      alt={companyName}
                      className="w-12 h-12 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Nom centré */}
                <h1 className="text-2xl font-bold tracking-tight text-primary-content leading-tight mb-1">
                  {loadingEtab ? 'Chargement...' : companyName}
                </h1>

                {/* Sigle centré */}
                <p className="text-sm text-primary-content/70">
                  {loadingEtab ? '' : companySigle}
                </p>

                {/* Petit séparateur décoratif */}
                <div className="w-16 h-0.5 bg-secondary rounded-full mt-5"></div>
              </div>

              {/* Titre + description centrés */}
              <div className="text-center mt-10">
                <h2 className="text-2xl font-bold mb-3 leading-tight text-primary-content">
                  Plateforme de gestion
                </h2>
                <p className="text-sm text-primary-content/75 leading-relaxed max-w-xs mx-auto">
                  Solution intégrée pour la gestion complète de vos activités
                  de collecte, traitement et valorisation des déchets.
                </p>
              </div>

              {/* Liste des fonctionnalités — centrée */}
              <div className="space-y-3 my-10 max-w-xs mx-auto w-full">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <feature.icon className="w-4 h-4 text-primary-content" />
                    </div>
                    <span className="text-sm font-medium text-primary-content/90 text-left">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer institutionnel */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-primary-content/70">
                    Connexion sécurisée SSL 256-bit
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-primary-content/50">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>APG Digital</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>www.apg-assainissement.com</span>
                  </div>
                </div>

                <p className="text-xs text-primary-content/40 text-center">
                  Version 1.0 — © {currentYear} {companyName}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLONNE DROITE — FORMULAIRE                   */}
          {/* ============================================ */}
          <div className="flex items-center justify-center p-8 md:p-12 bg-base-100">
            <div className="w-full max-w-md">

              <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">

                {/* En-tête formulaire */}
                <div className="space-y-5">
                  {/* Logo mobile (visible sur petits écrans) */}
                  <div className="lg:hidden flex justify-center">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-md border-2 border-secondary overflow-hidden">
                      {!loadingEtab && logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={companyName}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => { e.target.src = logoFallback; }}
                        />
                      ) : (
                        <img
                          src={logoFallback}
                          alt={companyName}
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-center lg:text-left">
                    <h2 className="text-2xl font-bold text-base-content">
                      Connexion
                    </h2>
                    <p className="text-sm text-base-content/60 mt-1">
                      Accédez à votre espace professionnel
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="form-control w-full">
                  <label className="label pb-1">
                    <span className="label-text text-sm font-medium text-base-content/80">
                      Adresse email
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-base-content/40" />
                    </div>
                    <input
                      type="email"
                      placeholder="prenom.nom@apg-assainissement.com"
                      className={`input input-bordered w-full pl-10 py-2.5 text-sm focus:input-primary ${errors.email ? 'input-error' : ''}`}
                      {...register('email', {
                        required: "L'adresse email est requise",
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Format d'email invalide" }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <label className="label pt-1">
                      <span className="label-text-alt text-error text-xs">{errors.email.message}</span>
                    </label>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="form-control w-full">
                  <label className="label pb-1">
                    <span className="label-text text-sm font-medium text-base-content/80">
                      Mot de passe
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-base-content/40" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`input input-bordered w-full pl-10 pr-10 py-2.5 text-sm focus:input-primary ${errors.password ? 'input-error' : ''}`}
                      {...register('password', {
                        required: "Le mot de passe est requis",
                        minLength: { value: 6, message: "Minimum 6 caractères" }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content transition"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <label className="label pt-1">
                      <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                    </label>
                  )}
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-xs text-base-content/60">Se souvenir de moi</span>
                  </label>

                  <Link
                    to="/request/password_reset"
                    className="text-xs text-primary hover:text-primary/80 transition font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Bouton connexion */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Se connecter</span>
                    </>
                  )}
                </button>

                {/* Séparateur */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-base-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-base-100 text-base-content/40">
                      Pas encore de compte ?
                    </span>
                  </div>
                </div>

                {/* Bouton inscription */}
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-base-300 text-base-content/80 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Créer un compte
                </Link>

                {/* Footer discret */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                    <span className="text-xs text-base-content/40">Système opérationnel</span>
                  </div>
                  <span className="text-base-content/20">•</span>
                  <span className="text-xs text-base-content/40">SSL 256-bit</span>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-base-content/30">
                    © {currentYear} {companyName}. Tous droits réservés.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  )
}

export default Login