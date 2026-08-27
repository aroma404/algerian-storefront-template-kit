import { useEffect, useState } from "react";
import { Storefront } from "./Storefront";
import { coreRegistry, type OwnedTemplateContract } from "../core/registry";
import "./styles/theme.generated.css";
import "./styles/storefront.css";
export default function App() {
  const [contract, setContract] = useState<OwnedTemplateContract>();
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; void coreRegistry.templates.load(coreRegistry.store.templateId).then(value => { if (active) setContract(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  if (failed) return <main className="store-load-state"><h1>Template unavailable</h1><p>Check the template id in <code>client/src/store/template.ts</code>.</p></main>;
  if (!contract) return <main className="store-load-state" aria-live="polite"><p>Loading storefront…</p></main>;
  return <Storefront contract={contract} />;
}
