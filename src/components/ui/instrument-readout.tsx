import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InstrumentReadoutProps = HTMLAttributes<HTMLSpanElement>;

// Numeric/data readout styling. `.font-instrument` (IBM Plex Mono) already
// enables tabular figures via font-feature-settings; `tabular-nums` is kept
// as an explicit, harmless reinforcement.
export const InstrumentReadout = forwardRef<HTMLSpanElement, InstrumentReadoutProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('font-instrument tabular-nums', className)} {...props} />
  )
);

InstrumentReadout.displayName = 'InstrumentReadout';
