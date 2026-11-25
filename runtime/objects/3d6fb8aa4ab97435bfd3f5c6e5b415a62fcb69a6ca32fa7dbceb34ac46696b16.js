// Candidate from arcane-academy-balance-tested.json (source hashes matched). Fixed encounter values; no adaptive weakening.
export const ENEMY_BASE_STATS = {
  "Forest Scout": {
    "hp": 900,
    "damage": 85,
    "defense": 65,
    "speed": 100,
    "crit": 8
  },
  "Briar Guard": {
    "hp": 1500,
    "damage": 130,
    "defense": 145,
    "speed": 80,
    "crit": 5
  },
  "Lantern Moth": {
    "hp": 650,
    "damage": 110,
    "defense": 50,
    "speed": 110,
    "crit": 10
  },
  "Rime Scout": {
    "hp": 740,
    "damage": 105,
    "defense": 60,
    "speed": 108,
    "crit": 9
  },
  "Ember Moth": {
    "hp": 700,
    "damage": 125,
    "defense": 48,
    "speed": 85,
    "crit": 10
  },
  "Gatewood Warden": {
    "hp": 1600,
    "damage": 125,
    "defense": 135,
    "speed": 76,
    "crit": 5
  },
  "Rune Sprite": {
    "hp": 700,
    "damage": 100,
    "defense": 55,
    "speed": 96,
    "crit": 10
  },
  "Grove Wisp": {
    "hp": 650,
    "damage": 115,
    "defense": 45,
    "speed": 103,
    "crit": 12
  },
  "Prism Archer": {
    "hp": 780,
    "damage": 125,
    "defense": 65,
    "speed": 112,
    "crit": 18
  },
  "Prismheart Dryad": {
    "hp": 1650,
    "damage": 120,
    "defense": 130,
    "speed": 77,
    "crit": 6
  },
  "Forest Wolf": {
    "hp": 850,
    "damage": 125,
    "defense": 65,
    "speed": 122,
    "crit": 14
  },
  "Moonfang Hunter": {
    "hp": 900,
    "damage": 135,
    "defense": 70,
    "speed": 109,
    "crit": 16
  },
  "Den Keeper": {
    "hp": 1550,
    "damage": 120,
    "defense": 150,
    "speed": 82,
    "crit": 5
  },
  "Denmother Varkai": {
    "hp": 1800,
    "damage": 135,
    "defense": 145,
    "speed": 78,
    "crit": 7
  },
  "Root Warden": {
    "hp": 1600,
    "damage": 115,
    "defense": 155,
    "speed": 83,
    "crit": 5
  },
  "Buried Seer": {
    "hp": 850,
    "damage": 120,
    "defense": 65,
    "speed": 89,
    "crit": 9
  },
  "Thornbound Mage": {
    "hp": 800,
    "damage": 145,
    "defense": 55,
    "speed": 101,
    "crit": 12
  },
  "Root-Crown Colossus": {
    "hp": 1950,
    "damage": 140,
    "defense": 165,
    "speed": 74,
    "crit": 5
  },
  "Violet Stalker": {
    "hp": 850,
    "damage": 155,
    "defense": 65,
    "speed": 119,
    "crit": 18
  },
  "Cursehorn Beast": {
    "hp": 1650,
    "damage": 130,
    "defense": 150,
    "speed": 80,
    "crit": 5
  },
  "Umbral Keeper": {
    "hp": 900,
    "damage": 145,
    "defense": 70,
    "speed": 93,
    "crit": 12
  },
  "Hollow Antler": {
    "hp": 1400,
    "damage": 170,
    "defense": 95,
    "speed": 106,
    "crit": 16
  },
  "Violet Sovereign": {
    "hp": 2000,
    "damage": 145,
    "defense": 170,
    "speed": 78,
    "crit": 8
  },
  "Heartbound Guard": {
    "hp": 1700,
    "damage": 135,
    "defense": 160,
    "speed": 85,
    "crit": 6
  },
  "Cursed Arcanist": {
    "hp": 900,
    "damage": 155,
    "defense": 75,
    "speed": 97,
    "crit": 12
  },
  "Wild Magic Echo": {
    "hp": 920,
    "damage": 150,
    "defense": 70,
    "speed": 111,
    "crit": 18
  },
  "Heartwood Tyrant": {
    "hp": 2200,
    "damage": 155,
    "defense": 180,
    "speed": 75,
    "crit": 8
  }
};

