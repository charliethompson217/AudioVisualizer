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

# https://www.mutopiaproject.org

# download the midis from the website
# save them in the following directory structure
# /instrument/license/artist/tittle/filename.mid
# run this script to generate a list of midis
# it will save the filepaths in the JSON with URL encoding for the frontend


import json
from pathlib import Path
from urllib.parse import quote

def parse_directory_tree(root_dir):
    midis = []
    root_path = Path(root_dir)
    
    for file_path in root_path.rglob("*.mid"):
        rel_path = file_path.relative_to(root_path)
        
        instrument, license_type, artist, title, filename = rel_path.parts[-5:]
        
        encoded_instrument = quote(instrument)
        encoded_license = quote(license_type)
        encoded_artist = quote(artist)
        encoded_title = quote(title)
        encoded_filename = quote(filename)
        
        encoded_filepath = f"{encoded_instrument}/{encoded_license}/{encoded_artist}/{encoded_title}/{encoded_filename}"
        
        midis.append({
            "instrument": instrument,
            "artist": artist,
            "title": title,
            "filePath": encoded_filepath,
            "license": license_type,
            "filename": filename
        })
    
    return midis

root_dir = './midis'

midis = parse_directory_tree(root_dir)
output_file = 'midis.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(midis, f, indent=2, sort_keys=True, ensure_ascii=False)