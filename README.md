# Audio Visualizer and Synthesizer Application

This application is a React-based web app that allows users to visualize audio input from various sources, including MP3 files, microphone input, and a Synthesizer for MIDI files and a virtual piano keyboard. It utilizes **p5.js** and the **Web Audio API** to provide real-time audio visualization and synthesis.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [1. Install Node.js and npm](#1-install-nodejs-and-npm)
    - [Windows](#windows)
    - [macOS](#macos)
    - [Linux](#linux)
  - [2. Clone the Repository](#2-clone-the-repository)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Run the Development Server](#4-run-the-development-server)
- [Usage](#usage)
  - [Main Features](#main-features)
  - [Virtual Piano Keyboard](#virtual-piano-keyboard)
  - [Visualization](#visualization)
- [License](#license)

## Features
- **Real-time FFT Analysis**: Customize FFT bin sizes, smoothing factors, and decibel thresholds.
- **Audio Visualization**: Visualize audio input from MP3 files, microphone, MIDI files, or a virtual piano keyboard.
- **Harmonic Control**: Adjust harmonic amplitudes for synthesized notes.
- **ADSR Envelope Control**: Modify the Attack, Decay, Sustain, and Release parameters of the envelope generator.
- **Virtual Piano Keyboard**: Play notes using your computer keyboard with octave and volume controls.
- **MIDI File Support**: Play and visualize MIDI files.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js and npm**: You need to have Node.js and npm (Node Package Manager) installed on your machine.

## Installation

Follow these steps to set up and run the project on your local machine.

### 1. Install Node.js and npm:
Node.js is a JavaScript runtime that allows you to run JavaScript on the server side. npm is the default package manager for Node.js.

#### Windows

1. **Download the Installer**:

   - Visit the [Node.js official website](https://nodejs.org/en/download/) and download the Windows installer (.msi) for the LTS (Long Term Support) version.

2. **Run the Installer**:

   - Double-click the downloaded `.msi` file.
   - Follow the prompts in the installer, accepting the license agreement and choosing the default installation settings.

3. **Verify Installation**:

   - Open Command Prompt (`cmd`) or PowerShell.
   - Run the following commands to verify that Node.js and npm are installed:

     ```bash
     node -v
     npm -v
     ```

   - You should see the version numbers of Node.js and npm.

#### macOS

1. **Download the Installer**:

   - Visit the [Node.js official website](https://nodejs.org/en/download/) and download the macOS installer (.pkg) for the LTS version.

2. **Run the Installer**:

   - Double-click the downloaded `.pkg` file.
   - Follow the installation prompts.

3. **Verify Installation**:

   - Open Terminal.
   - Run the following commands:

     ```bash
     node -v
     npm -v
     ```

   - Version numbers should be displayed.

Alternatively, you can use Homebrew to install Node.js:

The script explains what it will do and then pauses before it does it. Read about other [installation options](https://docs.brew.sh/Installation).
1. **Install Homebrew**:
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
2. **Install Node.js**:
```bash
brew update
brew install node
```

#### Linux

1. **Update Package Index:**:

```
sudo apt update
```

2. **Install Node.js and npm**:

```
sudo apt install nodejs npm
```

4. **Verify Installation**:

 ```bash
 node -v
 npm -v
 ```

### 2. Clone the Repository:

You need to clone the project repository from GitHub to your local machine.

1. **Install Git** (if not already installed):

   - **Windows**: Download and install Git from [git-scm.com](https://git-scm.com/download/win).
   - **macOS**: Install via Homebrew:

     ```bash
     brew install git
     ```

   - **Debian/Ubuntu**:

     ```bash
     sudo apt install git
     ```

2. **Clone the Repository**:

   Open your terminal (Command Prompt or PowerShell on Windows) and run:

   ```bash
   git clone https://github.com/charliethompson217/AudioVisualizer.git
   ```
3.	**Navigate to the Project Directory**
   ```
   cd AudioVisualizer
   ```
### 3. Install Dependencies:
Install the required Node.js packages using npm.
```
npm install
```
This command reads the package.json file and installs all listed dependencies into a node_modules folder.

### 4. Run the Development Server:
Start the application in development mode.
```
npm start
```
This command starts the React development server. By default, it runs on http://localhost:3000

Note: If port 3000 is already in use, the terminal will prompt you to use another port (e.g., 3001).

## Usage

Once the development server is running, you can access the application through your web browser.

### Main Features

- **Controls**: Adjust various parameters before starting the visualization:
  - **Bins**: Select FFT bin size (affects frequency resolution).
  - **Min/Max Decibels**: Set decibel thresholds for audio analysis.
  - **Smoothing**: Adjust the smoothing factor for the FFT data.
  - **Labels**: Toggle the display of musical note labels.
  - **Bar**: Toggle the frequency scroll bar.
  - **Piano**: Enable or disable the virtual piano keyboard.
  - **Harmonic Sliders**: Adjust amplitudes of harmonics (visible when piano is enabled).
  - **ADSR Sliders**: Modify the Attack, Decay, Sustain, and Release parameters.

- **Audio Input Options**:
  - **Use Mic**: Click the "Use Mic" button to visualize audio from your microphone.
  - **Upload Files**: Upload local `mp3`, `wav`, `ogg`, or `midi` files.
  - **Song Selection**: Select songs from the dropdown menus, filtered by instrument.

### Virtual Piano Keyboard

- **Enable Piano**: Check the "Piano" checkbox to enable the virtual piano.
- **Play Notes**: Use your computer keyboard to play notes.
  - **Keys**:
    - `z`, `x`, `c`, `v`, `b`, `n`, `m`: Natural notes.
    - `s`, `d`, `g`, `h`, `j`: Sharp notes.
  - **Octave Control**:
    - `Arrow Right`: Increase octave.
    - `Arrow Left`: Decrease octave.
  - **Volume Control**:
    - `Arrow Up`: Increase volume.
    - `Arrow Down`: Decrease volume.
  - **Sustain Pedal**:
    - `Shift`: Hold for sustain.

### Visualization

- Once you click "Play", the application will start visualizing the audio input based on the selected parameters.
- The visualization displays frequency content with musical note correspondence.
- You can interact with the visualization:
  - Hover over frequencies to see exact values and corresponding notes.
  - Adjust parameters in real-time (some may require restarting the visualization).

## License

This project is licensed under the [GNU AFFERO GENERAL PUBLIC LICENSE](LICENSE).
