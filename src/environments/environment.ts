// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  mapbox: {
    // production
    // accessToken:
    //   'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZTZyMGdjYzAybGMzbmwxMHA4MnE0enMifQ.tuOhBGsN-M7JCPaUqZ0Hng',
    // local
    accessToken:
      'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZXc1am1hbzBkZ3Yzc280dHVrdHFpZ2MifQ.J13CArZfpEsGLzxXGOJQ7w',
    //surge
    // accessToken:
    //   'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZjZoMzh3bzFtbWQzc256NTV1cGh5ZTkifQ.EVtgiCtpLvPa8QQgMmdVBg',
    // staging
    // accessToken:
    //   'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZHh1OGlkZTBpMmszb29hd3Q2NGxndTQifQ.nv4guJwtP9MN7eSAnm_E0Q',
    styles: {
      terrain: 'mapbox://styles/upri-noah/ckupb1t4ybxq517s530madpso',
      satellite: 'mapbox://styles/upri-noah/ckupb79jmahqr17loikd0hcwi',
      streets: 'mapbox://styles/upri-noah/clhj0bj1301i901pg2ryt9h0j',
    },
  },
  gaTag: 'G-589EMLLFCY',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