export const ENEMY_ABILITY_OVERRIDES = {
  "Briar Guard": {
    "skillAbility": {
      "id": "Thorn Guard",
      "effect": "BARRIER_GUARD_SELF",
      "power": 2.2,
      "duration": 1
    }
  },
  "Gatewood Warden": {
    "skillAbility": {
      "id": "Root Shelter",
      "effect": "BARRIER_TWO",
      "power": 1.4
    },
    "ultimateAbility": {
      "id": "Forest Quake",
      "effect": "DAMAGE_ALL_STUN",
      "power": 1.15,
      "stunChance": 0.25
    }
  },
  "Prismheart Dryad": {
    "skillAbility": {
      "id": "Grove Renewal",
      "effect": "HEAL_LOWEST",
      "power": 1.8
    },
    "ultimateAbility": {
      "id": "Prismatic Frost",
      "effect": "DAMAGE_ALL_CHILL",
      "power": 1.15,
      "duration": 1
    }
  },
  "Denmother Varkai": {
    "skillAbility": {
      "id": "Pack Shelter",
      "effect": "BARRIER_TWO",
      "power": 1.6
    },
    "ultimateAbility": {
      "id": "Winter Howl",
      "effect": "DAMAGE_ALL_CHILL",
      "power": 1.2,
      "duration": 1
    }
  },
  "Root-Crown Colossus": {
    "skillAbility": {
      "id": "Root Shelter",
      "effect": "BARRIER_TWO",
      "power": 1.8
    },
    "ultimateAbility": {
      "id": "Root Quake",
      "effect": "DAMAGE_ALL_STUN",
      "power": 1.2,
      "stunChance": 0.3
    }
  },
  "Hollow Antler": {
    "skillAbility": {
      "id": "Hollow Hunt",
      "effect": "DAMAGE_BACK_LOWEST",
      "power": 1.25
    },
    "ultimateAbility": {
      "id": "Antler Rush",
      "effect": "THREE_LOWEST",
      "power": 1.1,
      "hits": 3
    }
  },
  "Violet Sovereign": {
    "skillAbility": {
      "id": "Violet Ward",
      "effect": "BARRIER_TWO",
      "power": 1.7
    },
    "ultimateAbility": {
      "id": "Curse Surge",
      "effect": "DAMAGE_ALL_BURN",
      "power": 1.15,
      "statusPower": 0.2,
      "duration": 2
    }
  },
  "Heartwood Tyrant": {
    "skillAbility": {
      "id": "Heartwood Ward",
      "effect": "BARRIER_TWO",
      "power": 1.9
    },
    "ultimateAbility": {
      "id": "Heartwood Rupture",
      "effect": "DAMAGE_ALL_STUN",
      "power": 1.3,
      "stunChance": 0.35
    }
  }
};

