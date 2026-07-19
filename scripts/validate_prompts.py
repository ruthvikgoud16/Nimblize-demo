#!/usr/bin/env python3
"""
Nimblize Prompt Library Validator
Verifies prompt templates against the official Phase 5 schema, checking:
- Valid YAML syntax
- Required fields
- Duplicate Prompt IDs
- Duplicate filenames
- Version formatting (semver)
- Category consistency
- Output format: Clean PASS/FAIL summary
"""

import os
import sys
import re

try:
    import yaml
except ImportError:
    print("Error: PyYAML is required to run the validator. Install with: pip install pyyaml")
    sys.exit(1)

PROMPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../assets/prompts"))
CATEGORIES = [
    "competitor_analysis",
    "seo_analysis",
    "product_recommendation",
    "feature_comparison",
    "market_research",
    "customer_support",
    "report_generation",
    "executive_summary"
]

REQUIRED_FIELDS = [
    "id",
    "category",
    "name",
    "version",
    "purpose",
    "recommended_model",
    "temperature",
    "max_tokens",
    "input_variables",
    "output_schema",
    "prompt_template",
    "example_input",
    "example_output",
    "notes",
    "tags"
]

def validate_prompts():
    ids = {}
    filenames = {}
    files_checked = 0
    errors = []
    
    print("=" * 80)
    print("NIMBLIZE PROMPT LIBRARY SCHEMA VALIDATOR")
    print(f"Target Directory: {PROMPTS_DIR}")
    print("=" * 80)
    
    if not os.path.exists(PROMPTS_DIR):
        print(f"Error: Prompts directory not found at {PROMPTS_DIR}")
        sys.exit(1)
        
    for root, dirs, files in os.walk(PROMPTS_DIR):
        for file in files:
            if not file.endswith((".yaml", ".yml")):
                continue
            
            files_checked += 1
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, PROMPTS_DIR)
            category_dir = os.path.basename(root)
            
            # 1. Validate Category Directory
            if category_dir not in CATEGORIES:
                errors.append(f"[{relpath}] Invalid category folder name: '{category_dir}'")
            
            # 2. Validate Duplicate Filenames
            if file in filenames:
                errors.append(f"[{relpath}] Duplicate filename '{file}' found in multiple paths: {filenames[file]} and {relpath}")
            else:
                filenames[file] = relpath
                
            # 3. Validate Naming Convention
            pattern = r"^[A-Z]{2,3}-\d{3}_[a-z0-9_]+\.(yaml|yml)$"
            if not re.match(pattern, file):
                errors.append(f"[{relpath}] Filename does not follow naming convention: '<PREFIX>-<NNN>_name.yaml'")
            
            # 4. Parse YAML and Validate Syntax
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
            except Exception as e:
                errors.append(f"[{relpath}] Valid YAML syntax check FAILED: {str(e)}")
                continue
                
            if not isinstance(data, dict):
                errors.append(f"[{relpath}] Schema error: Root element must be a dictionary/mapping")
                continue
                
            # 5. Check Required Fields
            for field in REQUIRED_FIELDS:
                if field not in data:
                    errors.append(f"[{relpath}] Missing required field: '{field}'")
                    
            # 6. Validate Unique ID and Prefix matching Folder
            pid = data.get("id")
            if pid:
                if pid in ids:
                    errors.append(f"[{relpath}] Duplicate ID '{pid}' found. Collision with {ids[pid]}")
                else:
                    ids[pid] = relpath
                    
                # Check Prefix
                prefix = pid.split('-')[0]
                expected_prefix = {
                    "CA": "competitor_analysis",
                    "SEO": "seo_analysis",
                    "PR": "product_recommendation",
                    "FC": "feature_comparison",
                    "MR": "market_research",
                    "CS": "customer_support",
                    "RG": "report_generation",
                    "ES": "executive_summary"
                }.get(prefix)
                if expected_prefix != category_dir:
                    errors.append(f"[{relpath}] ID prefix '{prefix}' does not match category directory '{category_dir}'")
            
            # 7. Validate Category Field consistency
            cat = data.get("category")
            if cat and cat != category_dir:
                errors.append(f"[{relpath}] Category field '{cat}' does not match directory '{category_dir}'")
                
            # 8. Validate Version format (semver)
            ver = data.get("version")
            if ver:
                if not re.match(r"^\d+\.\d+\.\d+$", str(ver)):
                    errors.append(f"[{relpath}] Version '{ver}' is not valid semantic versioning (X.Y.Z)")

    print("-" * 80)
    print(f"Validation summary: Checked {files_checked} files.")
    
    if errors:
        print(f"STATUS: 🔴 FAIL - Found {len(errors)} validation errors:")
        for err in errors:
            print(f"  - {err}")
        print("-" * 80)
        return False
    else:
        print("STATUS: 🟢 PASS - All prompt schemas are completely valid and consistent!")
        print("-" * 80)
        return True

if __name__ == "__main__":
    success = validate_prompts()
    sys.exit(0 if success else 1)
