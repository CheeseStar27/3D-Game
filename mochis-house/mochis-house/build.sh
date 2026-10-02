#!/bin/sh
# Rebuild mochis-house.html (and the offline copy) from the source parts in src/.
# The parts are joined in filename order, so keep the number prefixes.
set -e
cd "$(dirname "$0")"
cat src/*.html src/*.js > mochis-house.html
sed 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' mochis-house.html > offline/mochis-house.html
echo "Built mochis-house.html and offline/mochis-house.html"
