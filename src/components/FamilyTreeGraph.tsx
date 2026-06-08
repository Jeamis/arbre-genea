/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Membre } from "../types";
import { Heart, Edit, Users, ChevronDown, UserPlus, Info, ZoomIn } from "lucide-react";

interface FamilyTreeGraphProps {
  members: Membre[];
  onSelectMember: (member: Membre) => void;
  onEditMember: (member: Membre) => void;
  selectedMember: Membre | null;
  isAdmin: boolean;
}

export const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({
  members,
  onSelectMember,
  onEditMember,
  selectedMember,
  isAdmin
}) => {
  // Choisir dynamiquement l'ancêtre d'ancrage (le couple racine)
  const [overrideRootId, setOverrideRootId] = useState<string | null>(null);

  // Étape 1 : Identifier tous les membres qui n'ont pas de parents enregistrés
  const rootAncestors = useMemo(() => {
    return members.filter(
      m => (!m.pere_id && !m.mere_id) || 
           (!members.some(parent => parent.id === m.pere_id) && !members.some(parent => parent.id === m.mere_id))
    );
  }, [members]);

  // Trouver tous les couples éligibles au sommet (ceux de niveau racine qui ont un conjoint)
  const rootCouples = useMemo(() => {
    const list: Array<{ husband: Membre; wife: Membre }> = [];
    const processed = new Set<string>();

    rootAncestors.forEach(m => {
      if (processed.has(m.id)) return;
      if (m.conjoint_id) {
        const conj = members.find(c => c.id === m.conjoint_id);
        if (conj) {
          const husband = m.sexe === "M" ? m : conj;
          const wife = m.sexe === "F" ? m : conj;
          list.push({ husband, wife });
          processed.add(m.id);
          processed.add(conj.id);
        }
      }
    });

    return list;
  }, [rootAncestors, members]);

  // Déterminer la racine active de l'arbre
  const activeRoot = useMemo(() => {
    if (members.length === 0) return null;

    // Si on a explicitement choisi une autre racine
    if (overrideRootId) {
      const selected = members.find(m => m.id === overrideRootId);
      if (selected) {
        const conj = members.find(m => m.id === selected.conjoint_id);
        return {
          father: selected.sexe === "M" ? selected : (conj || null),
          mother: selected.sexe === "F" ? selected : (conj || null),
          single: !conj ? selected : null
        };
      }
    }

    // Par défaut, prendre le premier couple racine trouvé
    if (rootCouples.length > 0) {
      return {
        father: rootCouples[0].husband,
        mother: rootCouples[0].wife,
        single: null
      };
    }

    // Sinon, juste le premier membre sans parent
    if (rootAncestors.length > 0) {
      const first = rootAncestors[0];
      const conj = members.find(m => m.id === first.conjoint_id);
      return {
        father: first.sexe === "M" ? first : (conj || null),
        mother: first.sexe === "F" ? first : (conj || null),
        single: !conj ? first : null
      };
    }

    // Ultime secours
    return {
      father: members[0]?.sexe === "M" ? members[0] : null,
      mother: members[0]?.sexe === "F" ? members[0] : null,
      single: members.length === 1 ? members[0] : null
    };
  }, [members, overrideRootId, rootCouples, rootAncestors]);

  // Charger les enfants direct du couple racine (Génération II)
  const level2Children = useMemo(() => {
    if (!activeRoot) return [];
    const fatherId = activeRoot.father?.id;
    const motherId = activeRoot.mother?.id;
    const singleId = activeRoot.single?.id;

    return members.filter(m => 
      (fatherId && m.pere_id === fatherId) || 
      (motherId && m.mere_id === motherId) ||
      (singleId && (m.pere_id === singleId || m.mere_id === singleId))
    );
  }, [members, activeRoot]);

  // Associer chaque enfant de Génération 2 avec son éventuel conjoint (conjoint_id)
  const level2CouplesAndSingles = useMemo(() => {
    const list: Array<{ child: Membre; spouse: Membre | null; grandkids: Membre[] }> = [];
    const processed = new Set<string>();

    level2Children.forEach(child => {
      if (processed.has(child.id)) return;

      let spouse: Membre | null = null;
      if (child.conjoint_id) {
        spouse = members.find(m => m.id === child.conjoint_id) || null;
      }

      // Aller chercher les enfants (Génération III) de cet enfant / couple
      const grandkids = members.filter(m => 
        m.pere_id === child.id || 
        m.mere_id === child.id ||
        (spouse && (m.pere_id === spouse.id || m.mere_id === spouse.id))
      );

      list.push({ child, spouse, grandkids });
      processed.add(child.id);
      if (spouse) {
        processed.add(spouse.id);
      }
    });

    return list;
  }, [level2Children, members]);

  // Fonction pour résoudre le libellé de rôle exact
  const getRoleLabel = (member: Membre, level: 1 | 2 | 3, isSpouse: boolean): string => {
    if (level === 1) {
      if (member.sexe === "M") return "PÈRE";
      if (member.sexe === "F") return "MÈRE";
      return "PARENT";
    }

    if (level === 2) {
      if (isSpouse) {
        return member.sexe === "M" ? "BEAU-FILS" : "BELLE-FILLE";
      } else {
        return member.sexe === "M" ? "FILS" : "FILLE";
      }
    }

    // Niveau 3 (Petits-enfants)
    if (member.sexe === "M") return "PETIT-FILS";
    if (member.sexe === "F") return "PETITE-FILLE";
    return "ENFANT";
  };

  // Rendu graphique d'un nœud individuel de membre de l'arbre
  const renderTreeNode = (member: Membre, roleLabel: string) => {
    const isSelected = selectedMember?.id === member.id;
    return (
      <div 
        key={member.id} 
        id={`node-${member.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMember(member);
        }}
        className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:scale-105"
      >
        {/* Bulle d'édition rapide au survol si administrateur */}
        {isAdmin && (
          <button
            id={`quick-edit-${member.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditMember(member);
            }}
            className="absolute -top-1 right-2 p-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-600/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-30"
            title="Modifier ce membre"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Cadre de photo rond avec liseré ultra propre */}
        <div className="relative">
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 transition-all duration-300 ${
            isSelected 
              ? "border-amber-600 ring-4 ring-amber-100 scale-102" 
              : "border-stone-300 group-hover:border-stone-500 shadow-sm"
          }`}>
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.prenom}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${member.prenom}%20${member.nom}&backgroundColor=f3f4f6`;
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-serif font-extrabold text-xl md:text-2xl ${
                member.sexe === "M" ? "bg-[#E3ECF5] text-blue-800" : member.sexe === "F" ? "bg-[#F9EFF3] text-pink-800" : "bg-[#EDF6EF] text-emerald-800"
              }`}>
                {member.prenom.charAt(0)}
              </div>
            )}
          </div>
          {/* Badge discret de genre */}
          <span className={`absolute bottom-0 right-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full text-white shadow ${
            member.sexe === "M" ? "bg-blue-600" : member.sexe === "F" ? "bg-pink-600" : "bg-emerald-600"
          }`}>
            {member.sexe}
          </span>
        </div>

        {/* Nom de famille en premier en caractère robuste et élégant */}
        {member.nom && (
          <span className="font-sans text-[11px] font-extrabold tracking-widest text-stone-850 uppercase mt-2.5 text-center max-w-[130px] leading-tight break-words">
            {member.nom}
          </span>
        )}

        {/* Prénom calligraphique de toute beauté en dessous */}
        <span className="font-cursive text-[28px] text-amber-900/80 mt-0.5 tracking-wide font-normal text-center max-w-[140px] leading-tight break-words">
          {member.prenom}
        </span>

        {/* Rôle capitalisé */}
        <span className="text-[8px] uppercase tracking-widest text-[#928873] font-extrabold mt-1 text-center px-2">
          {roleLabel}
        </span>
      </div>
    );
  };

  // Liste des branches parentales disponibles
  const allReferenceOptions = useMemo(() => {
    return rootCouples.map(rc => ({
      id: rc.husband.id,
      label: `${rc.husband.prenom} & ${rc.wife.prenom} (${rc.husband.nom})`
    }));
  }, [rootCouples]);

  return (
    <div className="relative w-full overflow-x-auto bg-[#FAF7F2] rounded-3xl p-6 md:p-12 border-2 border-[#E9E4DB] shadow-md select-none">
      
      {/* 1. Cadres d'angle élégants & illustrations florales en SVGs ultra haute fidélité */}
      <div className="absolute top-5 left-5 pointer-events-none text-[#7C6E59] opacity-92 hidden md:block">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5,5 L40,5 M5,5 L5,40" stroke="currentColor" strokeWidth="1.2" />
          {/* Branche de houblon / blé décoratif */}
          <path d="M12,12 C18,12 18,30 25,35" stroke="currentColor" strokeWidth="0.8" />
          <path d="M15,10 C18,8 20,12 15,14 Z" fill="currentColor" opacity="0.6" />
          <path d="M10,15 C8,18 12,20 14,15 Z" fill="currentColor" opacity="0.6" />
          <circle cx="15" cy="15" r="2" fill="currentColor" />
          <circle cx="22" cy="18" r="1.5" fill="currentColor" />
          <path d="M8,8 C12,8 8,24 24,24" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
      </div>

      <div className="absolute top-5 right-5 pointer-events-none text-[#7C6E59] opacity-92 hidden md:block">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M95,5 L60,5 M95,5 L95,40" stroke="currentColor" strokeWidth="1.2" />
          {/* Motif floral symétrique */}
          <path d="M88,12 C82,12 82,30 75,35" stroke="currentColor" strokeWidth="0.8" />
          <path d="M85,10 C82,8 80,12 85,14 Z" fill="currentColor" opacity="0.6" />
          <path d="M90,15 C92,18 88,20 86,15 Z" fill="currentColor" opacity="0.6" />
          <circle cx="85" cy="15" r="2" fill="currentColor" />
          <circle cx="78" cy="18" r="1.5" fill="currentColor" />
          <path d="M92,8 C88,8 92,24 76,24" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
      </div>

      <div className="absolute bottom-5 left-5 pointer-events-none text-[#7C6E59] opacity-70 hidden md:block">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5,45 L20,45 M5,45 L5,30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="absolute bottom-5 right-5 pointer-events-none text-[#7C6E59] opacity-70 hidden md:block">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M45,45 L30,45 M45,45 L45,30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* 2. Menu déroulant élégant pour changer d'arbre si multiple lignées */}
      {allReferenceOptions.length > 1 && (
        <div className="absolute top-4 left-4 z-20">
          <div className="relative group">
            <select
              id="branch-selector"
              value={overrideRootId || ""}
              onChange={(e) => setOverrideRootId(e.target.value || null)}
              className="appearance-none bg-white/70 backdrop-blur-xs border border-[#DFD9CE] hover:bg-white hover:border-[#C4BAA7] text-stone-750 font-sans text-xs font-semibold py-1.5 pl-3 pr-8 rounded-full shadow-xs cursor-pointer focus:outline-none transition-all duration-200"
            >
              <option value="">-- Lignée Automatique --</option>
              {allReferenceOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  Branche {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* 3. Zone d'En-Tête Calligraphique (DIGITAL FAMILY TREE) */}
      <div className="flex flex-col items-center justify-center text-center mt-3 md:mt-0 mb-12">
        <span className="text-[10px] md:text-xs font-sans font-bold tracking-[0.25em] text-[#A59984] uppercase">
          ARBRE GÉNÉALOGIQUE DE
        </span>
        <h2 className="font-cursive text-5xl md:text-6xl text-[#6B5A43] mt-2 mb-1 drop-shadow-neutral">
          {activeRoot?.father && activeRoot?.mother ? (
            <>
              {activeRoot.father.prenom} et {activeRoot.mother.prenom}
            </>
          ) : activeRoot?.single ? (
            <>{activeRoot.single.prenom}</>
          ) : (
            "Membres de la Famille"
          )}
        </h2>
        {/* Ligne pointillée décorative d'époque */}
        <div className="w-48 h-px border-b border-dashed border-[#C4BAA7] mt-3" />
      </div>

      {/* Si aucun membre, avertissement sympathique */}
      {members.length === 0 ? (
        <div className="py-16 text-center text-stone-600 italic">
          Ajoutez des membres de famille avec des liens "pere_id" ou "mere_id" pour dessiner l'arbre automatiquement.
        </div>
      ) : (
        /* 4. LE GRAPH DE L'ARBRE GÊNÉALOGIQUE (Moteur Flexbox structuré) */
        <div className="min-w-[980px] flex flex-col items-center relative py-6">
          
          {/* ================= NIVEAU 1 : LES GRANDS-PARENTS ================= */}
          {activeRoot && (
            <div className="flex flex-col items-center relative">
              {activeRoot.father && activeRoot.mother ? (
                // Couple racine relié
                <div className="flex items-center gap-14 relative z-10 pb-12">
                  
                  {/* Père */}
                  {renderTreeNode(activeRoot.father, getRoleLabel(activeRoot.father, 1, false))}
                  
                  {/* Ligne d'union avec mini coeur au centre */}
                  <div className="absolute left-[50%] top-[40px] md:top-[48px] w-14 h-0.5 bg-stone-300 translate-x-[-50%] flex items-center justify-center">
                    <span className="px-1 bg-[#FAF7F2] text-rose-500 text-sm">❤</span>
                  </div>

                  {/* Mère */}
                  {renderTreeNode(activeRoot.mother, getRoleLabel(activeRoot.mother, 1, false))}

                  {/* Ligne de connexion descendante centrale depuis l'union */}
                  {level2CouplesAndSingles.length > 0 && (
                    <div className="absolute left-[50%] bottom-0 w-0.5 h-12 bg-stone-300 translate-x-[-50%]" />
                  )}
                </div>
              ) : activeRoot.single ? (
                // Personne racine célibataire
                <div className="flex flex-col items-center relative z-10 pb-12">
                  {renderTreeNode(activeRoot.single, getRoleLabel(activeRoot.single, 1, false))}
                  {level2CouplesAndSingles.length > 0 && (
                    <div className="absolute left-[50%] bottom-0 w-0.5 h-12 bg-stone-300 translate-x-[-50%]" />
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ================= NIVEAU 2 : LES ENFANTS & CONJOINTS ================= */}
          {level2CouplesAndSingles.length > 0 && (
            <div className="w-full relative flex flex-col items-center">
              
              {/* Ligne horizontale distributive (Spread Bar) pour Generation 2 */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-stone-300" style={{
                left: level2CouplesAndSingles.length > 1 ? `${100 / (level2CouplesAndSingles.length * 2)}%` : "50%",
                right: level2CouplesAndSingles.length > 1 ? `${100 / (level2CouplesAndSingles.length * 2)}%` : "50%"
              }} />

              {/* Rendu colonnes */}
              <div className="grid w-full mt-0" style={{
                gridTemplateColumns: `repeat(${level2CouplesAndSingles.length}, minmax(0, 1fr))`
              }}>
                {level2CouplesAndSingles.map((group, childIdx) => {
                  const m1 = group.child;
                  const m2 = group.spouse;

                  return (
                    <div key={`g2-${m1.id}`} className="flex flex-col items-center relative pt-8">
                      {/* Petit pont vertical allant de la barre distributive horizontale au couple */}
                      <div className="absolute top-0 left-50% w-0.5 h-8 bg-stone-300 translate-x-[-50%]" />

                      {/* Noeuds du couple Génération II */}
                      {m2 ? (
                        <div className="flex items-center gap-10 relative z-10 pb-10">
                          {/* Le Fils / Fille légitime de la lignée */}
                          {renderTreeNode(m1, getRoleLabel(m1, 2, false))}

                          {/* Petit coeur d'union Génération II */}
                          <div className="absolute left-[50%] top-[40px] md:top-[48px] w-10 h-0.5 bg-stone-300 translate-x-[-50%] flex items-center justify-center">
                            <span className="px-1 bg-[#FAF7F2] text-rose-500 text-[10px]">❤</span>
                          </div>

                          {/* Le Beau-fils / Belle-fille (Spouse) */}
                          {renderTreeNode(m2, getRoleLabel(m2, 2, true))}

                          {/* Ligne descendante de ce couple vers les petits-enfants */}
                          {group.grandkids.length > 0 && (
                            <div className="absolute left-[50%] bottom-0 w-0.5 h-10 bg-stone-300 translate-x-[-50%]" />
                          )}
                        </div>
                      ) : (
                        // Enfant célibataire de niveau II
                        <div className="flex flex-col items-center relative z-10 pb-10">
                          {renderTreeNode(m1, getRoleLabel(m1, 2, false))}
                          {group.grandkids.length > 0 && (
                            <div className="absolute left-[50%] bottom-0 w-0.5 h-10 bg-stone-300 translate-x-[-50%]" />
                          )}
                        </div>
                      )}

                      {/* ================= NIVEAU 3 : LES PETITS-ENFANTS ================= */}
                      {group.grandkids.length > 0 && (
                        <div className="w-full relative flex flex-col items-center pt-8">
                          
                          {/* Barre distributive de niveau 3 */}
                          {group.grandkids.length > 1 && (
                            <div className="absolute top-0 h-0.5 bg-stone-300" style={{
                              left: `${100 / (group.grandkids.length * 2)}%`,
                              right: `${100 / (group.grandkids.length * 2)}%`
                            }} />
                          )}

                          {/* Liste horizontale des petits-enfants */}
                          <div className="flex justify-around w-full gap-4 mt-0">
                            {group.grandkids.map((grandkid) => (
                              <div key={`g3-${grandkid.id}`} className="relative flex flex-col items-center">
                                {/* Ligne verticale vers le nœud petit-enfant */}
                                <div className="absolute top-[-32px] left-50% w-0.5 h-8 bg-stone-300 translate-x-[-50%]" />
                                {renderTreeNode(grandkid, getRoleLabel(grandkid, 3, false))}
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
