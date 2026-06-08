/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { Membre } from "./src/types.js";

// S'assurer que les répertoires nécessaires existent au démarrage
const dataDir = path.join(process.cwd(), "data");
const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Chemin du fichier de stockage des membres
const dbPath = path.join(dataDir, "membres.json");

// Données de graine (seed) par défaut si le fichier n'existe pas
const seedData: Membre[] = [
  {
    "id": "1",
    "prenom": "Paul",
    "nom": "RAZANAKOLONA",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "conjoint_id": "2",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "2",
    "prenom": "Norovololona",
    "nom": "RAJAOBELINA",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "conjoint_id": "1",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "3",
    "prenom": "Noroniaina",
    "nom": "ANDRIAMASITERA",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "pere_id": "1",
    "mere_id": "2",
    "conjoint_id": "4",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "4",
    "prenom": "Chemir",
    "nom": "JEAN MENSORALY",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "conjoint_id": "3",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "5",
    "prenom": "Lamyah",
    "nom": "RAZANAKOLONA JEAN MENSORALY",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "pere_id": "4",
    "mere_id": "3",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "6",
    "prenom": "Mael",
    "nom": "RAZANAKOLONA JEAN MENSORALY",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "pere_id": "4",
    "mere_id": "3",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "7",
    "prenom": "Shayan",
    "nom": "RAZANAKOLONA JEAN MENSORALY",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "pere_id": "4",
    "mere_id": "3",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "8",
    "prenom": "Narindraniaina",
    "nom": "ANDRIAMASITERA",
    "sexe": "F",
    "photo_url": "/uploads/1780918882852-892904652-IMG_20241027_WA0026.jpg",
    "pere_id": "1",
    "mere_id": "2",
    "conjoint_id": "9",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "9",
    "prenom": "Maholiarisoa Heriniaina",
    "nom": "JEAMIS",
    "sexe": "M",
    "photo_url": "/uploads/1780918854046-401181830-me.jpg",
    "conjoint_id": "8",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "10",
    "prenom": "Aroniaina Mathyas",
    "nom": "JEAMIS-RAZANAKOLONA",
    "sexe": "M",
    "photo_url": "/uploads/1780918915741-548023208-Mathyas.png",
    "pere_id": "9",
    "mere_id": "8",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "11",
    "prenom": "Ariniaina Warren",
    "nom": "JEAMIS-RAZANAKOLONA",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "pere_id": "9",
    "mere_id": "8",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "12",
    "prenom": "Andoniaina",
    "nom": "ANDRIAMASITERA",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "pere_id": "1",
    "mere_id": "2",
    "conjoint_id": "13",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "13",
    "prenom": "Maherizo",
    "nom": "ANDRIANJATOVO",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "conjoint_id": "12",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "14",
    "prenom": "Nayah",
    "nom": "",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "pere_id": "13",
    "mere_id": "12",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "15",
    "prenom": "Andriniaina",
    "nom": "RAZANAKOLONA ANDRIAMASITERA",
    "sexe": "F",
    "photo_url": "/uploads/default-f.jpg",
    "pere_id": "1",
    "mere_id": "2",
    "conjoint_id": "16",
    "date_naissance": "",
    "lieu_naissance": ""
  },
  {
    "id": "16",
    "prenom": "Adyl",
    "nom": "LERY",
    "sexe": "M",
    "photo_url": "/uploads/default-m.jpg",
    "conjoint_id": "15",
    "date_naissance": "",
    "lieu_naissance": ""
  }
];

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2), "utf-8");
}

function lireMembres(): Membre[] {
  try {
    if (!fs.existsSync(dbPath)) return [];
    const contenu = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(contenu);
  } catch (err) {
    console.error("Erreur lors de la lecture du fichier membres.json:", err);
    return [];
  }
}

function ecrireMembres(membres: Membre[]): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(membres, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur lors de l'écriture du fichier membres.json:", err);
  }
}

// Config de Multer pour le stockage local des photos de profil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const cleanOrigName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanOrigName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5Mo
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Format de fichier non supporté (uniquement jpeg, jpg, png, gif, webp)."));
  }
});

