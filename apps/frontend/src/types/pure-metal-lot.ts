export enum PureMetalLotStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  PARTIALLY_USED = 'PARTIALLY_USED',
}

export enum TipoMetal {
  AU = 'AU',
  AG = 'AG',
  RH = 'RH',
}

export interface PureMetalLot {
  id: string;
  lotNumber?: string | null; // Adicionado
  organizationId: string;
  sourceType: string;
  sourceId?: string;
  metalType: TipoMetal;
  initialGrams: number;
  remainingGrams: number;
  purity: number;
  status: PureMetalLotStatus;
  entryDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  saleId?: string;
  sale?: {
    id: string;
    orderNumber: number;
    totalAmount: number;
    pessoa: {
      name: string;
    };
  };
  recoveryOrder?: {
    orderNumber: string;
  };
  chemical_reactions?: { reactionNumber: string; notes?: string; }[]; // Adicionado
  originDetails?: { name?: string; orderNumber?: string; }; // Adicionado
}

export enum PureMetalLotMovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface PureMetalLotMovement {
  id: string;
  pureMetalLotId: string;
  type: PureMetalLotMovementType;
  grams: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}