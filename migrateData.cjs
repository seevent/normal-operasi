const fs = require('fs');
const file = 'src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Rename definitions
code = code.replace(/const DATA_API_T2 =/g, 'const DEFAULT_DATA_API_T2 =');
code = code.replace(/const DATA_OM_IAS_T2 =/g, 'const DEFAULT_DATA_OM_IAS_T2 =');
code = code.replace(/const STORING_EQUIPMENTS =/g, 'const DEFAULT_STORING_EQUIPMENTS =');
code = code.replace(/const STORING_LOC_AC =/g, 'const DEFAULT_STORING_LOC_AC =');
code = code.replace(/const STORING_LOC_DEFAULT =/g, 'const DEFAULT_STORING_LOC_DEFAULT =');
code = code.replace(/const CHECKLIST_DATA =/g, 'const DEFAULT_CHECKLIST_DATA =');
code = code.replace(/const TIP_LEFT_COL =/g, 'const DEFAULT_TIP_LEFT_COL =');
code = code.replace(/const TIP_RIGHT_COL =/g, 'const DEFAULT_TIP_RIGHT_COL =');

// 2. Replace all other usages (but skip the definitions we just renamed)
// Note: We already renamed the definitions, so any remaining usages of DATA_API_T2 can be safely replaced.
code = code.replace(/\bDATA_API_T2\b/g, 'dataApiT2');
code = code.replace(/\bDATA_OM_IAS_T2\b/g, 'dataOmIasT2');
code = code.replace(/\bSTORING_EQUIPMENTS\b/g, 'storingEquipments');
code = code.replace(/\bSTORING_LOC_AC\b/g, 'storingLocAc');
code = code.replace(/\bSTORING_LOC_DEFAULT\b/g, 'storingLocDefault');
code = code.replace(/\bCHECKLIST_DATA\b/g, 'checklistDataMaster');
code = code.replace(/\bTIP_LEFT_COL\b/g, 'tipLeftCol');
code = code.replace(/\bTIP_RIGHT_COL\b/g, 'tipRightCol');

// 3. Inject state logic at the beginning of App()
const appStart = 'export default function App() {';
const injectedState = `export default function App() {
  const loadMasterData = (key, defaultData) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading master data:', e);
    }
    return defaultData;
  };

  const saveMasterData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Master Data States
  const [dataApiT2, setDataApiT2] = useState(() => loadMasterData('master_api_t2', DEFAULT_DATA_API_T2));
  const [dataOmIasT2, setDataOmIasT2] = useState(() => loadMasterData('master_om_ias_t2', DEFAULT_DATA_OM_IAS_T2));
  const [storingEquipments, setStoringEquipments] = useState(() => loadMasterData('master_storing_equip', DEFAULT_STORING_EQUIPMENTS));
  const [storingLocAc, setStoringLocAc] = useState(() => loadMasterData('master_storing_loc_ac', DEFAULT_STORING_LOC_AC));
  const [storingLocDefault, setStoringLocDefault] = useState(() => loadMasterData('master_storing_loc_default', DEFAULT_STORING_LOC_DEFAULT));
  const [checklistDataMaster, setChecklistDataMaster] = useState(() => loadMasterData('master_checklist', DEFAULT_CHECKLIST_DATA));
  const [tipLeftCol, setTipLeftCol] = useState(() => loadMasterData('master_tip_left', DEFAULT_TIP_LEFT_COL));
  const [tipRightCol, setTipRightCol] = useState(() => loadMasterData('master_tip_right', DEFAULT_TIP_RIGHT_COL));
`;
code = code.replace(appStart, injectedState);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated App.tsx with dynamic master data infrastructure.');
