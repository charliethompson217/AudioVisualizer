import { parseMidi } from 'midi-file';
import CryptoJS from 'crypto-js';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import awsExports from './aws-exports';
Amplify.configure(awsExports);

export async function computeFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}

export function buildNotes(parsedMidi) {
  const notes = [];
  const ticksPerBeat = parsedMidi.header.ticksPerBeat || 480;
  let microsecondsPerBeat = 500000;

  function isSafari() {
    let isSafariBrowser =  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
           navigator.vendor === 'Apple Computer, Inc.' &&
           !window.chrome;
    return isSafariBrowser;
  }
  let offset = 0;
  try {
    if (isSafari()) {
      offset = 0.7;
    }
  } catch (e) { 
    console.error(e);
  }
  
  parsedMidi.tracks.forEach((track) => {
    let currentTime = 0;
    const activeMap = {};
    track.forEach((event) => {
      currentTime += event.deltaTime;
      if (event.meta && event.type === 'setTempo') {
        microsecondsPerBeat = event.microsecondsPerBeat;
      }
      const secondsPerTick = microsecondsPerBeat / 1000000 / ticksPerBeat;
      const eventTimeSec = currentTime * secondsPerTick + offset;
      
      if (event.type === 'noteOn' && event.velocity > 0) {
        activeMap[event.noteNumber] = eventTimeSec;
      } else if (event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0)) {
        const startTime = activeMap[event.noteNumber];
        if (startTime !== undefined) {
          notes.push({
            noteNumber: event.noteNumber,
            startSec: startTime,
            durationSec: eventTimeSec - startTime,
          });
          delete activeMap[event.noteNumber];
        }
      }
    });
  });
  return notes;
}

export async function convertToMidiServer(mp3File, progressCallback) {
  const hash = await computeFileHash(mp3File);
  const midiUrl = `https://song-upload-bucket.s3.amazonaws.com/converted/${hash}.mid`;
  let response = await fetch(midiUrl);

  if (!response.ok) {
    const restOperation = post({
      apiName: 'basicPitchApi',
      path: '/convert/song',
      options: {
        body: {
          objectName: hash + '.mp3',
          contentType: mp3File.type,
        },
      },
    });
    
    const { body } = await restOperation.response;
    const responseBody = await body.json();
    if (responseBody.error) throw new Error(responseBody.error);
    
    await fetch(responseBody.url, {
      method: 'PUT',
      headers: { 'Content-Type': mp3File.type },
      body: mp3File,
    });

    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      attempts++;
      progressCallback((attempts / maxAttempts) * 100);
      await new Promise(resolve => setTimeout(resolve, 10000));
      response = await fetch(midiUrl);
      if (response.ok) break;
    }
    
    if (!response.ok) throw new Error('Conversion timed out');
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  return buildNotes(parseMidi(new Uint8Array(arrayBuffer)));
}