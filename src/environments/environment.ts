// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api/',
    imgStorageUrl: 'assets/images/',
    APIimgStorageUrl: 'http://localhost:3000/',
    allowedCountries: ['FR'],
    comingSoonCountries: ['DE', 'ES', 'IT', 'NL', 'PT'],
    comingSoonCountriesDate: '2026-01-01',
    comingSoonCountries2: ['SV', 'PL', 'DA', 'FI', 'DA'],
    comingSoonCountries2Date: '2027-01-01',
    // mqttBrokerUrl: 'ws://localhost:5230/ws',
    // mqttClientIdPrefix: "FrontEndClient",
    // mqttUserName: "FrontClient",
    // mqttPassword: "pwd"
};
