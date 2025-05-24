/**
 * NosytOS95 Media Player Application
 * A Windows 95-style media player with audio playback capabilities
 */

class NosytMediaPlayer {
    constructor() {
        this.isPlayerOpen = false;
        this.audio = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.isMuted = false;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isRepeat = false;
        this.isShuffle = false;
        
        // Demo tracks (you can replace with actual audio files)
        this.demoTracks = [
            {
                title: 'Windows 95 Startup',
                artist: 'Microsoft',
                duration: '00:06',
                url: '/audio/windows95-startup.mp3',
                isDemo: true
            },
            {
                title: 'Nostalgic Beats',
                artist: 'NosytLabs',
                duration: '03:24',
                url: '/audio/demo-track-1.mp3',
                isDemo: true
            },
            {
                title: 'Retro Vibes',
                artist: 'NosytLabs',
                duration: '02:45',
                url: '/audio/demo-track-2.mp3',
                isDemo: true
            }
        ];
        
        this.init();
    }

    init() {
        console.log('🎵 NosytMediaPlayer initialized');
        this.playlist = [...this.demoTracks];
    }

    openMediaPlayer() {
        if (this.isPlayerOpen) {
            const existingWindow = document.querySelector('.window[data-app="mediaplayer"]');
            if (existingWindow) {
                window.windowManager.focusWindow(existingWindow);
                return;
            }
        }

        const playerWindow = this.createPlayerWindow();
        document.body.appendChild(playerWindow);
        
        if (window.windowManager) {
            window.windowManager.initializeWindow(playerWindow);
        }
        
        this.isPlayerOpen = true;
        this.setupEventListeners(playerWindow);
        this.updatePlaylist(playerWindow);
        this.updateDisplay(playerWindow);
    }

