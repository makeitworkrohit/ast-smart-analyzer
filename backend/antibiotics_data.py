"""Static catalog of antibiotic categories and names (CLSI-style)."""

ANTIBIOTICS_BY_CATEGORY = {
    "Penicillins & Combinations": [
        "Penicillin", "Ampicillin", "Amoxicillin", "Piperacillin", "Ticarcillin",
        "Amoxicillin-clavulanate", "Ampicillin-sulbactam",
        "Piperacillin-tazobactam", "Ticarcillin-clavulanate",
    ],
    "Cephalosporins": [
        "Cefazolin", "Cephalothin", "Cefuroxime", "Cefixime", "Cefpodoxime",
        "Cefdinir", "Cefotaxime", "Ceftriaxone", "Ceftazidime", "Cefepime",
        "Ceftaroline", "Cefoxitin", "Cefotetan", "Cefoperazone",
    ],
    "Carbapenems": ["Imipenem", "Meropenem", "Ertapenem", "Doripenem"],
    "Monobactams": ["Aztreonam"],
    "Fluoroquinolones": [
        "Ciprofloxacin", "Ofloxacin", "Levofloxacin", "Norfloxacin",
        "Nalidixic acid", "Moxifloxacin",
    ],
    "Aminoglycosides": [
        "Gentamicin", "Amikacin", "Tobramycin", "Netilmicin", "Streptomycin (HLG)",
    ],
    "Macrolides & Lincosamides": [
        "Azithromycin", "Erythromycin", "Clarithromycin", "Clindamycin",
    ],
    "Tetracyclines": ["Doxycycline", "Tetracycline", "Minocycline"],
    "Glycopeptides": ["Vancomycin", "Teicoplanin"],
    "Oxazolidinones": ["Linezolid"],
    "Sulfonamides & Folate Inhibitors": ["Co-trimoxazole", "Trimethoprim"],
    "Phenicols": ["Chloramphenicol"],
    "Urinary Antibiotics": ["Nitrofurantoin", "Fosfomycin"],
    "Polymyxins": ["Colistin", "Polymyxin B"],
    "Others / Special": ["Rifampicin", "Fusidic acid", "Tigecycline"],
}

SAMPLE_TYPES = [
    "Urine", "Blood", "Sputum", "Wound / Pus", "Stool", "CSF",
    "Throat Swab", "Nasal Swab", "Ear Swab", "Eye Swab",
    "Vaginal Swab", "Semen", "Tissue Biopsy", "Pleural Fluid",
    "Peritoneal Fluid", "Synovial Fluid", "Bile", "Catheter Tip",
    "Other",
]


def default_breakpoints(zone_mm: float) -> str:
    """Coarse generic CLSI-style breakpoint fallback used if AI fails.
    Real breakpoints depend on organism+antibiotic; the AI refines this.
    """
    if zone_mm >= 21:
        return "Sensitive"
    if zone_mm >= 15:
        return "Intermediate"
    return "Resistant"
