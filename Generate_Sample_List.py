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

# The samples are from:
# https://github.com/nbrosowsky/tonejs-instruments


# SAMPLES RELEASED UNDER CC-BY 3.0

# bass        - Karoryfer
# bassoon     - VSO2
# cello       - Freesound - 12408__flcellogrl__real-cello-notes
# contrabass  - VSO2
# flute       - VSO2
# french horn - VSO2
# guitar ac   - Iowa
# guitar el   - Karoryfer
# guitar ny   - Freesound - 11573__quartertone__classicalguitar-multisampled
# harmonium   - Freesound - 330410__donyaquick__harmonium-samples-all-keys-and-drones
# harp        - VSO2
# organ       - VSO2
# piano       - VSO2
# sax         - Karoryfer
# trombone    - VSO2
# trumpet     - VSO2
# tuba        - VSO2
# violin      - VSO2
# xylophone   - VSO2


# https://freesound.org
# https://www.karoryfer.com/karoryfer-samples
# http://vis.versilstudios.net/vsco-community.html
# http://theremin.music.uiowa.edu/

import re
import json
from pathlib import Path

def parse_directory_tree(root_dir):
    samples = {}
    root_path = Path(root_dir)
    
    for instrument_dir in root_path.iterdir():
        instrument_name = instrument_dir.name
        samples[instrument_name] = {}
        
        note_pattern = re.compile(r'^([A-G][s#]?[1-8])(?:\s*v\d+)?\.mp3$')
        
        files = list(instrument_dir.glob('*.mp3'))
        for file_path in files:
            filename = file_path.name
            match = note_pattern.match(filename)
            if match:
                note = match.group(1)
                if 's' in note:
                    note = note.replace('s', '#')
                if note in samples[instrument_name]:
                    continue
                samples[instrument_name][note] = filename
    
    return samples

root_dir = './samples'
samples = parse_directory_tree(root_dir)

output_file = 'samples.json'
with open(output_file, 'w') as f:
    json.dump(samples, f, indent=2, sort_keys=True)