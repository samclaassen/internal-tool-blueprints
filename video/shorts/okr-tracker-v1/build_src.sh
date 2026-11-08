# gap_src.mp4: still of the gap-9 panel from the F22 render; build_src.mp4: the OKRs screenshot (public/builds/okr-tracker/test-okrs.webp)
ffmpeg -v error -y -ss 107.5 -i long.mp4 -frames:v 1 g.png && ffmpeg -v error -y -loop 1 -i g.png -t 11 -r 30 -c:v libx264 -pix_fmt yuv420p gap_src.mp4
ffmpeg -v error -y -i test-okrs.webp okrs.png && ffmpeg -v error -y -loop 1 -i okrs.png -t 11 -r 30 -c:v libx264 -pix_fmt yuv420p -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" build_src.mp4
ffmpeg -v error -y -ss 151.5 -i long.mp4 -frames:v 1 v.png && ffmpeg -v error -y -loop 1 -i v.png -t 11 -r 30 -c:v libx264 -pix_fmt yuv420p verdict_src.mp4
