/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Membre } from "../types";
import {
  User,
  Heart,
  Calendar,
  MapPin,
  Upload,
  Users,
  X,
  Plus,
  Edit,
  ArrowRight,
  Baby
} from "lucide-react";

interface MemberPanelProps {
  mode: "view" | "add" | "edit";
  selectedMember: Membre | null;
  allMembers: Membre[];
  onClose: () => void;
  onSubmit: (formData: FormData, isEdit: boolean, memberId?: string) => Promise<void>;
  onSelectMember: (member: Membre) => void;
  onSwitchToEdit: (member: Membre) => void;
  isAdmin: boolean;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  mode,
  selectedMember,
  allMembers,
  onClose,
  onSubmit,
  onSelectMember,
  onSwitchToEdit,
  isAdmin
}) => {
  // Champs de formulaire
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [sexe, setSexe] = useState<'M' | 'F' | 'Autre'>("M");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [pereId, setPereId] = useState("");
  const [mereId, setMereId] = useState("");
  const [conjointId, setConjointId] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remplir le formulaire si on est en mode édition
  useEffect(() => {
    if (mode === "edit" && selectedMember) {
      setPrenom(selectedMember.prenom);
      setNom(selectedMember.nom);
      setSexe(selectedMember.sexe);
      setDateNaissance(selectedMember.date_naissance || "");
      setLieuNaissance(selectedMember.lieu_naissance || "");
      setPereId(selectedMember.pere_id || "");
      setMereId(selectedMember.mere_id || "");
      setConjointId(selectedMember.conjoint_id || "");
      setPhotoFile(null);
      setPhotoPreview(selectedMember.photo_url || null);
    } else if (mode === "add") {
      setPrenom("");
      setNom("");
      setSexe("M");
      setDateNaissance("");
      setLieuNaissance("");
      setPereId("");
      setMereId("");
      setConjointId("");
      setPhotoFile(null);
      setPhotoPreview(null);
    }
    setError(null);
  }, [mode, selectedMember]);

  // Gérer la sélection de photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Soumettre le formulaire
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) {
      setError("Le prénom et le nom sont requis.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("prenom", prenom.trim());
      data.append("nom", nom.trim().toUpperCase());
      data.append("sexe", sexe);
      data.append("date_naissance", dateNaissance);
      data.append("lieu_naissance", lieuNaissance.trim());
      data.append("pere_id", pereId);
      data.append("mere_id", mereId);
      data.append("conjoint_id", conjointId);

      if (photoFile) {
        data.append("photo", photoFile);
      }

      await onSubmit(data, mode === "edit", selectedMember?.id);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Relations pour l'affichage fiche détaillée
  const currentPere = allMembers.find(m => m.id === selectedMember?.pere_id);
  const currentMere = allMembers.find(m => m.id === selectedMember?.mere_id);
  const currentConjoint = allMembers.find(m => m.id === selectedMember?.conjoint_id);
  const currentEnfants = allMembers.filter(
    m => m.pere_id === selectedMember?.id || m.mere_id === selectedMember?.id
  );
  const currentFreresSoeurs = allMembers.filter(
    m =>
      m.id !== selectedMember?.id &&
      ((selectedMember?.pere_id && m.pere_id === selectedMember.pere_id) ||
        (selectedMember?.mere_id && m.mere_id === selectedMember.mere_id))
  );

  // Filtrer les candidats parents/conjoints potentiels pour éviter de se lier à soi-même
  const parentsCandidats = allMembers.filter(m => m.id !== selectedMember?.id);
  const conjoinCandidats = allMembers.filter(m => m.id !== selectedMember?.id);

  // Formatter la date de naissance pour l'affichage
  const formatDateLocale = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200/90 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {mode === "view" && <User className="w-5 h-5 text-indigo-600" />}
          {mode === "add" && <Plus className="w-5 h-5 text-emerald-600" />}
          {mode === "edit" && <Edit className="w-5 h-5 text-amber-600" />}
          {mode === "view" && "Fiche Individuelle"}
          {mode === "add" && "Ajouter un Membre"}
          {mode === "edit" && "Modifier le Membre"}
        </h2>
        <button
          id="close-panel-btn"
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* --- MODE VUE --- */}
        {mode === "view" && selectedMember && (
          <div className="space-y-6">
            {/* Profil principal */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <div className="relative mb-4">
                {selectedMember.photo_url ? (
                  <img
                    src={selectedMember.photo_url}
                    alt={`${selectedMember.prenom} ${selectedMember.nom}`}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-50 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center font-bold text-3xl text-white shadow-md ${
                    selectedMember.sexe === "M" ? "bg-blue-500" : selectedMember.sexe === "F" ? "bg-pink-500" : "bg-emerald-500"
                  }`}>
                    {selectedMember.prenom.charAt(0)}{selectedMember.nom.charAt(0)}
                  </div>
                )}
                <span className={`absolute bottom-0 right-1 px-2.5 py-0.5 text-xs font-bold rounded-full text-white shadow ${
                  selectedMember.sexe === "M" ? "bg-blue-600" : selectedMember.sexe === "F" ? "bg-pink-600" : "bg-emerald-600"
                }`}>
                  {selectedMember.sexe === "M" ? "Homme" : selectedMember.sexe === "F" ? "Femme" : "Autre"}
                </span>
              </div>

              <h1 id="selected-member-name" className="text-2xl font-extrabold text-slate-950">
                {selectedMember.nom && <span className="uppercase font-extrabold mr-1.5">{selectedMember.nom}</span>}
                {selectedMember.prenom}
              </h1>

              <div className="text-sm text-slate-500 mt-2 space-y-1.5">
                {selectedMember.date_naissance && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Né(e) le {formatDateLocale(selectedMember.date_naissance)}</span>
                  </div>
                )}
                {selectedMember.lieu_naissance && (
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Lieu : {selectedMember.lieu_naissance}</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <button
                  id="edit-profile-btn"
                  type="button"
                  onClick={() => onSwitchToEdit(selectedMember)}
                  className="mt-4 px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Modifier ce profil
                </button>
              )}
            </div>

            {/* Relations de premier degré - section parents */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Parents direct
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {/* Père */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                      P
                    </div>
                    <div>
                      <span className="text-[11px] block font-medium text-slate-400 uppercase">Père</span>
                      {currentPere ? (
                        <button
                          type="button"
                          onClick={() => onSelectMember(currentPere)}
                          className="font-semibold text-slate-800 text-sm hover:text-indigo-650 hover:underline text-left block"
                        >
                          {currentPere.nom ? `${currentPere.nom.toUpperCase()} ` : ""}{currentPere.prenom}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Non renseigné</span>
                      )}
                    </div>
                  </div>
                  {currentPere && <ArrowRight className="w-4 h-4 text-slate-300" />}
                </div>

                {/* Mère */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                      M
                    </div>
                    <div>
                      <span className="text-[11px] block font-medium text-slate-400 uppercase">Mère</span>
                      {currentMere ? (
                        <button
                          type="button"
                          onClick={() => onSelectMember(currentMere)}
                          className="font-semibold text-slate-800 text-sm hover:text-indigo-650 hover:underline text-left block"
                        >
                          {currentMere.nom ? `${currentMere.nom.toUpperCase()} ` : ""}{currentMere.prenom}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Non renseignée</span>
                      )}
                    </div>
                  </div>
                  {currentMere && <ArrowRight className="w-4 h-4 text-slate-300" />}
                </div>
              </div>
            </div>

            {/* Conjoint */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Union / Partenaire
              </h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/40 border border-rose-100/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs shrink-0">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-[11px] block font-medium text-slate-400 uppercase">Conjoint(e)</span>
                    {currentConjoint ? (
                      <button
                        type="button"
                        onClick={() => onSelectMember(currentConjoint)}
                        className="font-semibold text-slate-800 text-sm hover:text-rose-650 hover:underline text-left block"
                      >
                        {currentConjoint.nom ? `${currentConjoint.nom.toUpperCase()} ` : ""}{currentConjoint.prenom}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Aucun conjoint renseigné</span>
                    )}
                  </div>
                </div>
                {currentConjoint && <ArrowRight className="w-4 h-4 text-slate-300" />}
              </div>
            </div>

            {/* Enfants */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-emerald-500" />
                Descendance ({currentEnfants.length})
              </h3>
              {currentEnfants.length > 0 ? (
                <div className="space-y-1.5">
                  {currentEnfants.map(enfant => (
                    <div
                      key={enfant.id}
                      onClick={() => onSelectMember(enfant)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${enfant.sexe === "M" ? "bg-blue-500" : "bg-pink-500"}`} />
                        <span className="text-sm font-semibold text-slate-800">
                          {enfant.nom ? `${enfant.nom.toUpperCase()} ` : ""}{enfant.prenom}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {enfant.date_naissance ? (new Date(enfant.date_naissance)).getFullYear() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  Aucun enfant répertorié
                </div>
              )}
            </div>

            {/* Frères et Sœurs */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450">
                Frères & Sœurs ({currentFreresSoeurs.length})
              </h3>
              {currentFreresSoeurs.length > 0 ? (
                <div className="space-y-1.5">
                  {currentFreresSoeurs.map(fs => (
                    <div
                      key={fs.id}
                      onClick={() => onSelectMember(fs)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${fs.sexe === "M" ? "bg-blue-500" : "bg-pink-500"}`} />
                        <span className="text-sm font-semibold text-slate-800">
                          {fs.nom ? `${fs.nom.toUpperCase()} ` : ""}{fs.prenom}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {fs.date_naissance ? (new Date(fs.date_naissance)).getFullYear() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  Aucun frère ou sœur direct(e) répertorié(e)
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODE FORMULAIRE (AJOUT OU ÉDITION) --- */}
        {(mode === "add" || mode === "edit") && (
          <form onSubmit={handleSubmitForm} className="space-y-5">
            {/* Téléversement de photo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Photo de profil
              </label>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="relative cursor-pointer bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-slate-700 transition inline-flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Choisir une image
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format JPEG, PNG, GIF ou WEBP (Max. 5 Mo)
                  </p>
                </div>
              </div>
            </div>

            {/* Prénom & Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-750 mb-1.5">
                  Prénom *
                </label>
                <input
                  id="prenom-input"
                  type="text"
                  required
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  placeholder="Ex: Lucas"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-750 mb-1.5">
                  Nom *
                </label>
                <input
                  id="nom-input"
                  type="text"
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Ex: Martin"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
                />
              </div>
            </div>

            {/* Sexe */}
            <div>
              <label className="block text-xs font-bold text-slate-755 mb-2">
                Sexe *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 border border-slate-200 py-2 px-4 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition w-full justify-center">
                  <input
                    type="radio"
                    name="sexe"
                    value="M"
                    checked={sexe === "M"}
                    onChange={() => setSexe("M")}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Homme (M)</span>
                </label>
                <label className="flex items-center gap-2 border border-slate-200 py-2 px-4 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition w-full justify-center">
                  <input
                    type="radio"
                    name="sexe"
                    value="F"
                    checked={sexe === "F"}
                    onChange={() => setSexe("F")}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Femme (F)</span>
                </label>
                <label className="flex items-center gap-2 border border-slate-200 py-2 px-4 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition w-full justify-center">
                  <input
                    type="radio"
                    name="sexe"
                    value="Autre"
                    checked={sexe === "Autre"}
                    onChange={() => setSexe("Autre")}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Autre</span>
                </label>
              </div>
            </div>

            {/* Naissance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-750 mb-1.5">
                  Date de naissance
                </label>
                <input
                  id="birth-date-input"
                  type="date"
                  value={dateNaissance}
                  onChange={e => setDateNaissance(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-750 mb-1.5">
                  Lieu de naissance
                </label>
                <input
                  id="birth-place-input"
                  type="text"
                  value={lieuNaissance}
                  onChange={e => setLieuNaissance(e.target.value)}
                  placeholder="Ex: Paris"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-6" />

            {/* Relations (Père, Mère, Conjoint) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Liaisons de parenté / Union
              </h3>

              {/* Père */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Père (ID ou Sélectionner)
                </label>
                <select
                  id="pere-select"
                  value={pereId}
                  onChange={e => setPereId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm outline-none"
                >
                  <option value="">-- Aucun père assigné --</option>
                  {parentsCandidats
                    .filter(p => p.sexe === "M" || p.sexe === "Autre")
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom ? `${p.nom.toUpperCase()} ` : ""}{p.prenom} (ID: {p.id})
                      </option>
                    ))}
                </select>
              </div>

              {/* Mère */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mère (ID ou Sélectionner)
                </label>
                <select
                  id="mere-select"
                  value={mereId}
                  onChange={e => setMereId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm outline-none"
                >
                  <option value="">-- Aucune mère assignée --</option>
                  {parentsCandidats
                    .filter(m => m.sexe === "F" || m.sexe === "Autre")
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom ? `${m.nom.toUpperCase()} ` : ""}{m.prenom} (ID: {m.id})
                      </option>
                    ))}
                </select>
              </div>

              {/* Conjoint */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Époux / Épouse ou Conjoint (Partenaire)
                </label>
                <select
                  id="conjoint-select"
                  value={conjointId}
                  onChange={e => setConjointId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm outline-none"
                >
                  <option value="">-- Aucun conjoint --</option>
                  {conjoinCandidats.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom ? `${c.nom.toUpperCase()} ` : ""}{c.prenom} (ID: {c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Soumission */}
            <div className="pt-6 flex gap-3">
              <button
                id="cancel-form-btn"
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50 transition active:scale-98"
              >
                Annuler
              </button>
              <button
                id="submit-form-btn"
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition active:scale-98 shadow-md"
              >
                {saving ? "Sauvegarde..." : mode === "edit" ? "Mettre à jour" : "Créer le profil"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
