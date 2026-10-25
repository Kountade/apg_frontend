// src/components/alertes/AlertesFinance.jsx
import React from 'react';
import { DollarSign } from 'lucide-react';
import AlertesFiltrees from './AlertesFiltrees';

const AlertesFinance = () => (
  <AlertesFiltrees
    endpoint="/alertes/finance/"
    titre="Alertes Finance"
    sousTitre="Achats, Paie, Trésorerie"
    icone={DollarSign}
    couleur="warning"
    moduleFiltre={null}
  />
);

export default AlertesFinance;