    createPlayerWindow() {
        const windowElement = document.createElement('div');
        windowElement.className = 'window mediaplayer-window';
        windowElement.setAttribute('data-app', 'mediaplayer');
        windowElement.style.cssText = `
            width: 480px;
            height: 360px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        `;

        windowElement.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">Media Player</div>
                <div class="title-bar-controls">
                    <button class="minimize-btn" aria-label="Minimize"></button>
                    <button class="close-btn" aria-label="Close"></button>
                </div>
            </div>
            
            <div class="menu-bar">
                <div class="menu-item" data-menu="file">File</div>
                <div class="menu-item" data-menu="play">Play</div>
                <div class="menu-item" data-menu="view">View</div>
                <div class="menu-item" data-menu="help">Help</div>
            </div>
            
            <div class="player-body">
                <div class="display-area">
                    <div class="track-info">
                        <div class="track-title">No track selected</div>
                        <div class="track-artist">Select a track to play</div>
                    </div>
                    
                    <div class="time-display">
                        <span class="current-time">00:00</span>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                                <div class="progress-handle"></div>
                            </div>
                        </div>
                        <span class="total-time">00:00</span>
                    </div>
                </div>
                
                <div class="controls-area">
                    <div class="main-controls">
                        <button class="control-btn" id="prev-btn" title="Previous">⏮️</button>
                        <button class="control-btn play-pause-btn" id="play-pause-btn" title="Play">▶️</button>
                        <button class="control-btn" id="next-btn" title="Next">⏭️</button>
                        <button class="control-btn" id="stop-btn" title="Stop">⏹️</button>
                    </div>
                    
                    <div class="secondary-controls">
                        <button class="control-btn small" id="repeat-btn" title="Repeat">🔁</button>
                        <button class="control-btn small" id="shuffle-btn" title="Shuffle">🔀</button>
                        
                        <div class="volume-control">
                            <button class="control-btn small" id="mute-btn" title="Mute">🔊</button>
                            <input type="range" class="volume-slider" min="0" max="100" value="70">
                        </div>
                    </div>
                </div>
                
                <div class="playlist-area">
                    <div class="playlist-header">
                        <span>Playlist</span>
                        <div class="playlist-controls">
                            <button class="small-btn" id="add-track-btn" title="Add Track">+</button>
                            <button class="small-btn" id="remove-track-btn" title="Remove Track">-</button>
                        </div>
                    </div>
                    <div class="playlist-container">
                        <div class="playlist-items"></div>
                    </div>
                </div>
            </div>
            
            <div class="status-bar">
                <span class="status-text">Ready</span>
                <span class="track-count">0 tracks</span>
            </div>
        `;

        return windowElement;
    }

    setupEventListeners(windowElement) {
        const closeBtn = windowElement.querySelector('.close-btn');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeMediaPlayer(windowElement);
        });

        minimizeBtn.addEventListener('click', () => {
            if (window.windowManager) {
                window.windowManager.minimizeWindow(windowElement);
            }
        });

        // Control buttons
        const playPauseBtn = windowElement.querySelector('#play-pause-btn');
        const prevBtn = windowElement.querySelector('#prev-btn');
        const nextBtn = windowElement.querySelector('#next-btn');
        const stopBtn = windowElement.querySelector('#stop-btn');
        const repeatBtn = windowElement.querySelector('#repeat-btn');
        const shuffleBtn = windowElement.querySelector('#shuffle-btn');
        const muteBtn = windowElement.querySelector('#mute-btn');

        playPauseBtn.addEventListener('click', () => this.togglePlayPause(windowElement));
        prevBtn.addEventListener('click', () => this.previousTrack(windowElement));
        nextBtn.addEventListener('click', () => this.nextTrack(windowElement));
        stopBtn.addEventListener('click', () => this.stopPlayback(windowElement));
        repeatBtn.addEventListener('click', () => this.toggleRepeat(windowElement));
        shuffleBtn.addEventListener('click', () => this.toggleShuffle(windowElement));
        muteBtn.addEventListener('click', () => this.toggleMute(windowElement));

        // Volume control
        const volumeSlider = windowElement.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', () => {
            this.setVolume(volumeSlider.value / 100, windowElement);
        });

        // Progress bar
        const progressContainer = windowElement.querySelector('.progress-container');
        progressContainer.addEventListener('click', (e) => {
            this.seekTo(e, windowElement);
        });

        // Playlist controls
        const addTrackBtn = windowElement.querySelector('#add-track-btn');
        const removeTrackBtn = windowElement.querySelector('#remove-track-btn');
        
        addTrackBtn.addEventListener('click', () => this.addTrack(windowElement));
        removeTrackBtn.addEventListener('click', () => this.removeTrack(windowElement));

        // Menu events
        const menuItems = windowElement.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                this.handleMenuClick(item.dataset.menu, windowElement);
            });
        });

        // Keyboard shortcuts
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyPress(e, windowElement);
        });

        // Make window focusable for keyboard events
        windowElement.setAttribute('tabindex', '0');
        windowElement.focus();
    }

    updatePlaylist(windowElement) {
        const playlistItems = windowElement.querySelector('.playlist-items');
        playlistItems.innerHTML = '';

        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === this.currentTrackIndex ? 'active' : ''}`;
            item.dataset.index = index;
            
            item.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-details">
                    <div class="track-name">${track.title}</div>
                    <div class="track-info">${track.artist} - ${track.duration}</div>
                </div>
                <div class="track-status">${index === this.currentTrackIndex && this.isPlaying ? '🎵' : ''}</div>
            `;

            item.addEventListener('click', () => {
                this.selectTrack(index, windowElement);
            });

            item.addEventListener('dblclick', () => {
                this.selectTrack(index, windowElement);
                this.play(windowElement);
            });

            playlistItems.appendChild(item);
        });

        // Update track count
        const trackCount = windowElement.querySelector('.track-count');
        trackCount.textContent = `${this.playlist.length} track${this.playlist.length !== 1 ? 's' : ''}`;
    }

    selectTrack(index, windowElement) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            this.currentTrack = this.playlist[index];
            this.updateDisplay(windowElement);
            this.updatePlaylist(windowElement);
        }
    }

    updateDisplay(windowElement) {
        const trackTitle = windowElement.querySelector('.track-title');
        const trackArtist = windowElement.querySelector('.track-artist');
        const currentTimeEl = windowElement.querySelector('.current-time');
        const totalTimeEl = windowElement.querySelector('.total-time');
        const progressFill = windowElement.querySelector('.progress-fill');
        const progressHandle = windowElement.querySelector('.progress-handle');

        if (this.currentTrack) {
            trackTitle.textContent = this.currentTrack.title;
            trackArtist.textContent = this.currentTrack.artist;
            totalTimeEl.textContent = this.currentTrack.duration;
        } else {
            trackTitle.textContent = 'No track selected';
            trackArtist.textContent = 'Select a track to play';
            totalTimeEl.textContent = '00:00';
        }

        // Update progress
        if (this.audio && this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        } else {
            progressFill.style.width = '0%';
            progressHandle.style.left = '0%';
            currentTimeEl.textContent = '00:00';
        }
    }

    togglePlayPause(windowElement) {
        if (this.isPlaying) {
            this.pause(windowElement);
        } else {
            this.play(windowElement);
        }
    }

    play(windowElement) {
        if (!this.currentTrack) {
            if (this.playlist.length > 0) {
                this.selectTrack(0, windowElement);
            } else {
                this.showStatus('No tracks in playlist', windowElement);
                return;
            }
        }

        // For demo purposes, we'll simulate audio playback
        if (this.currentTrack.isDemo) {
            this.simulatePlayback(windowElement);
        } else {
            this.playActualAudio(windowElement);
        }
    }

    simulatePlayback(windowElement) {
        this.isPlaying = true;
        this.duration = this.parseDuration(this.currentTrack.duration);
        this.currentTime = 0;

        const playPauseBtn = windowElement.querySelector('#play-pause-btn');
        playPauseBtn.textContent = '⏸️';
        playPauseBtn.title = 'Pause';

        this.showStatus(`Playing: ${this.currentTrack.title}`, windowElement);
        this.updatePlaylist(windowElement);

        // Simulate playback progress
        this.playbackInterval = setInterval(() => {
            if (this.isPlaying) {
                this.currentTime += 1;
                this.updateDisplay(windowElement);

                if (this.currentTime >= this.duration) {
                    this.nextTrack(windowElement);
                }
            }
        }, 1000);
    }

    playActualAudio(windowElement) {
        if (this.audio) {
            this.audio.pause();
        }

        this.audio = new Audio(this.currentTrack.url);
        this.audio.volume = this.volume;

        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateDisplay(windowElement);
        });

        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateDisplay(windowElement);
        });

        this.audio.addEventListener('ended', () => {
            this.nextTrack(windowElement);
        });

        this.audio.addEventListener('error', () => {
            this.showStatus('Error loading audio file', windowElement);
            this.simulatePlayback(windowElement); // Fallback to simulation
        });

        this.audio.play().then(() => {
            this.isPlaying = true;
            const playPauseBtn = windowElement.querySelector('#play-pause-btn');
            playPauseBtn.textContent = '⏸️';
            playPauseBtn.title = 'Pause';
            this.showStatus(`Playing: ${this.currentTrack.title}`, windowElement);
            this.updatePlaylist(windowElement);
        }).catch(() => {
            this.simulatePlayback(windowElement); // Fallback to simulation
        });
    }

    pause(windowElement) {
        this.isPlaying = false;
        
        if (this.audio) {
            this.audio.pause();
        }
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
        }

        const playPauseBtn = windowElement.querySelector('#play-pause-btn');
        playPauseBtn.textContent = '▶️';
        playPauseBtn.title = 'Play';

        this.showStatus('Paused', windowElement);
        this.updatePlaylist(windowElement);
    }

    stopPlayback(windowElement) {
        this.isPlaying = false;
        this.currentTime = 0;
        
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
        }

        const playPauseBtn = windowElement.querySelector('#play-pause-btn');
        playPauseBtn.textContent = '▶️';
        playPauseBtn.title = 'Play';

        this.showStatus('Stopped', windowElement);
        this.updateDisplay(windowElement);
        this.updatePlaylist(windowElement);
    }

    previousTrack(windowElement) {
        if (this.currentTrackIndex > 0) {
            this.selectTrack(this.currentTrackIndex - 1, windowElement);
            if (this.isPlaying) {
                this.play(windowElement);
            }
        } else if (this.isRepeat && this.playlist.length > 0) {
            this.selectTrack(this.playlist.length - 1, windowElement);
            if (this.isPlaying) {
                this.play(windowElement);
            }
        }
    }

    nextTrack(windowElement) {
        let nextIndex;
        
        if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = this.currentTrackIndex + 1;
        }

        if (nextIndex < this.playlist.length) {
            this.selectTrack(nextIndex, windowElement);
            if (this.isPlaying) {
                this.play(windowElement);
            }
        } else if (this.isRepeat && this.playlist.length > 0) {
            this.selectTrack(0, windowElement);
            if (this.isPlaying) {
                this.play(windowElement);
            }
        } else {
            this.stopPlayback(windowElement);
        }
    }

    toggleRepeat(windowElement) {
        this.isRepeat = !this.isRepeat;
        const repeatBtn = windowElement.querySelector('#repeat-btn');
        repeatBtn.style.background = this.isRepeat ? '#0078d4' : '';
        repeatBtn.style.color = this.isRepeat ? 'white' : '';
        this.showStatus(`Repeat ${this.isRepeat ? 'on' : 'off'}`, windowElement);
    }

    toggleShuffle(windowElement) {
        this.isShuffle = !this.isShuffle;
        const shuffleBtn = windowElement.querySelector('#shuffle-btn');
        shuffleBtn.style.background = this.isShuffle ? '#0078d4' : '';
        shuffleBtn.style.color = this.isShuffle ? 'white' : '';
        this.showStatus(`Shuffle ${this.isShuffle ? 'on' : 'off'}`, windowElement);
    }

    toggleMute(windowElement) {
        this.isMuted = !this.isMuted;
        const muteBtn = windowElement.querySelector('#mute-btn');
        const volumeSlider = windowElement.querySelector('.volume-slider');
        
        if (this.isMuted) {
            muteBtn.textContent = '🔇';
            if (this.audio) this.audio.volume = 0;
        } else {
            muteBtn.textContent = '🔊';
            if (this.audio) this.audio.volume = this.volume;
        }
        
        volumeSlider.disabled = this.isMuted;
    }

    setVolume(volume, windowElement) {
        this.volume = volume;
        if (this.audio && !this.isMuted) {
            this.audio.volume = volume;
        }
        
        const muteBtn = windowElement.querySelector('#mute-btn');
        if (volume === 0) {
            muteBtn.textContent = '🔇';
        } else if (volume < 0.5) {
            muteBtn.textContent = '🔉';
        } else {
            muteBtn.textContent = '🔊';
        }
    }

    seekTo(e, windowElement) {
        if (!this.currentTrack || this.duration === 0) return;
        
        const progressContainer = e.currentTarget;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.duration;
        
        this.currentTime = newTime;
        
        if (this.audio) {
            this.audio.currentTime = newTime;
        }
        
        this.updateDisplay(windowElement);
    }

    addTrack(windowElement) {
        const title = prompt('Enter track title:');
        if (title) {
            const artist = prompt('Enter artist name:') || 'Unknown Artist';
            const url = prompt('Enter audio file URL (optional):') || '';
            
            const newTrack = {
                title,
                artist,
                duration: '00:00',
                url,
                isDemo: !url
            };
            
            this.playlist.push(newTrack);
            this.updatePlaylist(windowElement);
            this.showStatus(`Added: ${title}`, windowElement);
        }
    }

    removeTrack(windowElement) {
        const selectedItems = windowElement.querySelectorAll('.playlist-item.active');
        if (selectedItems.length > 0) {
            const index = parseInt(selectedItems[0].dataset.index);
            const removedTrack = this.playlist[index];
            
            this.playlist.splice(index, 1);
            
            if (index === this.currentTrackIndex) {
                this.stopPlayback(windowElement);
                this.currentTrack = null;
                this.currentTrackIndex = 0;
            } else if (index < this.currentTrackIndex) {
                this.currentTrackIndex--;
            }
            
            this.updatePlaylist(windowElement);
            this.updateDisplay(windowElement);
            this.showStatus(`Removed: ${removedTrack.title}`, windowElement);
        } else {
            this.showStatus('No track selected', windowElement);
        }
    }

    parseDuration(durationStr) {
        const parts = durationStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showStatus(message, windowElement) {
        const statusText = windowElement.querySelector('.status-text');
        statusText.textContent = message;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusText.textContent = 'Ready';
        }, 3000);
    }

    handleKeyPress(e, windowElement) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause(windowElement);
                break;
            case 'ArrowRight':
                this.nextTrack(windowElement);
                break;
            case 'ArrowLeft':
                this.previousTrack(windowElement);
                break;
            case 'Escape':
                this.stopPlayback(windowElement);
                break;
        }
    }

    handleMenuClick(menu, windowElement) {
        switch (menu) {
            case 'file':
                this.showFileMenu(windowElement);
                break;
            case 'play':
                this.showPlayMenu(windowElement);
                break;
            case 'help':
                alert('NosytOS95 Media Player v1.0\n\nKeyboard shortcuts:\nSpace: Play/Pause\nLeft Arrow: Previous track\nRight Arrow: Next track\nEscape: Stop\n\nSupports MP3, WAV, and OGG audio files.');
                break;
        }
    }

    showFileMenu(windowElement) {
        // Implementation for file menu
        alert('File menu - Add file loading functionality here');
    }

    showPlayMenu(windowElement) {
        // Implementation for play menu
        alert('Play menu - Add playback options here');
    }

    closeMediaPlayer(windowElement) {
        this.stopPlayback(windowElement);
        
        if (windowElement) {
            windowElement.remove();
        }
        
        this.isPlayerOpen = false;
        this.audio = null;
        this.currentTrack = null;
    }
}

// Initialize media player
window.nosytMediaPlayer = new NosytMediaPlayer();

// Add media player styles
const mediaPlayerStyles = document.createElement('style');
mediaPlayerStyles.textContent = `
    .mediaplayer-window {
        font-family: 'MS Sans Serif', sans-serif;
        display: flex;
        flex-direction: column;
    }

    .menu-bar {
        background: #c0c0c0;
        border-bottom: 1px solid #808080;
        display: flex;
        padding: 2px;
        font-size: 11px;
    }

    .menu-item {
        padding: 4px 8px;
        cursor: pointer;
        user-select: none;
    }

    .menu-item:hover {
        background: #0078d4;
        color: white;
    }

    .player-body {
        flex: 1;
        background: #c0c0c0;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .display-area {
        background: #000;
        color: #00ff00;
        padding: 8px;
        border: 2px inset #c0c0c0;
        font-family: 'Courier New', monospace;
    }

    .track-info {
        margin-bottom: 8px;
    }

    .track-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2px;
    }

