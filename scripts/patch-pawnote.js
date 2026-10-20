const fs = require('fs');
const path = require('path');

function patchFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [target, replacement] of replacements) {
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-pawnote] Patched ${path.basename(filePath)} successfully.`);
  } else {
    console.log(`[patch-pawnote] ${path.basename(filePath)} already up-to-date or target not found.`);
  }
}

// 1. Patch dist/index.mjs
patchFile(path.join(__dirname, '../node_modules/pawnote/dist/index.mjs'), [
  [
    'V={STUDENT:6,PARENT:7,TEACHER:8}',
    'V={STUDENT:6,PARENT:7,TEACHER:8,VIE_SCOLAIRE:14}'
  ],
  [
    'case"professeur":return V.TEACHER;default:throw new E("decodeAccountKindFromPath")',
    'case"professeur":return V.TEACHER;case"viescolaire":return V.VIE_SCOLAIRE;default:throw new E("decodeAccountKindFromPath")'
  ],
  [
    'case V.TEACHER:s="professeur"}return`mobile.${s}.html`',
    'case V.TEACHER:s="professeur";break;case V.VIE_SCOLAIRE:s="viescolaire"}return`mobile.${s}.html`'
  ],
  [
    'case V.STUDENT:case V.TEACHER:t=[e.ressource];break;case V.PARENT:t=e.ressource.listeRessources',
    'case V.STUDENT:case V.TEACHER:case V.VIE_SCOLAIRE:t=e.ressource?[e.ressource]:[];break;case V.PARENT:t=e.ressource?.listeRessources||[]'
  ],
  [
    'const e=o.replace(/ /gu,"").replace(/\\n/gu,""),s="Start(",t=")}catch",i=e.substring(e.indexOf(s)+s.length,e.indexOf(t)).replace(/(CustomPassword|ChoixStrategie|PersonnalisationMotDePasse|ChoixCodePINetSource|SaisieCodePINetSource|ReinitCodePINetSource|SaisieSourcePourNotifSeulement)/gu,"").replace(/(CustomPassword|ChoixStrategie)/gu,"")',
    'const e=o'
  ],
  [
    'const e=o.replace(/ /gu,"").replace(/\\n/gu,""),s="Start(",t=")}catch",i=e.substring(e.indexOf(s)+s.length,e.indexOf(t)).replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');',
    'const m=o.match(/Start\\s*\\(([^)]+)\\)/);if(!m)throw new w;const i=m[1].replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');'
  ]
]);

// 2. Patch dist/index.js
patchFile(path.join(__dirname, '../node_modules/pawnote/dist/index.js'), [
  [
    'M={STUDENT:6,PARENT:7,TEACHER:8}',
    'M={STUDENT:6,PARENT:7,TEACHER:8,VIE_SCOLAIRE:14}'
  ],
  [
    'case"professeur":return M.TEACHER;default:throw new v("decodeAccountKindFromPath")',
    'case"professeur":return M.TEACHER;case"viescolaire":return M.VIE_SCOLAIRE;default:throw new v("decodeAccountKindFromPath")'
  ],
  [
    'case M.TEACHER:s="professeur"}return`mobile.${s}.html`',
    'case M.TEACHER:s="professeur";break;case M.VIE_SCOLAIRE:s="viescolaire"}return`mobile.${s}.html`'
  ],
  [
    'case M.STUDENT:case M.TEACHER:t=[e.ressource];break;case M.PARENT:t=e.ressource.listeRessources',
    'case M.STUDENT:case M.TEACHER:case M.VIE_SCOLAIRE:t=e.ressource?[e.ressource]:[];break;case M.PARENT:t=e.ressource?.listeRessources||[]'
  ],
  [
    'const e=a.replace(/ /gu,"").replace(/\\n/gu,""),t="Start(",n=")}catch",i=e.substring(e.indexOf(t)+t.length,e.indexOf(n)).replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');',
    'const m=a.match(/Start\\s*\\(([^)]+)\\)/);if(!m)throw new b;const i=m[1].replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');'
  ]
]);

// 3. Patch types .d.ts and .d.mts
const dtsReplacements = [
  [
    'readonly TEACHER: 8;',
    'readonly TEACHER: 8;\n    readonly VIE_SCOLAIRE: 14;'
  ]
];
patchFile(path.join(__dirname, '../node_modules/pawnote/dist/index.d.ts'), dtsReplacements);
patchFile(path.join(__dirname, '../node_modules/pawnote/dist/index.d.mts'), dtsReplacements);
