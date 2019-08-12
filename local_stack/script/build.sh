# Kill node_modules and package-lock for a fresh build
pushd ../backend
rm -rf node_modules
rm package-lock.json

# Rebuild
npm install
popd