    .track-artist {
        font-size: 12px;
        opacity: 0.8;
    }

    .time-display {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
    }

    .progress-container {
        flex: 1;
        height: 16px;
        background: #333;
        border: 1px inset #000;
        position: relative;
        cursor: pointer;
    }

    .progress-bar {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .progress-fill {
        height: 100%;
        background: #00ff00;
        width: 0%;
        transition: width 0.1s;
    }

    .progress-handle {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 12px;
        background: #00ff00;
        left: 0%;
        transition: left 0.1s;
    }

    .controls-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
    }

    .main-controls {
        display: flex;
        gap: 4px;
    }

    .control-btn {
        width: 40px;
        height: 32px;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .control-btn:hover {
        background: #d4d0c8;
    }

    .control-btn:active {
        border: 2px inset #c0c0c0;
    }

    .control-btn.small {
        width: 28px;
        height: 24px;
        font-size: 12px;
    }

    .secondary-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .volume-control {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .volume-slider {
        width: 80px;
    }

    .playlist-area {
        flex: 1;
        border: 2px inset #c0c0c0;
        background: white;
        display: flex;
        flex-direction: column;
    }

    .playlist-header {
        background: #c0c0c0;
        padding: 4px 8px;
        border-bottom: 1px solid #808080;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        font-weight: bold;
    }

    .playlist-controls {
        display: flex;
        gap: 2px;
    }

    .small-btn {
        width: 20px;
        height: 16px;
        background: #c0c0c0;
        border: 1px outset #c0c0c0;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .small-btn:hover {
        background: #d4d0c8;
    }

    .small-btn:active {
        border: 1px inset #c0c0c0;
    }

    .playlist-container {
        flex: 1;
        overflow-y: auto;
    }

    .playlist-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        cursor: pointer;
        border-bottom: 1px solid #e0e0e0;
        font-size: 11px;
    }

    .playlist-item:hover {
        background: #f0f0f0;
    }

    .playlist-item.active {
        background: #0078d4;
        color: white;
    }

    .track-number {
        width: 24px;
        text-align: center;
        font-weight: bold;
    }

    .track-details {
        flex: 1;
        margin-left: 8px;
    }

    .track-name {
        font-weight: bold;
        margin-bottom: 2px;
    }

    .track-info {
        opacity: 0.7;
        font-size: 10px;
    }

    .track-status {
        width: 20px;
        text-align: center;
    }

    .status-bar {
        background: #c0c0c0;
        border-top: 1px solid #808080;
        padding: 4px 8px;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
    }
`;

document.head.appendChild(mediaPlayerStyles);

console.log('🎵 Media Player application loaded successfully');
