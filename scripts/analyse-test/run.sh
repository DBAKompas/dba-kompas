#!/usr/bin/env bash
# Proefdraai van de nieuwe analyse (Opus 5.5 + dagdossier). Draaien vanuit de projectmap:
#   bash scripts/analyse-test/run.sh
# Leest de sleutel uit .env.local en toont hem nergens. Resultaten komen in scripts/analyse-test/uit/.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p uit
ENV=../../.env.local
if [ ! -s uit/dossier.txt ] || [ "${1:-}" = "--dossier" ]; then
  echo "Dagdossier samenstellen (met zoeken, kan een paar minuten duren)..."
  python3 test_engine.py "$ENV" dossier_task.txt uit/dossier.json claude-opus-5-5 system_dossier_maker.txt
  python3 -c "import json;d=json.load(open('uit/dossier.json'));open('uit/dossier.txt','w').write(json.dumps(d.get('result') or d.get('raw'),ensure_ascii=False,indent=1))"
else
  echo "Bestaand dagdossier gebruikt (uit/dossier.txt)."
fi
for n in 1 2 3 4; do
  echo "Analyse voorbeeldopdracht $n..."
  python3 test_engine.py "$ENV" case$n.txt uit/analyse$n.json claude-opus-5-5 system_v3_dossier.txt uit/dossier.txt
done
echo "Klaar. Resultaten staan in scripts/analyse-test/uit/"
