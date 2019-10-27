VERSION=`cat package.json  | grep version | sed -e 's/.*: "//' | sed -e 's/".*//'`
rm -rf dist
mkdir dist
electron-packager --out dist  . ledgerble --platform=win32 --arch=x64
zip dist/ledgerble-win-"${VERSION}".zip  -r dist/ledgerble-win32-x64/
electron-packager --out dist  . ledgerble --platform=darwin --arch=x64
zip dist/ledgerble-mac-"${VERSION}".zip  -r dist/ledgerble-darwin-x64/
