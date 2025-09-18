import { Badge } from '@/components/ui/badge'
import { getStatusColor, getStatusText } from '@/lib/utils'
import { type RequestStatus } from '@/types'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${getStatusColor(status)} ${className || ''}`}
    >
      {getStatusText(status)}
    </Badge>
  )
}
