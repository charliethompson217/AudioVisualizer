import json
import urllib.parse

# download songs from https://freemusicarchive.org/ into a new directory

# cd into that directory

# then run this command to remove URL encoding from the file names
"""
find . -type f -name "*%*" | while read -r file; do
  new_name=$(printf "%b" "$(basename "$file" | sed 's/%/\\x/g')")
  mv "$file" "$(dirname "$file")/$new_name"
done
"""

# run this command to generate the list
"""
ls -1 | sed 's/.*/"&",/'
"""

# paste at the of this list here
file_names = [
    "Dee Yan-Key - Ameno.mp3",
    "Dee Yan-Key - Andante  -  Vivace.mp3",
    "Dee Yan-Key - Energico.mp3",
    "Di Bos - La fine del passaggio.mp3",
    "Di Bos - Le domeniche sol'itari'eggiate di una primavera che attende.mp3",
    "Di Bos - Nuvolosa.mp3",
    "Di Bos - Per convenienza hai sgretolato tutto.mp3",
    "Di Bos - Sere solo al bisogno.mp3",
    "Di Bos - Ti avviso tardi apposta.mp3",
    "Di Bos - Yang Cleir.mp3",
    "Elisa Luu - Piano  5-1.mp3",
    "Greg Kirkelie - Inspirational Acoustic and Piano.mp3",
    "Greg Kirkelie - Relaxing Acoustic Guitar, Piano and Drums.mp3",
    "Greg Kirkelie - Uplifting and Inspiring Acoustic Guitar and Piano.mp3",
    "Lobo Loco - Concert of the Wale (ID 1667).mp3",
    "Lobo Loco - Face to Face (ID 1346).mp3",
    "Lobo Loco - Hey lets do it (ID 1755).mp3",
    "Lobo Loco - Hippie Beatnix - Piano (ID 1654).mp3",
    "Lobo Loco - Jazzy Latin Beans (ID 1969).mp3",
    "Lobo Loco - Last River Walz (ID 2080).mp3",
    "Lobo Loco - Madelene (ID 1315).mp3",
    "Lobo Loco - Moonlight Moovie - Piano (ID 1621).mp3",
    "Lobo Loco - Piano Parapentes (ID 1155) - Remastered.mp3",
    "Lobo Loco - Shadow Man (ID 986) - Remastered.mp3",
    "Lobo Loco - Soft Water (ID 2116).mp3",
    "Lobo Loco - Take my Hand - Piano (ID 1698).mp3",
    "Nul Tiel Records - Imagery.mp3",
    "Scott Joplin - Pine Apple Rag (Scott Joplin piano roll).mp3",
    "Universfield - Blissful Serenity.mp3",
    "Universfield - Dramatic Atmosphere with Piano and Violin.mp3",
    "Universfield - Gloomy Reverie.mp3",
    "Universfield - Midnight Secrets.mp3",
    "Universfield - Serene Dreamscape.mp3",
    "Universfield - The Box of Nightmares.mp3",
    "Universfield - This Sunset.mp3",
    "Universfield - Tropical Escapes.mp3",
    "reed blue - sounds piano.mp3",
]

# then run this python script

# Process files
songs = []
for i, file in enumerate(file_names):
    file = file.rsplit(".", 1)[0]
    parts = file.split(" - ", 1)
    if len(parts) == 2:
        artist, title = parts
        songs.append({"artist": artist, "title": title, "fileName": file_names[i]})

# Save to JSON file
with open("songs.json", "w", encoding="utf-8") as f:
    json.dump(songs, f, indent=4, ensure_ascii=False)
print("Songs saved to songs.json")

# then save the new songs.json file to the public directory

# then upload the files to S3