/* Preview fixture: 4 read-only samples from Sheets, NOT a 391-spell export. */
(function(root){ const x={
  "schemaVersion": "spell-export/1.0.0-preview",
  "publicationAllowed": false,
  "source": "Google Sheets explicit snapshot",
  "counts": {
    "core": 4,
    "classes": 0,
    "accesses": 0,
    "blocked": 2
  },
  "spells": [
    {
      "spellId": "MAG-0001",
      "spellVersionId": "SPV-XPHB-MAG-0001",
      "stableKey": "XPHB|blade ward",
      "nameEN": "Blade Ward",
      "namePT": "Proteção contra Lâminas",
      "spellLevel": 0,
      "sourceCode": "XPHB",
      "concentration": true,
      "ritual": false,
      "mechanics": {
        "castingTimeJSON": [
          {
            "number": 1,
            "unit": "action",
            "reactionTriggerStatus": null
          }
        ],
        "rangeJSON": {
          "type": "point",
          "distance": {
            "type": "self"
          }
        },
        "componentsJSON": {
          "verbal": true,
          "somatic": true,
          "material": false,
          "materialCostCp": null,
          "consumed": false
        },
        "durationJSON": [
          {
            "type": "timed",
            "duration": {
              "type": "minute",
              "amount": 1
            },
            "concentration": true
          }
        ],
        "savingThrowJSON": [],
        "spellAttackJSON": [],
        "damageTypesJSON": [],
        "areaTagsJSON": [],
        "conditionTagsJSON": [],
        "scalingJSON": {}
      },
      "publicationGate": "REVIEW_REQUIRED"
    },
    {
      "spellId": "MAG-0002",
      "spellVersionId": "SPV-XPHB-MAG-0002",
      "stableKey": "XPHB|chill touch",
      "nameEN": "Chill Touch",
      "namePT": "Toque Arrepiante",
      "spellLevel": 0,
      "sourceCode": "XPHB",
      "concentration": false,
      "ritual": false,
      "mechanics": {
        "castingTimeJSON": [
          {
            "number": 1,
            "unit": "action",
            "reactionTriggerStatus": null
          }
        ],
        "rangeJSON": {
          "type": "point",
          "distance": {
            "type": "touch"
          }
        },
        "componentsJSON": {
          "verbal": true,
          "somatic": true,
          "material": false,
          "materialCostCp": null,
          "consumed": false
        },
        "durationJSON": [
          {
            "type": "instant"
          }
        ],
        "savingThrowJSON": [],
        "spellAttackJSON": [
          "M"
        ],
        "damageTypesJSON": [
          "necrotic"
        ],
        "areaTagsJSON": [
          "ST"
        ],
        "conditionTagsJSON": [],
        "scalingJSON": {
          "label": "Necrotic damage",
          "scaling": {
            "1": "1d10",
            "5": "2d10",
            "11": "3d10",
            "17": "4d10"
          }
        }
      },
      "publicationGate": "REVIEW_REQUIRED"
    },
    {
      "spellId": "MAG-0063",
      "spellVersionId": "SPV-XPHB-MAG-0063",
      "stableKey": "XPHB|dream",
      "nameEN": "Dream",
      "namePT": "Sonho",
      "spellLevel": 5,
      "sourceCode": "XPHB",
      "concentration": false,
      "ritual": false,
      "mechanics": {
        "castingTimeJSON": [
          {
            "number": 1,
            "unit": "minute",
            "reactionTriggerStatus": null
          }
        ],
        "rangeJSON": {
          "type": "point",
          "distance": {
            "type": "self"
          }
        },
        "componentsJSON": {
          "verbal": true,
          "somatic": true,
          "material": true,
          "materialCostCp": null,
          "consumed": false
        },
        "durationJSON": [
          {
            "type": "timed",
            "duration": {
              "type": "hour",
              "amount": 8
            }
          }
        ],
        "savingThrowJSON": [
          "wisdom"
        ],
        "spellAttackJSON": [],
        "damageTypesJSON": [
          "psychic"
        ],
        "areaTagsJSON": [
          "ST"
        ],
        "conditionTagsJSON": [],
        "scalingJSON": {}
      },
      "publicationGate": "BLOCKED"
    },
    {
      "spellId": "MAG-0076",
      "spellVersionId": "SPV-XPHB-MAG-0076",
      "stableKey": "XPHB|tasha's bubbling cauldron",
      "nameEN": "Tasha's Bubbling Cauldron",
      "namePT": "Caldeirão Borbulhante de Tasha",
      "spellLevel": 6,
      "sourceCode": "XPHB",
      "concentration": false,
      "ritual": false,
      "mechanics": {
        "castingTimeJSON": [
          {
            "number": 1,
            "unit": "action",
            "reactionTriggerStatus": null
          }
        ],
        "rangeJSON": {
          "type": "point",
          "distance": {
            "type": "feet",
            "amount": 5
          }
        },
        "componentsJSON": {
          "verbal": true,
          "somatic": true,
          "material": true,
          "materialCostCp": null,
          "consumed": false
        },
        "durationJSON": [
          {
            "type": "timed",
            "duration": {
              "type": "minute",
              "amount": 10
            }
          }
        ],
        "savingThrowJSON": [],
        "spellAttackJSON": [],
        "damageTypesJSON": [],
        "areaTagsJSON": [],
        "conditionTagsJSON": [],
        "scalingJSON": {}
      },
      "publicationGate": "BLOCKED"
    }
  ],
  "classLinks": [],
  "accessLinks": [],
  "sources": [
    {
      "sourceId": "SRC-XPHB-2024",
      "sourceCode": "XPHB",
      "sourceCategory": "CORE_2024"
    }
  ]
};
 if(typeof module==='object'&&module.exports) module.exports=x; if(root)root.SPELL06C_EXPORT=x;
})(typeof globalThis!=='undefined'?globalThis:this);
