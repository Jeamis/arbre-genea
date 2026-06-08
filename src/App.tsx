/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Membre } from "./types";
import { FamilyTreeGraph } from "./components/FamilyTreeGraph";
import { MemberPanel } from "./components/MemberPanel";
import { initialMembres } from "./initialMembres";
import {
  Users,
  Search,
  Plus,
  TreePine,
  Download,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Unlock,
  LogOut,
  X
} from "lucide-react";

export default function App() {
  const [members, setMembers] = useState<Membre[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Membre[]>([]);
  const [selectedMember, setSelectedMember] = useState<Membre | null>(null);
  const [usingLocalState, setUsingLocalState] = useState(false);
  
  // États de l'interface
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [panelMode, setPanelMode] = useState<"view" | "add" | "edit" | null>(null);
  
  const [errorDefault, setErrorDefault] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // États d'administration
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdmin = !!adminToken;

  // Gérer la connexion d'administration
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    if (usingLocalState) {
      // Validation instantanée côté client en mode local
      setTimeout(() => {
        if (loginUsername === "admin" && loginPassword === "admin") {
          localStorage.setItem("admin_token", "mock-admin-token");
          setAdminToken("mock-admin-token");
          setIsLoginModalOpen(false);
          setLoginUsername("");
          setLoginPassword("");
        } else {
          setLoginError("Identifiants incorrects (admin/admin).");
        }
        setLoginLoading(false);
      }, 350);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("admin_token", data.token);
        setAdminToken(data.token);
        setIsLoginModalOpen(false);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        // En cas de retour négatif de l'API mais qu'on souhaite tout de même le login admin par défaut localement
        if (loginUsername === "admin" && loginPassword === "admin") {
          localStorage.setItem("admin_token", "mock-admin-token");
          setAdminToken("mock-admin-token");
          setIsLoginModalOpen(false);
          setLoginUsername("");
          setLoginPassword("");
        } else {
          setLoginError(data.message || "Identifiants incorrects.");
        }
      }
    } catch (err) {
      // Fallback local direct si le serveur n'est pas joignable (Vercel)
      if (loginUsername === "admin" && loginPassword === "admin") {
        localStorage.setItem("admin_token", "mock-admin-token");
        setAdminToken("mock-admin-token");
        setIsLoginModalOpen(false);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        setLoginError("Impossible de contacter le serveur d'authentification.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
    if (panelMode === "edit" || panelMode === "add") {
      setPanelMode(null);
    }
  };

  // Charger les membres au démarrage
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setErrorDefault(null);

      // On vérifie en priorité absolue si l'utilisateur possède déjà ses données familiales personnalisées
      // stockées localement dans son navigateur (LocalStorage) afin d'éviter que le serveur Express stateless
      // (notamment sur Vercel, où la persistance disque de membres.json n'existe pas) ne vienne écraser ses modifications (photos, naissances)
      const localData = localStorage.getItem("family_members");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && parsed.length > 0) {
            setMembers(parsed);
            setUsingLocalState(true);
            setLoading(false);
            return;
          }
        } catch (parseErr) {
          console.warn("Échec de parsing du LocalStorage, basculement vers l'API.");
        }
      }

      const res = await fetch("/api/membres");
      if (!res.ok) {
        throw new Error("Impossible de charger les membres via l'API.");
      }
      const data = await res.json();
      setMembers(data);
      localStorage.setItem("family_members", JSON.stringify(data));
      setUsingLocalState(false);
    } catch (err: any) {
      console.warn("API Express non disponible (Vercel/Static). Basculement en mode stockage LocalStorage.");
      setUsingLocalState(true);
      
      const localData = localStorage.getItem("family_members");
      if (localData) {
        try {
          setMembers(JSON.parse(localData));
        } catch (parseErr) {
          setMembers(initialMembres);
          localStorage.setItem("family_members", JSON.stringify(initialMembres));
        }
      } else {
        setMembers(initialMembres);
        localStorage.setItem("family_members", JSON.stringify(initialMembres));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filtrer les membres au fur et à mesure que la recherche change
  useEffect(() => {
    let result = [...members];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.prenom.toLowerCase().includes(q) ||
          m.nom.toLowerCase().includes(q) ||
          (m.lieu_naissance && m.lieu_naissance.toLowerCase().includes(q))
      );
    }

    if (genderFilter !== "ALL") {
      result = result.filter(m => m.sexe === genderFilter);
    }

    setFilteredMembers(result);
  }, [members, searchQuery, genderFilter]);

  // Si on sélectionne un membre, l'ouvrir dans le panneau latéral de détail
  const handleSelectMember = (member: Membre) => {
    setSelectedMember(member);
    setPanelMode("view");
  };

  // Switcher vers l'édition d'un membre
  const handleEditMember = (member: Membre) => {
    setSelectedMember(member);
    setPanelMode("edit");
  };

  // Compresse et convertit une image en Base64 optimisé pour tenir dans le LocalStorage (Vercel) sans saturer l'espace de stockage
  const compressAndEncodeImage = (file: File, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calcul des dimensions proportionnelles
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Exporter au format JPEG avec une bonne compression (70% de qualité)
          // Idéal pour les photos de profil (taille finale ~10 à 25 Ko au lieu de plusieurs Mo)
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(base64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Soumettre l'ajout ou la mise à jour (POST ou PUT)
  const handleSubmitMember = async (formData: FormData, isEdit: boolean, memberId?: string) => {
    if (usingLocalState) {
      const prenom = (formData.get("prenom") as string || "").trim();
      const nom = (formData.get("nom") as string || "").trim().toUpperCase();
      const sexe = formData.get("sexe") as "M" | "F" | "Autre";
      const date_naissance = (formData.get("date_naissance") as string || "").trim();
      const lieu_naissance = (formData.get("lieu_naissance") as string || "").trim();
      const pere_id = (formData.get("pere_id") as string) || undefined;
      const mere_id = (formData.get("mere_id") as string) || undefined;
      const conjoint_id = (formData.get("conjoint_id") as string) || undefined;
      const photoFile = formData.get("photo") as File | null;

      let photo_url = selectedMember?.photo_url;
      if (photoFile && photoFile.name && photoFile.size > 0) {
        try {
          photo_url = await compressAndEncodeImage(photoFile);
        } catch (err) {
          console.error("Erreur d'encodage de l'image de profil :", err);
        }
      } else if (formData.get("photo_url") === "") {
        photo_url = undefined;
      }

      let updatedList = [...members];

      if (isEdit && memberId) {
        const idx = updatedList.findIndex(m => m.id === memberId);
        if (idx !== -1) {
          const original = updatedList[idx];

          // Démonter l'ancien conjoint s'il change
          if (conjoint_id !== original.conjoint_id) {
            if (original.conjoint_id) {
              const oldConjIdx = updatedList.findIndex(m => m.id === original.conjoint_id);
              if (oldConjIdx !== -1 && updatedList[oldConjIdx].conjoint_id === memberId) {
                updatedList[oldConjIdx] = { ...updatedList[oldConjIdx], conjoint_id: undefined };
              }
            }
            if (conjoint_id) {
              const newConjIdx = updatedList.findIndex(m => m.id === conjoint_id);
              if (newConjIdx !== -1) {
                updatedList[newConjIdx] = { ...updatedList[newConjIdx], conjoint_id: memberId };
              }
            }
          }

          const updatedMember: Membre = {
            ...original,
            prenom,
            nom,
            sexe,
            date_naissance,
            lieu_naissance,
            photo_url,
            pere_id: pere_id || undefined,
            mere_id: mere_id || undefined,
            conjoint_id: conjoint_id || undefined
          };

          updatedList[idx] = updatedMember;
          setMembers(updatedList);
          localStorage.setItem("family_members", JSON.stringify(updatedList));

          setSelectedMember(updatedMember);
          setPanelMode("view");
        }
      } else {
        // Mode création
        const nextId = (Math.max(...updatedList.map(m => parseInt(m.id) || 0), 0) + 1).toString();
        
        const newMember: Membre = {
          id: nextId,
          prenom,
          nom,
          sexe,
          date_naissance,
          lieu_naissance,
          photo_url: photo_url || `/uploads/default-${sexe === "M" ? "m" : "f"}.jpg`,
          pere_id: pere_id || undefined,
          mere_id: mere_id || undefined,
          conjoint_id: conjoint_id || undefined
        };

        updatedList.push(newMember);

        if (conjoint_id) {
          const conjIdx = updatedList.findIndex(m => m.id === conjoint_id);
          if (conjIdx !== -1) {
            updatedList[conjIdx] = { ...updatedList[conjIdx], conjoint_id: nextId };
          }
        }

        setMembers(updatedList);
        localStorage.setItem("family_members", JSON.stringify(updatedList));
        setPanelMode(null);
      }
      return;
    }

    // -- MODE API NORMAL --
    const url = isEdit ? `/api/membres/${memberId}` : "/api/membres";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: adminToken ? { "Authorization": `Bearer ${adminToken}` } : {},
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Erreur de communication avec le serveur.");
    }

    await fetchMembers();

    if (isEdit && memberId) {
      const updatedRes = await fetch("/api/membres");
      if (updatedRes.ok) {
        const list: Membre[] = await updatedRes.json();
        const updated = list.find(m => m.id === memberId);
        if (updated) {
          setSelectedMember(updated);
          setPanelMode("view");
          return;
        }
      }
    }

    setPanelMode(null);
  };

  // Statistiques rapides
  const stats = {
    total: members.length,
    hommes: members.filter(m => m.sexe === "M").length,
    femmes: members.filter(m => m.sexe === "F").length,
    autres: members.filter(m => m.sexe === "Autre").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Barre d'en-tête premium */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Arbre Généalogique Dynamique
            </h1>
            <p className="text-xs text-slate-500 font-medium font-sans">
              Visualisez et explorez l'arbre de la famille
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {usingLocalState && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 text-xs font-semibold shadow-xs" title="Exécution autonome dans le navigateur (idéal pour Vercel). Les modifications sont sauvegardées localement.">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Mode Local (Vercel)
            </div>
          )}
          {isAdmin ? (
            <>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-750 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Mode Administrateur
              </div>
              <button
                id="add-member-top-btn"
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setPanelMode("add");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau Membre
              </button>
              <button
                id="logout-btn"
                type="button"
                onClick={handleLogout}
                className="border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <button
              id="login-btn"
              type="button"
              onClick={() => {
                setLoginError(null);
                setIsLoginModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 active:scale-98 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              Espace Admin
            </button>
          )}
        </div>
      </header>



      {/* Contenu de la page */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Messages de chargement et d'erreur */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600">Chargement de la base généalogique...</p>
            </div>
          )}

          {errorDefault && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-bold">Une erreur est survenue</h4>
                <p className="mt-1 text-red-700">{errorDefault}</p>
                <button
                  type="button"
                  onClick={fetchMembers}
                  className="mt-2 text-indigo-600 font-semibold hover:underline"
                >
                  Réessayer la connexion
                </button>
              </div>
            </div>
          )}

          {!loading && !errorDefault && (
            <>
              {/* Filtres & Recherche de membres */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100/80 shadow-xs">
                {/* Recherche */}
                <div className="relative w-full sm:max-w-xs shrink-0">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="search-input"
                    type="search"
                    placeholder="Chercher un prénom, nom, lieu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-inner"
                  />
                </div>

                {/* Filtre de Genre */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sexe:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setGenderFilter("ALL")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition ${
                        genderFilter === "ALL" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter("M")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition ${
                        genderFilter === "M" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Hommes (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter("F")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition ${
                        genderFilter === "F" ? "bg-white shadow-sm text-pink-600" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Femmes (F)
                    </button>
                  </div>
                </div>
              </div>

              {/* L'Arbre Interactif Principal */}
              <FamilyTreeGraph
                members={filteredMembers}
                onSelectMember={handleSelectMember}
                onEditMember={handleEditMember}
                selectedMember={selectedMember}
                isAdmin={isAdmin}
              />
            </>
          )}
        </div>

        {/* Panneau Latéral (Fiche, Ajout, Édition) */}
        {panelMode && (
          <aside className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg shadow-2xl transition-transform duration-300 transform translate-x-0 shrink-0 h-full">
            <div className="h-full bg-white relative">
              <MemberPanel
                mode={panelMode}
                selectedMember={selectedMember}
                allMembers={members}
                onClose={() => setPanelMode(null)}
                onSubmit={handleSubmitMember}
                onSelectMember={handleSelectMember}
                onSwitchToEdit={handleEditMember}
                isAdmin={isAdmin}
              />
            </div>
          </aside>
        )}
      </main>

      {/* Modal de connexion Admin */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Espace Administration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Authentifiez-vous pour créer ou éditer les profils de l'arbre
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-750 text-xs font-bold rounded-xl text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Identifiant
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 active:scale-98 transition text-white font-bold text-sm rounded-xl shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                {loginLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Se connecter
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
