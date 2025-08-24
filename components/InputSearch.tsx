import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface InputSearchProps extends React.ComponentPropsWithoutRef<typeof Input> {

}


export function InputSearch(props: InputSearchProps) {

  const className = props?.className ? props.className + ' pl-8' : 'pl-8'

  return (
    <div className="flex items-center gap-2 relative">
      <Input type='search' style={{ paddingLeft: '2rem' }} {...props} />
      <Search className="h-4 w-4 shrink-0 opacity-50 absolute left-2" />
    </div>
  )
}