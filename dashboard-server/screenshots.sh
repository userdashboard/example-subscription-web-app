# To run the tests on linux you may need to install [dependencies for Chrome](https://stackoverflow.com/questions/59112956/cant-use-puppeteer-error-failed-to-launch-chrome):
# sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

if [ ! -d node_modules/puppeteer ] || [ ! -d node_modules/ngrok ]; then
  npm install puppeteer@2.1.1 ngrok --no-save
fi
NODE_ENV="testing" \
APPLICATION_SERVER_TOKEN="this is the token" \
APPLICATION_SERVER="http://localhost:8700" \
APPLICATION_SERVER_PORT=8700 \
START_APPLICATION_SERVER="false" \
DASHBOARD_SERVER="http://localhost:8300" \
STRIPE_JS="false" \
STRIPE_KEY="$SUBSCRIPTIONS_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY" \
SUBSCRIPTION_WEBHOOK_ENDPOINT_SECRET="$SUBSCRIPTIONS_ENDPOINT_SECRET" \
PORT=8300 \
IP=0.0.0.0 \
REQUIRE_SUBSCRIPTION=true \
REQUIRE_PAYMENT=true \
REQUIRE_PAYMENT_AUTHORIZATION=true \
npm test