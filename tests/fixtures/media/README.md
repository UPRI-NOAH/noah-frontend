# Media fixtures

Three-second, 16×16 black videos (5 fps) served by the e2e network mock in place of the
Himawari satellite loops (`webgis-static.up.edu.ph/api/sat_webm/*`).

Mapbox GL only reports the map as loaded once every video source has a
decodable frame, and Mapbox Draw (the Studio measuring tools) waits for that,
so the mock must return real, playable video.

Regenerate with:

```sh
ffmpeg -f lavfi -i color=c=black:s=16x16:r=5:d=3 -c:v libvpx -b:v 8k -auto-alt-ref 0 -an blank.webm
ffmpeg -f lavfi -i color=c=black:s=16x16:r=5:d=3 -c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart -an blank.mp4
```

Keep several frames: Chromium never reaches `HAVE_CURRENT_DATA` for a
looping single-frame video, which would leave the map "not loaded".
