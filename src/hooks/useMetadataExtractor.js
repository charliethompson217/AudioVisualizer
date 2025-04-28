/*
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
*/

import { useState, useEffect } from 'react';
import * as musicMetadata from 'music-metadata';

const uint8ArrayToBase64 = (uint8Array) => {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

export default function useMetadataExtractor(audioFile) {
  const [metadata, setMetadata] = useState({
    title: null,
    artist: null,
    album: null,
    coverArt: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioFile) {
      setMetadata({ title: null, artist: null, album: null, coverArt: null });
      setError(null);
      return;
    }

    const extractMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const metadataResult = await musicMetadata.parseBlob(audioFile);
        const { common } = metadataResult;

        const pictures = common.picture;
        let coverArt = null;
        if (pictures && pictures.length > 0) {
          const picture = pictures[0];
          const mimeType = picture.format?.startsWith('image/')
            ? picture.format
            : picture.format === 'jpeg'
              ? 'image/jpeg'
              : picture.format === 'png'
                ? 'image/png'
                : null;

          if (mimeType && picture.data instanceof Uint8Array) {
            try {
              const base64String = uint8ArrayToBase64(picture.data);
              coverArt = `data:${mimeType};base64,${base64String}`;
            } catch (imgError) {
              console.error('Failed to encode image to base64:', imgError);
              setError('Failed to decode image data');
            }
          } else {
            setError('Invalid or unsupported image format');
          }
        }

        setMetadata({
          title: common.title || null,
          artist: common.artist || null,
          album: common.album || null,
          genre: common.genre?.join(', ') || null,
          mood: common.mood || null,
          bpm: common.bpm || null,
          lyrics: common.lyrics || null,
          coverArt,
        });
      } catch (err) {
        setError(err.message || 'Failed to parse metadata');
        setMetadata({ title: null, artist: null, album: null, coverArt: null });
      } finally {
        setIsLoading(false);
      }
    };

    extractMetadata();
  }, [audioFile]);

  return { metadata, isLoading, error };
}
