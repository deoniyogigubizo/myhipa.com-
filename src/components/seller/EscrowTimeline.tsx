type EscrowState = 'created' | 'paid' | 'held' | 'shipped' | 'delivered' | 'released' | 'disputed' | 'refunded';

interface EscrowTimelineProps {
  currentState: EscrowState;
  events?: Array<{
    state: EscrowState;
    timestamp: string;
    description: string;
  }>;
}

const stateOrder: EscrowState[] = ['created', 'paid', 'held', 'shipped', 'delivered', 'released'];
const disputedStates: EscrowState[] = ['disputed', 'refunded'];

const stateLabels: Record<EscrowState, string> = {
  created: 'Order Created',
  paid: 'Payment Received',
  held: 'Funds in Escrow',
  shipped: 'Shipped',
  delivered: 'Delivered',
  released: 'Funds Released',
  disputed: 'Disputed',
  refunded: 'Refunded',
};

export default function EscrowTimeline({ currentState, events = [] }: EscrowTimelineProps) {
  const isDisputed = disputedStates.includes(currentState);
  const currentIndex = stateOrder.indexOf(currentState as EscrowState);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Escrow Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline Events */}
        <div className="space-y-6">
          {isDisputed ? (
            <div className="relative pl-10">
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-red-500" />
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="font-medium text-red-700">{stateLabels[currentState as EscrowState]}</p>
                <p className="text-sm text-red-600 mt-1">
                  {currentState === 'disputed' 
                    ? 'This transaction is under dispute review'
                    : 'Funds have been refunded to the buyer'
                  }
                </p>
              </div>
            </div>
          ) : (
            stateOrder.map((state, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const event = events.find(e => e.state === state);

              return (
                <div key={state} className="relative pl-10">
                  <div 
                    className={`
                      absolute left-2.5 w-3 h-3 rounded-full
                      ${isCompleted ? 'bg-hipa-primary' : 'bg-gray-200'}
                      ${isCurrent ? 'ring-4 ring-hipa-primary/20' : ''}
                    `}
                  />
                  <div className={`
                    p-3 rounded-lg border
                    ${isCompleted ? 'bg-hipa-primary/5 border-hipa-primary/20' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <p className={`
                      font-medium
                      ${isCompleted ? 'text-hipa-primary' : 'text-gray-500'}
                    `}>
                      {stateLabels[state]}
                    </p>
                    {event && (
                      <p className="text-sm text-gray-500 mt-1">
                        {event.description} • {event.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
