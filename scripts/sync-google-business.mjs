import fs from 'node:fs/promises';

const required = ['GOOGLE_BUSINESS_CLIENT_ID','GOOGLE_BUSINESS_CLIENT_SECRET','GOOGLE_BUSINESS_REFRESH_TOKEN','GOOGLE_BUSINESS_ACCOUNT_ID','GOOGLE_BUSINESS_LOCATION_ID'];
for (const key of required) if (!process.env[key]) throw new Error(`Fehlendes GitHub Secret: ${key}`);

const prices = JSON.parse(await fs.readFile(new URL('../service-prices.json', import.meta.url), 'utf8'));
const body = new URLSearchParams({
  client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID,
  client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
  refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN,
  grant_type: 'refresh_token'
});
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body});
if (!tokenResponse.ok) throw new Error(`OAuth fehlgeschlagen: ${tokenResponse.status} ${await tokenResponse.text()}`);
const {access_token} = await tokenResponse.json();
const headers = {Authorization:`Bearer ${access_token}`, 'Content-Type':'application/json'};
const account = process.env.GOOGLE_BUSINESS_ACCOUNT_ID.replace(/^accounts\//,'');
const location = process.env.GOOGLE_BUSINESS_LOCATION_ID.replace(/^locations\//,'');
const locationName = `locations/${location}`;

const currentResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=name,title,categories,serviceArea`, {headers});
if (!currentResponse.ok) throw new Error(`Standort konnte nicht gelesen werden: ${currentResponse.status} ${await currentResponse.text()}`);
const current = await currentResponse.json();
const primaryCategory = current.categories?.primaryCategory?.name;
if (!primaryCategory) throw new Error('Keine primäre Google-Unternehmenskategorie gefunden.');

const serviceItems = prices.services.filter(x=>x.googleSync).map(x=>({
  freeFormServiceItem: {
    category: primaryCategory,
    label: {displayName: x.name, description: `${x.category}. ${x.priceType === 'from' ? 'Preis ab' : 'Festpreis'} ${x.price.toFixed(2).replace('.', ',')} EUR. ${prices.notes}`}
  },
  price: {currencyCode: prices.currency, units: String(x.price), nanos: 0}
}));

const serviceListName = `accounts/${account}/locations/${location}/serviceList`;
const updateResponse = await fetch(`https://mybusiness.googleapis.com/v4/${serviceListName}`, {
  method:'PATCH', headers, body:JSON.stringify({name:serviceListName,serviceItems})
});
if (!updateResponse.ok) throw new Error(`Google-Servicepreise konnten nicht aktualisiert werden: ${updateResponse.status} ${await updateResponse.text()}`);
console.log(`Google Business Profile aktualisiert: ${serviceItems.length} Dienstleistungen.`);
