// src/components/alertes/AlertesLogistique.jsx
import React from 'react';
import { Package } from 'lucide-react';
import AlertesFiltrees from './AlertesFiltrees';

const AlertesLogistique = () => (
  <AlertesFiltrees
    endpoint="/alertes/logistique/"
    titre="Alertes Logistique"
    sousTitre="Stocks critiques, inventaires"
    icone={Package}
    couleur="success"
    moduleFiltre="stocks"
  />
);

export default AlertesLogistique;