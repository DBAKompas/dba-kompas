#!/usr/bin/env bash
# Haalt de foto's en de video voor de homepage (v3) op en zet ze in public/home/.
# Eenmalig draaien vanuit de projectmap:  bash scripts/download-homepage-media.sh
# Bronnen: Unsplash (foto's, Unsplash License) en Mixkit (video, Mixkit Free License).
# Dit zijn tijdelijke stockbeelden. Vervang ze door eigen materiaal met dezelfde bestandsnamen.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/home
U="https://images.unsplash.com"
Q="fm=jpg&q=75&auto=format&fit=crop"
get() { echo "-> $2"; curl -fsSL "$1" -o "public/home/$2"; }

get "$U/photo-1515378791036-0648a3ef77b2?w=1200&$Q" werken.jpg     # Christin Hume
get "$U/photo-1536300099515-6c61b290b654?w=1400&$Q" publiek.jpg    # Joseph Frank
get "$U/photo-1579389083078-4e7018379f7e?w=1400&$Q" privaat.jpg    # Priscilla Du Preez
get "$U/photo-1546795729-f3a5d42087f5?w=2000&$Q"    slot.jpg       # Etienne Boulanger
get "https://assets.mixkit.co/videos/46447/46447-thumb-360-0.jpg" gesprek-poster.jpg

echo "-> gesprek.mp4"
curl -fsSL "https://assets.mixkit.co/videos/46447/46447-720.mp4" -o public/home/gesprek.mp4 \
  || curl -fsSL "https://assets.mixkit.co/videos/46447/46447-360.mp4" -o public/home/gesprek.mp4

echo
ls -lh public/home
echo "Klaar. Controleer dat hierboven 6 bestanden staan en geen ervan 0 bytes is."
