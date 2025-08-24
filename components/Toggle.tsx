import { ToggleGroup, ToggleGroupItem, } from "@/components/ui/toggle-group"

interface ToggleGroupProps {
  type: 'single' | 'multiple'
  items: {
    value: string
    label: string
    icon?: React.ReactNode
  }[],
  size?: 'xs' | 'sm' | 'default' | 'lg'
}

export function ToggleWithBorder(props: ToggleGroupProps) {

  return (
    <div className="w-max px-1 py-[3px] border-[1px] rounded-lg" >
      <Toggle {...props} />
    </div>
  )
}

export function Toggle(props: ToggleGroupProps) {

  return (
    <div className="w-max" >
      <ToggleGroup {...props} >
        {props.items.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label}>
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
