import { inputClass } from "@/components/ui";

export function TextInput({ label, id, value, onChange }: { label: string; id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}

export function TextArea({ label, id, value, onChange, rows = 3 }: { label: string; id: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}
