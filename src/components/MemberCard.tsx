/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Membre } from "../types";
import { User, Heart, Calendar, MapPin, Edit } from "lucide-react";

interface MemberCardProps {
  member: Membre;
  allMembers: Membre[];
  onSelect: (member: Membre) => void;
  onEdit: (member: Membre) => void;
  isSelected?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  allMembers,
  onSelect,
  onEdit,
  isSelected = false
}) => {
  const conjoint = allMembers.find(m => m.id === member.conjoint_id);

  // Formatter la date
  const formatBirthInfo = (dateStr: string, placeStr?: string) => {
    if (!dateStr && !placeStr) return "Informations inconnues";
    let formattedDate = "";
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        formattedDate = d.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      } catch (e) {
        formattedDate = dateStr;
      }
    }
    return (
      <span className="flex items-center gap-1.5 flex-wrap">
        {formattedDate && (
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {formattedDate}
          </span>
        )}
        {placeStr && (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            à {placeStr}
          </span>
        )}
      </span>
    );
  };

  // Couleur thématique d'après le sexe
  const getGenderStyle = (sexe: string) => {
    switch (sexe) {
      case "M":
        return {
          border: "border-l-4 border-l-blue-500",
          bg: "bg-blue-50/50 hover:bg-blue-50",
          badge: "bg-blue-100 text-blue-800",
          avatarBg: "bg-blue-100 text-blue-600"
        };
      case "F":
        return {
          border: "border-l-4 border-l-pink-500",
          bg: "bg-pink-50/50 hover:bg-pink-50",
          badge: "bg-pink-100 text-pink-800",
          avatarBg: "bg-pink-100 text-pink-600"
        };
      default:
        return {
          border: "border-l-4 border-l-emerald-500",
          bg: "bg-emerald-50/50 hover:bg-emerald-50",
          badge: "bg-emerald-100 text-emerald-800",
          avatarBg: "bg-emerald-100 text-emerald-600"
        };
    }
  };

  const style = getGenderStyle(member.sexe);

  return (
    <div
      id={`member-${member.id}`}
      className={`relative flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-white transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
        style.border
      } ${isSelected ? "ring-2 ring-indigo-500/80 shadow-md bg-slate-50/50" : ""}`}
      onClick={() => onSelect(member)}
    >
      <div className="flex gap-4 items-start">
        {/* Photo de profil ou icône alternative */}
        <div className="relative shrink-0">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={`${member.prenom} ${member.nom}`}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // En cas de problème de chargement locale, repli
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${member.prenom}%20${member.nom}`;
              }}
            />
          ) : (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm ${style.avatarBg}`}>
              {member.prenom.charAt(0)}{member.nom.charAt(0)}
            </div>
          )}
          <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${style.badge}`}>
            {member.sexe}
          </span>
        </div>

        {/* Détails d'identité */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 truncate">
              {member.nom && <span className="uppercase text-slate-700 font-bold mr-1">{member.nom}</span>}
              {member.prenom}
            </h3>
            <button
              id={`edit-btn-${member.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(member);
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Modifier la fiche"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs mt-1 space-y-1">
            {formatBirthInfo(member.date_naissance, member.lieu_naissance)}
          </div>

          {conjoint && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-rose-600 font-medium bg-rose-50/70 py-1 px-2 rounded-md border border-rose-100 w-fit max-w-full truncate">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
              <span className="truncate">Époux : {conjoint.prenom} {conjoint.nom}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
