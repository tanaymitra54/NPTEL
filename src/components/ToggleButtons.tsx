/**
 * Reusable toggle buttons component (like Mode or Grouping selection)
 */

export interface ToggleOption {
  label: string
  value: string
  description?: string
}

interface ToggleButtonsProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  description?: string
}

/**
 * Reusable toggle buttons component (like Mode or Grouping selection)
 */
export function ToggleButtons({
  options,
  value,
  onChange,
  description,
}: ToggleButtonsProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#787470]">{description}</label>
      <div className="flex bg-[#F5F3EC] p-1 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-white text-[#C28F8F] shadow-sm'
                : 'text-[#787470] hover:text-[#2C2A29]'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {options.find((o) => o.value === value)?.description && (
        <p className="text-xs text-[#787470] pl-1">
          {options.find((o) => o.value === value)?.description}
        </p>
      )}
    </div>
  )
}

interface ToggleGroupProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  description?: string
}

/**
 * Reusable toggle for grouping (Single Week / Mixed Weeks)
 */
export function ToggleGroup({
  options,
  value,
  onChange,
  description,
}: ToggleGroupProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#787470]">{description}</label>
      <div className="flex bg-[#F5F3EC] p-1 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-white text-[#2C2A29] shadow-sm'
                : 'text-[#787470] hover:text-[#2C2A29]'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
