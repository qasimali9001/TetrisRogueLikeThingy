import type { PieceType } from "../../config/gameConfig";

export interface Point {
  x: number;
  y: number;
}

export interface PieceDefinition {
  type: PieceType;
  spawnRotation: number;
  spawnOffsetY: number;
  rotations: Point[][];
}

const I_ROTATIONS: Point[][] = [
  [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ],
  [
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 }
  ],
  [
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  [
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 }
  ]
];

const O_ROTATIONS: Point[][] = [
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ]
];

const T_ROTATIONS: Point[][] = [
  [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 }
  ],
  [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 }
  ],
  [
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ],
  [
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 }
  ]
];

const JLSTZ_ROTATIONS = {
  J: [
    [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 }
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 1 }
    ]
  ],
  L: [
    [
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 }
    ],
    [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    ]
  ],
  S: [
    [
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 }
    ],
    [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 }
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 }
    ]
  ],
  Z: [
    [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ],
    [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: -1, y: 1 }
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ]
  ]
};

export const pieceDefinitions: Record<PieceType, PieceDefinition> = {
  I: { type: "I", spawnRotation: 0, spawnOffsetY: 0, rotations: I_ROTATIONS },
  O: { type: "O", spawnRotation: 0, spawnOffsetY: 0, rotations: O_ROTATIONS },
  T: { type: "T", spawnRotation: 0, spawnOffsetY: 0, rotations: T_ROTATIONS },
  J: { type: "J", spawnRotation: 0, spawnOffsetY: 0, rotations: JLSTZ_ROTATIONS.J },
  L: { type: "L", spawnRotation: 0, spawnOffsetY: 0, rotations: JLSTZ_ROTATIONS.L },
  S: { type: "S", spawnRotation: 0, spawnOffsetY: 0, rotations: JLSTZ_ROTATIONS.S },
  Z: { type: "Z", spawnRotation: 0, spawnOffsetY: 0, rotations: JLSTZ_ROTATIONS.Z }
};
