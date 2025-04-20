"""
A free online tool to visualize audio files with spectrogram, waveform, MIDI conversion and more.
Copyright (C) 2024 Charles Thompson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
"""


# download songs from https://freemusicarchive.org
# save them in directories with the license type
# run this script to generate a list of songs
# this script will also remove URL encoding from the filenames
# it will save the filename in the JSON with URL encoding for the frontend

import json
from pathlib import Path
from urllib.parse import quote, unquote

def parse_directory_tree(root_dir):
    songs = []
    root_path = Path(root_dir)
    
    for license_dir in root_path.iterdir():
        if license_dir.is_dir():
            license_type = license_dir.name
            for file in license_dir.iterdir():
                decoded_filename = unquote(file.name)
                encoded_filename = quote(decoded_filename, safe='')
                if file.name != decoded_filename:
                    new_file_path = file.parent / decoded_filename
                    file.rename(new_file_path)

                clean_filename = decoded_filename.replace(".mp3", "")
                if " - " in clean_filename:
                    artist, title = clean_filename.split(" - ", 1)
                    songs.append({
                        "artist": artist,
                        "title": title,
                        "fileName": encoded_filename,
                        "license": license_type
                    })
    return songs

root_dir = './songs'

songs = parse_directory_tree(root_dir)
output_file = 'songs.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(songs, f, indent=2, sort_keys=True, ensure_ascii=False)