// Fixed tuning after 200-route baseline; Ancient Roots 9 and Deeper Woods 11 already met their targets.
export const ENEMY_BALANCE_STAGES = {
  "forest-gate-1": {
    "baseLevel": 1,
    "trainingRanks": [
      "COMMON"
    ]
  },
  "forest-gate-2": {
    "baseLevel": 2,
    "trainingRanks": [
      "COMMON"
    ]
  },
  "forest-gate-3": {
    "baseLevel": 3,
    "trainingRanks": [
      "COMMON",
      "COMMON",
      "COMMON"
    ]
  },
  "forest-gate-4": {
    "baseLevel": 4,
    "trainingRanks": [
      "COMMON",
      "RARE",
      "COMMON",
      "COMMON"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      3
    ]
  },
  "forest-gate-5": {
    "baseLevel": 5,
    "trainingRanks": [
      "RARE",
      "RARE",
      "RARE",
      "RARE",
      "EPIC"
    ],
    "levelOffsets": [
      1,
      -2,
      -2,
      -2,
      0
    ]
  },
  "forest-gate-6": {
    "baseLevel": 5,
    "trainingRanks": [
      "RARE",
      "RARE",
      "RARE",
      "COMMON",
      "EPIC"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      2,
      3
    ]
  },
  "forest-gate-7": {
    "baseLevel": 6,
    "trainingRanks": [
      "RARE",
      "COMMON",
      "RARE",
      "COMMON",
      "COMMON"
    ],
    "levelOffsets": [
      -3,
      3,
      0,
      0,
      0
    ]
  },
  "forest-gate-8": {
    "baseLevel": 6,
    "trainingRanks": [
      "EPIC",
      "EPIC",
      "RARE",
      "EPIC"
    ],
    "levelOffsets": [
      -2,
      -2,
      -2,
      -2
    ]
  },
  "forest-gate-9": {
    "baseLevel": 7,
    "trainingRanks": [
      "RARE",
      "RARE",
      "EPIC",
      "RARE",
      "RARE"
    ]
  },
  "forest-gate-10": {
    "baseLevel": 8,
    "trainingRanks": [
      "RARE",
      "COMMON",
      "LEGENDARY",
      "COMMON",
      "RARE"
    ],
    "levelOffsets": [
      0,
      0,
      -3,
      0,
      5
    ]
  },
  "sprite-grove-1": {
    "baseLevel": 8,
    "trainingRanks": [
      "EPIC",
      "EPIC",
      "EPIC"
    ],
    "levelOffsets": [
      3,
      3,
      4
    ]
  },
  "sprite-grove-2": {
    "baseLevel": 9,
    "trainingRanks": [
      "EPIC",
      "EPIC",
      "LEGENDARY"
    ],
    "levelOffsets": [
      0,
      0,
      0
    ]
  },
  "sprite-grove-3": {
    "baseLevel": 9,
    "trainingRanks": [
      "EPIC",
      "EPIC",
      "EPIC"
    ],
    "levelOffsets": [
      3,
      5,
      0
    ]
  },
  "sprite-grove-4": {
    "baseLevel": 10,
    "trainingRanks": [
      "RARE",
      "EPIC",
      "RARE",
      "RARE"
    ],
    "levelOffsets": [
      -2,
      0,
      0,
      0
    ]
  },
  "sprite-grove-5": {
    "baseLevel": 10,
    "trainingRanks": [
      "RARE",
      "EPIC",
      "RARE",
      "EPIC"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      0
    ]
  },
  "sprite-grove-6": {
    "baseLevel": 11,
    "trainingRanks": [
      "EPIC",
      "LEGENDARY",
      "LEGENDARY"
    ],
    "levelOffsets": [
      -3,
      -3,
      -2
    ]
  },
  "sprite-grove-7": {
    "baseLevel": 11,
    "trainingRanks": [
      "COMMON",
      "RARE",
      "RARE",
      "RARE"
    ],
    "levelOffsets": [
      2,
      2,
      2,
      2
    ]
  },
  "sprite-grove-8": {
    "baseLevel": 11,
    "trainingRanks": [
      "RARE",
      "LEGENDARY",
      "RARE",
      "RARE"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      -2
    ]
  },
  "sprite-grove-9": {
    "baseLevel": 12,
    "trainingRanks": [
      "COMMON",
      "COMMON",
      "COMMON",
      "RARE",
      "RARE"
    ],
    "levelOffsets": [
      2,
      2,
      2,
      2,
      2
    ]
  },
  "sprite-grove-10": {
    "baseLevel": 12,
    "trainingRanks": [
      "COMMON",
      "COMMON",
      "RARE",
      "RARE",
      "RARE"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      0,
      0
    ]
  },
  "sprite-grove-11": {
    "baseLevel": 12,
    "trainingRanks": [
      "RARE",
      "RARE",
      "COMMON",
      "COMMON",
      "COMMON"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      0,
      0
    ]
  },
  "sprite-grove-12": {
    "baseLevel": 12,
    "trainingRanks": [
      "RARE",
      "COMMON",
      "EPIC",
      "RARE"
    ],
    "levelOffsets": [
      0,
      0,
      0,
      -2
    ]
  },
  "wolf-den-1": {
    "baseLevel": 13,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Den Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "LEGENDARY",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "EPIC",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 0
      }
    ]
  },
  "wolf-den-2": {
    "baseLevel": 13,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Den Keeper",
        "trainingRank": "LEGENDARY",
        "levelOffset": -3,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "LEGENDARY",
        "levelOffset": -3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "LEGENDARY",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      }
    ]
  },
  "wolf-den-3": {
    "baseLevel": 13,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Den Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Den Keeper",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "RARE",
        "levelOffset": -1,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "wolf-den-4": {
    "baseLevel": 14,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Den Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Den Keeper",
        "trainingRank": "RARE",
        "levelOffset": -3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "wolf-den-5": {
    "baseLevel": 14,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Den Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Den Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "COMMON",
        "levelOffset": -3,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "wolf-den-6": {
    "baseLevel": 15,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Denmother Varkai",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "EPIC",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Moonfang Hunter",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Forest Wolf",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-1": {
    "baseLevel": 15,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Root Warden",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-2": {
    "baseLevel": 15,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-3": {
    "baseLevel": 15,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-4": {
    "baseLevel": 16,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": -1,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-5": {
    "baseLevel": 16,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "LEGENDARY",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-6": {
    "baseLevel": 16,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "LEGENDARY",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": -1,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-7": {
    "baseLevel": 16,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root-Crown Colossus",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "COMMON",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "ancient-roots-8": {
    "baseLevel": 17,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-9": {
    "baseLevel": 17,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-10": {
    "baseLevel": 17,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-11": {
    "baseLevel": 17,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-12": {
    "baseLevel": 17,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-13": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-14": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root Warden",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "ancient-roots-15": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Root-Crown Colossus",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Root Warden",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Thornbound Mage",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Buried Seer",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-1": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-2": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-3": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": -1,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-4": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Hollow Antler",
        "trainingRank": "LEGENDARY",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": -3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-5": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-6": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-7": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-8": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Violet Sovereign",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "deeper-woods-9": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-10": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-11": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-12": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 4,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-13": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-14": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-15": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-16": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-17": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 4,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Cursehorn Beast",
        "trainingRank": "RARE",
        "levelOffset": 4,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "COMMON",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "EPIC",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "deeper-woods-18": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 1.65,
    "enemies": [
      {
        "name": "Violet Sovereign",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Violet Stalker",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Umbral Keeper",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-1": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": -3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-2": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-3": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-4": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-5": {
    "baseLevel": 18,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-6": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "LEGENDARY",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": -3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-7": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.65,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-8": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartwood Tyrant",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      }
    ]
  },
  "heart-of-the-curse-9": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-10": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-11": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 4,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-12": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": -3,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-13": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-14": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.65,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "LEGENDARY",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-15": {
    "baseLevel": 19,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-16": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": -2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": -2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-17": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "LEGENDARY",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-18": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-19": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "EPIC",
        "levelOffset": 2,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 2,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-20": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.65,
    "enemies": [
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Heartbound Guard",
        "trainingRank": "RARE",
        "levelOffset": 0,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "RARE",
        "levelOffset": 3,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "EPIC",
        "levelOffset": 0,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  },
  "heart-of-the-curse-21": {
    "baseLevel": 20,
    "firstClearXpMultiplier": 2.15,
    "enemies": [
      {
        "name": "Heartwood Tyrant",
        "trainingRank": "EPIC",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "FRONT",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 0
      },
      {
        "name": "Wild Magic Echo",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 1
      },
      {
        "name": "Cursed Arcanist",
        "trainingRank": "COMMON",
        "levelOffset": 1,
        "row": "BACK",
        "formationSlot": 2
      }
    ]
  }
};

export const ENEMY_RANKS = {"COMMON":{"index":0,"multiplier":1,"levelCap":20},"RARE":{"index":1,"multiplier":1.2,"levelCap":40},"EPIC":{"index":2,"multiplier":1.44,"levelCap":60},"LEGENDARY":{"index":3,"multiplier":1.73,"levelCap":80},"MYTHIC":{"index":4,"multiplier":2.07,"levelCap":100},"ASCENDED":{"index":5,"multiplier":2.49,"levelCap":120}};

export const ENEMY_BOSS_SPECIES = new Set(["Gatewood Warden","Prismheart Dryad","Denmother Varkai","Root-Crown Colossus","Hollow Antler","Violet Sovereign","Heartwood Tyrant"]);

export const IDLE_SCROLL_MULTIPLIER = 2;