async function demarrerServeur() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir statiquement les photos téléchargées
  app.use("/uploads", express.static(uploadsDir));

  // --- ROUTES API ---

  // 0. POST /api/login : Authentification de l'administrateur
  app.post("/api/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === "admin" && password === "admin") {
        return res.json({ success: true, token: "mock-admin-token" });
      }
      return res.status(401).json({ success: false, message: "Identifiants invalides." });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur lors de la connexion.", error: error.message });
    }
  });

  // Middleware pour valider l'authentification admin sur les modifications
  const verifierAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== "Bearer mock-admin-token") {
      return res.status(403).json({ message: "Accès refusé. Veuillez vous connecter en tant qu'administrateur." });
    }
    next();
  };

  // 1. GET /api/membres : Récupère la liste complète des membres
  app.get("/api/membres", (req, res) => {
    try {
      const membres = lireMembres();
      res.json(membres);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur lors de la récupération des membres.", error: error.message });
    }
  });

  // 2. POST /api/membres : Ajoute un membre avec gestion de photo via Multer (SÉCURISÉ)
  app.post("/api/membres", verifierAdmin, upload.single("photo"), (req, res) => {
    try {
      const membres = lireMembres();
      const body = req.body;

      // Validation minimale
      if (!body.prenom || !body.nom || !body.sexe) {
        return res.status(400).json({ message: "Le prénom, le nom et le sexe sont obligatoires." });
      }

      // Générer un ID unique
      const nouvelId = (Math.max(...membres.map(m => parseInt(m.id) || 0), 0) + 1).toString();

      let photoPath = "";
      if (req.file) {
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          photoPath = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
          // Supprimer le fichier temporaire immédiatement pour garder le disque propre
          fs.unlinkSync(req.file.path);
        } catch (fileErr) {
          console.error("Erreur d'encodage du fichier en Base64 :", fileErr);
          photoPath = `/uploads/${req.file.filename}`;
        }
      }

      const nouveauMembre: Membre = {
        id: nouvelId,
        prenom: body.prenom,
        nom: body.nom.toUpperCase(),
        sexe: body.sexe,
        date_naissance: body.date_naissance || "",
        lieu_naissance: body.lieu_naissance || "",
        photo_url: photoPath || undefined,
        pere_id: body.pere_id || undefined,
        mere_id: body.mere_id || undefined,
        conjoint_id: body.conjoint_id || undefined,
      };

      membres.push(nouveauMembre);

      // Si un conjoint est lié à la création, mettre à jour le conjoint également
      if (body.conjoint_id) {
        const indexConjoint = membres.findIndex(m => m.id === body.conjoint_id);
        if (indexConjoint !== -1) {
          membres[indexConjoint].conjoint_id = nouvelId;
        }
      }

      ecrireMembres(membres);
      res.status(201).json(nouveauMembre);
    } catch (error: any) {
      console.error("Erreur POST /api/membres:", error);
      res.status(500).json({ message: "Erreur lors de l'ajout du membre.", error: error.message });
    }
  });

  // 3. PUT /api/membres/:id : Met à jour un membre existant avec sa photo éventuelle (SÉCURISÉ)
  app.put("/api/membres/:id", verifierAdmin, upload.single("photo"), (req, res) => {
    try {
      const id = req.params.id;
      const membres = lireMembres();
      const index = membres.findIndex(m => m.id === id);

      if (index === -1) {
        return res.status(404).json({ message: `Membre avec l'id ${id} non trouvé.` });
      }

      const body = req.body;
      const membreExistant = membres[index];

      // Mettre à jour les champs
      const prenom = body.prenom !== undefined ? body.prenom : membreExistant.prenom;
      const nom = body.nom !== undefined ? body.nom.toUpperCase() : membreExistant.nom;
      const sexe = body.sexe !== undefined ? body.sexe : membreExistant.sexe;
      const date_naissance = body.date_naissance !== undefined ? body.date_naissance : membreExistant.date_naissance;
      const lieu_naissance = body.lieu_naissance !== undefined ? body.lieu_naissance : membreExistant.lieu_naissance;
      
      let photo_url = membreExistant.photo_url;
      if (req.file) {
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          photo_url = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
          // Supprimer le fichier temporaire immédiatement pour garder le disque propre
          fs.unlinkSync(req.file.path);
        } catch (fileErr) {
          console.error("Erreur d'encodage du fichier en Base64 :", fileErr);
          photo_url = `/uploads/${req.file.filename}`;
        }
      } else if (body.photo_url === "") {
        photo_url = undefined;
      }

      const pere_id = body.pere_id !== undefined ? (body.pere_id || undefined) : membreExistant.pere_id;
      const mere_id = body.mere_id !== undefined ? (body.mere_id || undefined) : membreExistant.mere_id;
      const conjoint_id = body.conjoint_id !== undefined ? (body.conjoint_id || undefined) : membreExistant.conjoint_id;

      // Démonter l'ancien conjoint s'il change
      if (conjoint_id !== membreExistant.conjoint_id) {
        // Enlève l'ancien lien du conjoint précédent si existant
        if (membreExistant.conjoint_id) {
          const indexAncienConj = membres.findIndex(m => m.id === membreExistant.conjoint_id);
          if (indexAncienConj !== -1 && membres[indexAncienConj].conjoint_id === id) {
            membres[indexAncienConj].conjoint_id = undefined;
          }
        }
        // Ajoute le nouveau lien pour le nouveau conjoint
        if (conjoint_id) {
          const indexNouveauConj = membres.findIndex(m => m.id === conjoint_id);
          if (indexNouveauConj !== -1) {
            membres[indexNouveauConj].conjoint_id = id;
          }
        }
      }

      const membreMisAJour: Membre = {
        ...membreExistant,
        prenom,
        nom,
        sexe,
        date_naissance,
        lieu_naissance,
        photo_url,
        pere_id,
        mere_id,
        conjoint_id
      };

      membres[index] = membreMisAJour;
      ecrireMembres(membres);

      res.json(membreMisAJour);
    } catch (error: any) {
      console.error("Erreur PUT /api/membres/:id:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du membre.", error: error.message });
    }
  });

  // Intégration de Vite en middleware d'actifs (pour le développement ou la production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

demarrerServeur().catch((err) => {
  console.error("Erreur au démarrage du serveur :", err);
});
