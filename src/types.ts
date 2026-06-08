/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Membre {
  id: string;
  prenom: string;
  nom: string;
  sexe: 'M' | 'F' | 'Autre';
  date_naissance: string; // YYYY-MM-DD
  lieu_naissance: string;
  photo_url?: string; // S'il y a une photo uploadée
  pere_id?: string;
  mere_id?: string;
  conjoint_id?: string;
}
