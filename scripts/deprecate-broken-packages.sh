#!/bin/bash
set -e

echo "⚠️  Deprecating broken 0.1.0 packages on npm..."
echo ""
echo "These packages have workspace:* dependencies which don't work on npm."
echo "We'll mark them as deprecated and publish 0.1.1 with correct dependencies."
echo ""

# Array of all published packages
packages=(
  "@iterumarchive/neo-calendar"
  "@iterumarchive/neo-calendar-core"
  "@iterumarchive/neo-calendar-full"
  "@iterumarchive/neo-calendar-before-present"
  "@iterumarchive/neo-calendar-coptic"
  "@iterumarchive/neo-calendar-ethiopian"
  "@iterumarchive/neo-calendar-french-revolutionary"
  "@iterumarchive/neo-calendar-gregorian"
  "@iterumarchive/neo-calendar-hebrew"
  "@iterumarchive/neo-calendar-holocene"
  "@iterumarchive/neo-calendar-islamic"
  "@iterumarchive/neo-calendar-julian"
  "@iterumarchive/neo-calendar-mayan"
  "@iterumarchive/neo-calendar-persian"
  "@iterumarchive/neo-calendar-unix"
)

echo "🔒 You'll need your 2FA OTP code from your authenticator app."
read -p "Enter your OTP code: " otp

for pkg in "${packages[@]}"; do
  echo "Deprecating $pkg@0.1.0..."
  npm deprecate "$pkg@0.1.0" "Broken package - has workspace:* dependencies. Please use 0.1.1 or later." --otp "$otp" || true
done

echo ""
echo "✅ Deprecated all 0.1.0 versions"
echo ""
echo "Users trying to install 0.1.0 will see a deprecation warning pointing them to 0.1.1"
