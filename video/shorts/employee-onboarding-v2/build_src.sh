# build_src.mp4: My first weeks screenshot; gap_src.mp4: Onboarding (full checklist) screenshot; untested_src.mp4: still of the F16 render's not-tested scene at 127.5 s
ffmpeg -v error -y -i test-first-weeks.webp fw.png && ffmpeg -v error -y -loop 1 -i fw.png -t 14 -r 30 -c:v libx264 -pix_fmt yuv420p build_src.mp4
ffmpeg -v error -y -i test-onboarding.webp ob.png && ffmpeg -v error -y -loop 1 -i ob.png -t 14 -r 30 -c:v libx264 -pix_fmt yuv420p gap_src.mp4
ffmpeg -v error -y -ss 127.5 -i long.mp4 -frames:v 1 u.png && ffmpeg -v error -y -loop 1 -i u.png -t 14 -r 30 -c:v libx264 -pix_fmt yuv420p untested_src.mp4
