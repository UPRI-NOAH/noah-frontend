// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  mapbox: {
    accessToken:
      'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNrcmExaDdydzRldWYyb21udmw1ejY3ZDYifQ.cs3Ahz2S6fERoI1BAwFO9g',
    styles: {
      terrain: 'mapbox://styles/upri-noah/ckupb1t4ybxq517s530madpso',
      satellite: 'mapbox://styles/upri-noah/ckupb79jmahqr17loikd0hcwi',
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
